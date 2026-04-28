#!/usr/bin/env python3
"""
CogniTrack MedGemma Inference Server
=====================================
Model:   unsloth/medgemma-1.5-4b-it-GGUF
File:    medgemma-1.5-4b-it-UD-Q8_K_XL.gguf
Runtime: llama-cpp-python (keeps Q8 natively in RAM — no float32 expansion)
Device:  CPU only (n_gpu_layers=0)

Pipeline:
  1. Rule-based extractor  — computes numeric biomarkers deterministically from
     the timestamped transcript (no LLM, no hallucination risk).
  2. MedGemma via llama.cpp — receives transcript + pre-computed numbers and
     produces: syntactic_complexity, dementia_risk_level, confidence_score,
     and XAI explanatory summaries for each biomarker.

NOTE: trend_direction is NOT computed here. It requires comparing this recording
against previous recordings for the same patient — that logic belongs in the
backend (query biomarker_analysis history for the patient, then compute trend).

POST /chat
  Request:  { "prompt": "<timestamped transcript>", "max_new_tokens": 600 }
  Response: {
    "mlu_score", "pause_ratio", "type_token_ratio", "filler_word_count",
    "syntactic_complexity", "dementia_risk_level", "confidence_score",
    "biomarker_summaries": {
      "mlu_score":           { "value": ..., "summary": "..." },
      "pause_ratio":         { "value": ..., "summary": "..." },
      "type_token_ratio":    { "value": ..., "summary": "..." },
      "filler_word_count":   { "value": ..., "summary": "..." },
      "syntactic_complexity":{ "value": ..., "summary": "..." },
      "overall_risk":        { "value": "...", "summary": "..." }
    },
    "medgemma_latency_sec", "raw_response"
  }

GET  /health
GET  /v1/models

Run:
  tmux new -s medgemma
  source ~/.medgemma-venv/bin/activate
  cd /home/ubuntu
  python medgemma_cpu_infer.py
  # Detach: Ctrl-b then d

Demo (no HTTP server):
  python medgemma_cpu_infer.py --demo
"""
from __future__ import annotations

import json
import re
import sys
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any, Literal

from llama_cpp import Llama
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# ── Model config ──────────────────────────────────────────────────────────────
GGUF_PATH         = "/home/ubuntu/medgemma-gguf/medgemma-1.5-4b-it-UD-Q8_K_XL.gguf"
SERVED_MODEL_NAME = "medgemma-1.5-4b-it-Q8"
N_CTX             = 8192     # context window (tokens)
N_THREADS         = 2      # match your vCPU count — check with `nproc`
# ─────────────────────────────────────────────────────────────────────────────

_llm: Llama | None = None

FILLER_WORDS = {
    "um", "uh", "er", "ah", "like", "you know", "i mean",
    "sort of", "kind of", "basically", "literally", "actually",
    "right", "okay", "so", "well",
}


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 1 — Rule-based biomarker extraction (deterministic, no LLM)
# ══════════════════════════════════════════════════════════════════════════════

def _parse_segments(transcript: str) -> list[dict]:
    """Parse [HH:MM:SS - HH:MM:SS] text lines into segment dicts."""
    pattern = re.compile(
        r"\[(\d{2}:\d{2}:\d{2})\s*-\s*(\d{2}:\d{2}:\d{2})\]\s*(.*?)(?=\[\d{2}:\d{2}:\d{2}|$)",
        re.DOTALL,
    )

    def to_sec(ts: str) -> float:
        h, mn, s = ts.split(":")
        return int(h) * 3600 + int(mn) * 60 + float(s)

    segments = []
    for m in pattern.finditer(transcript):
        text = m.group(3).strip()
        if text:
            segments.append({
                "start": to_sec(m.group(1)),
                "end":   to_sec(m.group(2)),
                "text":  text,
            })
    return segments


def _clean_text(text: str) -> str:
    text = re.sub(r"\[.*?\]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def _tokenize_words(text: str) -> list[str]:
    return [w.lower() for w in re.findall(r"\b[a-zA-Z']+\b", text)]


def _compute_mlu(segments: list[dict]) -> float:
    lengths = [
        len(_tokenize_words(_clean_text(s["text"])))
        for s in segments
        if _tokenize_words(_clean_text(s["text"]))
    ]
    return round(sum(lengths) / len(lengths), 2) if lengths else 0.0


def _compute_pause_ratio(segments: list[dict]) -> float:
    if len(segments) < 2:
        return 0.0
    total = segments[-1]["end"] - segments[0]["start"]
    if total <= 0:
        return 0.0
    silence = sum(
        max(0.0, segments[i + 1]["start"] - segments[i]["end"])
        for i in range(len(segments) - 1)
        if segments[i + 1]["start"] - segments[i]["end"] > 0.3
    )
    return round(min(1.0, silence / total), 3)


def _compute_ttr(segments: list[dict]) -> float:
    words = [w for s in segments for w in _tokenize_words(_clean_text(s["text"]))]
    return round(len(set(words)) / len(words), 3) if words else 0.0


def _compute_fillers(segments: list[dict]) -> tuple[int, list[str]]:
    full = _clean_text(" ".join(s["text"] for s in segments)).lower()
    found, count = [], 0
    for filler in sorted(FILLER_WORDS, key=len, reverse=True):
        hits = re.findall(r"\b" + re.escape(filler) + r"\b", full)
        if hits:
            count += len(hits)
            found.append(f'"{filler}" ×{len(hits)}')
    return count, found


def extract_rule_based_biomarkers(transcript: str) -> dict[str, Any]:
    segments = _parse_segments(transcript)

    if not segments:
        words = _tokenize_words(_clean_text(transcript))
        fc, fe = _compute_fillers([{"start": 0, "end": 60, "text": transcript}])
        return {
            "mlu_score": float(len(words)),
            "pause_ratio": 0.0,
            "type_token_ratio": round(len(set(words)) / max(len(words), 1), 3),
            "filler_word_count": fc,
            "_evidence": {
                "segment_count": 1,
                "total_words": len(words),
                "filler_instances": fe,
                "pause_gaps": [],
                "recording_duration_sec": 0,
            },
        }

    fc, fe = _compute_fillers(segments)
    pause_gaps = [
        f"{round(segments[i+1]['start'] - segments[i]['end'], 1)}s gap at ~{segments[i]['end']:.0f}s"
        for i in range(len(segments) - 1)
        if segments[i + 1]["start"] - segments[i]["end"] > 0.5
    ]
    total_words = sum(len(_tokenize_words(_clean_text(s["text"]))) for s in segments)

    return {
        "mlu_score":         _compute_mlu(segments),
        "pause_ratio":       _compute_pause_ratio(segments),
        "type_token_ratio":  _compute_ttr(segments),
        "filler_word_count": fc,
        "_evidence": {
            "segment_count":          len(segments),
            "total_words":            total_words,
            "filler_instances":       fe,
            "pause_gaps":             pause_gaps[:5],
            "recording_duration_sec": round(segments[-1]["end"] - segments[0]["start"], 1),
        },
    }


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 2 — MedGemma (llama.cpp) for semantic analysis + XAI summaries
# ══════════════════════════════════════════════════════════════════════════════

def _build_prompt(transcript: str, rb: dict) -> str:
    ev = rb["_evidence"]
    filler_str = ", ".join(ev["filler_instances"]) if ev["filler_instances"] else "none detected"
    pause_str  = ", ".join(ev["pause_gaps"])        if ev["pause_gaps"]        else "no significant pauses"

    return f"""<start_of_turn>user
You are a clinical AI assistant specialising in early dementia and mild cognitive impairment (MCI) detection from conversational speech transcripts.

You have been given a speech transcript with pre-computed numeric biomarkers. Your tasks are:
1. Estimate syntactic_complexity (1.0–5.0) based on sentence structure in the transcript.
2. Assign dementia_risk_level: "Low Risk", "Moderate Risk", or "High Risk".
3. Assign confidence_score (0.0–1.0) for your risk assessment.
4. Write a SHORT (1–2 sentence) XAI summary for EACH biomarker citing SPECIFIC evidence from the transcript.

Pre-computed biomarkers:
- mlu_score: {rb['mlu_score']} words/utterance (normal: 7–12; low = simplified speech)
- pause_ratio: {rb['pause_ratio']} ({round(rb['pause_ratio']*100)}% silence/gaps)
- type_token_ratio: {rb['type_token_ratio']} (lexical diversity; <0.4 = repetitive)
- filler_word_count: {rb['filler_word_count']} — {filler_str}

Evidence:
- {ev['total_words']} total words across {ev['segment_count']} segments
- Notable pauses: {pause_str}
- Recording duration: {ev.get('recording_duration_sec', 'unknown')}s

Transcript:
{transcript[:2000]}{"... [truncated]" if len(transcript) > 2000 else ""}

Return ONLY valid JSON, no markdown fences, no text outside the JSON:
{{
  "syntactic_complexity": <float 1.0-5.0>,
  "dementia_risk_level": "<Low Risk|Moderate Risk|High Risk>",
  "confidence_score": <float 0.0-1.0>,
  "biomarker_summaries": {{
    "mlu_score":            {{"value": {rb['mlu_score']},          "summary": "<evidence-based 1-2 sentences>"}},
    "pause_ratio":          {{"value": {rb['pause_ratio']},         "summary": "<evidence-based 1-2 sentences>"}},
    "type_token_ratio":     {{"value": {rb['type_token_ratio']},    "summary": "<evidence-based 1-2 sentences>"}},
    "filler_word_count":    {{"value": {rb['filler_word_count']},   "summary": "<evidence-based 1-2 sentences>"}},
    "syntactic_complexity": {{"value": <your estimate>,             "summary": "<evidence-based 1-2 sentences>"}},
    "overall_risk":         {{"value": "<your risk level>",         "summary": "<2-3 sentence clinical interpretation>"}}
  }}
}}
<end_of_turn>
<start_of_turn>model
"""


def _parse_response(raw: str, rb: dict) -> dict[str, Any]:
    clean = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`")
    match = re.search(r"\{.*\}", clean, re.DOTALL)

    def _default_summaries():
        return {
            "mlu_score":            {"value": rb["mlu_score"],           "summary": "Unable to generate summary."},
            "pause_ratio":          {"value": rb["pause_ratio"],          "summary": "Unable to generate summary."},
            "type_token_ratio":     {"value": rb["type_token_ratio"],     "summary": "Unable to generate summary."},
            "filler_word_count":    {"value": rb["filler_word_count"],    "summary": "Unable to generate summary."},
            "syntactic_complexity": {"value": 2.5,                        "summary": "Unable to generate summary."},
            "overall_risk":         {"value": "Low Risk",                 "summary": "Unable to generate summary."},
        }

    defaults = {
        "syntactic_complexity": 2.5,
        "dementia_risk_level":  "Low Risk",
        "confidence_score":     0.5,
        "biomarker_summaries":  _default_summaries(),
    }

    if not match:
        return defaults

    try:
        data = json.loads(match.group())
        sums = data.get("biomarker_summaries", {})
        sc   = round(min(5.0, max(1.0, float(data.get("syntactic_complexity", 2.5)))), 2)

        def get(key: str, val: Any) -> dict:
            return {"value": val, "summary": str(sums.get(key, {}).get("summary", "No summary."))}

        return {
            "syntactic_complexity": sc,
            "dementia_risk_level":  data.get("dementia_risk_level", "Low Risk"),
            "confidence_score":     round(min(1.0, max(0.0, float(data.get("confidence_score", 0.5)))), 3),
            "biomarker_summaries": {
                "mlu_score":            get("mlu_score",            rb["mlu_score"]),
                "pause_ratio":          get("pause_ratio",          rb["pause_ratio"]),
                "type_token_ratio":     get("type_token_ratio",     rb["type_token_ratio"]),
                "filler_word_count":    get("filler_word_count",    rb["filler_word_count"]),
                "syntactic_complexity": {"value": sc, "summary": str(sums.get("syntactic_complexity", {}).get("summary", "No summary."))},
                "overall_risk":         {"value": data.get("dementia_risk_level", "Low Risk"), "summary": str(sums.get("overall_risk", {}).get("summary", "No summary."))},
            },
        }
    except (json.JSONDecodeError, ValueError, TypeError):
        return defaults


# ══════════════════════════════════════════════════════════════════════════════
# Model loader
# ══════════════════════════════════════════════════════════════════════════════

def _load_model() -> Llama:
    print(f"Loading model: {GGUF_PATH}")
    llm = Llama(
        model_path=GGUF_PATH,
        n_ctx=N_CTX,
        n_threads=N_THREADS,
        n_gpu_layers=0,       # CPU only
        verbose=False,        # suppress llama.cpp log spam
    )
    print("Model loaded and ready!")
    return llm


# ══════════════════════════════════════════════════════════════════════════════
# FastAPI
# ══════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _llm
    _llm = _load_model()
    yield
    _llm = None


app = FastAPI(title="CogniTrack MedGemma Inference Server", lifespan=lifespan)


class AnalysisRequest(BaseModel):
    prompt: str
    max_new_tokens: int = Field(default=600, ge=1, le=2048)


class BiomarkerDetail(BaseModel):
    value: Any
    summary: str


class BiomarkerSummaries(BaseModel):
    mlu_score:            BiomarkerDetail
    pause_ratio:          BiomarkerDetail
    type_token_ratio:     BiomarkerDetail
    filler_word_count:    BiomarkerDetail
    syntactic_complexity: BiomarkerDetail
    overall_risk:         BiomarkerDetail


class AnalysisResponse(BaseModel):
    # Flat fields — backward-compatible with existing backend INSERT
    mlu_score:             float
    pause_ratio:           float
    type_token_ratio:      float
    filler_word_count:     int
    syntactic_complexity:  float
    dementia_risk_level:   str
    confidence_score:      float
    # XAI layer
    biomarker_summaries:   BiomarkerSummaries
    # Meta
    medgemma_latency_sec:  float
    raw_response:          str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": GGUF_PATH.split("/")[-1]}


@app.get("/v1/models")
def list_models() -> dict[str, Any]:
    return {
        "object": "list",
        "data": [{"id": SERVED_MODEL_NAME, "object": "model",
                  "created": int(time.time()), "owned_by": "local"}],
    }


@app.post("/chat", response_model=AnalysisResponse)
def chat(req: AnalysisRequest) -> AnalysisResponse:
    if _llm is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Stage 1 — rule-based (fast, deterministic)
    rb = extract_rule_based_biomarkers(req.prompt)

    # Stage 2 — llama.cpp inference
    prompt_text = _build_prompt(req.prompt, rb)

    t0 = time.time()
    output = _llm(
        prompt_text,
        max_tokens=req.max_new_tokens,
        temperature=0.0,      # greedy — deterministic JSON output
        stop=["<end_of_turn>", "<start_of_turn>"],
        echo=False,
    )
    elapsed = round(time.time() - t0, 3)

    raw_text = output["choices"][0]["text"].strip()
    result   = _parse_response(raw_text, rb)

    print(
        f"[{time.strftime('%H:%M:%S')}] latency={elapsed}s | "
        f"tokens={output['usage']['completion_tokens']} | "
        f"risk={result['dementia_risk_level']} | "
        f"mlu={rb['mlu_score']} | fillers={rb['filler_word_count']}"
    )

    sums = result["biomarker_summaries"]
    return AnalysisResponse(
        mlu_score=rb["mlu_score"],
        pause_ratio=rb["pause_ratio"],
        type_token_ratio=rb["type_token_ratio"],
        filler_word_count=rb["filler_word_count"],
        syntactic_complexity=result["syntactic_complexity"],
        dementia_risk_level=result["dementia_risk_level"],
        confidence_score=result["confidence_score"],
        biomarker_summaries=BiomarkerSummaries(
            mlu_score=           BiomarkerDetail(**sums["mlu_score"]),
            pause_ratio=         BiomarkerDetail(**sums["pause_ratio"]),
            type_token_ratio=    BiomarkerDetail(**sums["type_token_ratio"]),
            filler_word_count=   BiomarkerDetail(**sums["filler_word_count"]),
            syntactic_complexity=BiomarkerDetail(**sums["syntactic_complexity"]),
            overall_risk=        BiomarkerDetail(**sums["overall_risk"]),
        ),
        medgemma_latency_sec=elapsed,
        raw_response=raw_text,
    )


# ══════════════════════════════════════════════════════════════════════════════
# Demo mode
# ══════════════════════════════════════════════════════════════════════════════

def main_demo() -> None:
    sample = (
        "[00:00:00 - 00:00:08] Anyone else other than I was a Black kid instead of being "
        "a white kid, and it was a segregated society. Um,\n"
        "[00:00:09 - 00:00:13] we walked to school. The white kids had a school bus.\n"
        "[00:00:14 - 00:00:15] And, um,\n"
        "[00:00:16 - 00:00:17] I was crazy about Roy Rogers.\n"
        "[00:00:18 - 00:00:22] I like, uh, William Elliott, we called him Wild Bill.\n"
        "[00:00:29 - 00:00:29] Uh,\n"
        "[00:00:31 - 00:00:32] I think trying to answer your question,\n"
        "[00:00:34 - 00:00:47] I had never experienced the North. I didn't know anything "
        "about the North. I didn't know anything about any other society other than what we lived in."
    )

    print("=== Stage 1: Rule-based extraction ===")
    rb = extract_rule_based_biomarkers(sample)
    ev = rb.pop("_evidence")
    print(json.dumps(rb, indent=2))
    print(json.dumps(ev, indent=2))
    rb["_evidence"] = ev

    llm = _load_model()
    prompt_text = _build_prompt(sample, rb)

    t0 = time.time()
    output = llm(prompt_text, max_tokens=2000, temperature=0.0,
                 stop=["<end_of_turn>", "<start_of_turn>"], echo=False)
    elapsed = round(time.time() - t0, 3)

    raw = output["choices"][0]["text"].strip()
    print(f"\n=== Stage 2: MedGemma raw output ({elapsed}s) ===\n{raw}")
    print("\n=== Parsed result ===")
    print(json.dumps(_parse_response(raw, rb), indent=2))


if __name__ == "__main__":
    if "--demo" in sys.argv:
        main_demo()
    else:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
