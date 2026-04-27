#!/usr/bin/env python3
"""
MedGemma 1.5 4B IT (GGUF Q8) on CPU: OpenAI-compatible API + optional one-shot demo.

Model:  unsloth/medgemma-1.5-4b-it-GGUF
File:   medgemma-1.5-4b-it-UD-Q8_K_XL.gguf  (5.17 GB on disk, ~6.1 GB in RAM)
Device: CPU only (device_map="cpu")
Loader: transformers >= 4.51.0 + gguf package

API (default): listens on 0.0.0.0:8000
  POST /v1/chat/completions
  GET  /v1/models
  GET  /health

Persistent run (activate the venv inside tmux, then start the server):

  tmux new -s medgemma
  cd /home/ubuntu
  source ~/medgemma-venv/bin/activate
  python medgemma_cpu_infer.py

Or with uvicorn directly:
  python -m uvicorn medgemma_cpu_infer:app --host 0.0.0.0 --port 8000

Demo (load model, run one prompt, print result — no HTTP server):
  python medgemma_cpu_infer.py --demo
"""
from __future__ import annotations

import sys
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any, Literal

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModelForCausalLM

# ── Model config ──────────────────────────────────────────────────────────────
GGUF_DIR  = "/home/ubuntu/medgemma-gguf"
GGUF_FILE = "medgemma-1.5-4b-it-UD-Q8_K_XL.gguf"
SERVED_MODEL_NAME = "medgemma-1.5-4b-it-Q8"
# ─────────────────────────────────────────────────────────────────────────────

_tokenizer: AutoTokenizer | None = None
_model: AutoModelForCausalLM | None = None


def _device() -> torch.device:
    assert _model is not None
    return next(_model.parameters()).device


def _load_model() -> tuple[AutoTokenizer, AutoModelForCausalLM]:
    """Load tokenizer and model from the GGUF file."""
    print(f"Loading tokenizer from: {GGUF_DIR}/{GGUF_FILE}")
    tokenizer = AutoTokenizer.from_pretrained(
        GGUF_DIR,
        gguf_file=GGUF_FILE,
    )

    print("Loading model from GGUF (CPU) — this takes a few minutes…")
    model = AutoModelForCausalLM.from_pretrained(
        GGUF_DIR,
        gguf_file=GGUF_FILE,
        device_map="cpu",
        torch_dtype=torch.float32,
        low_cpu_mem_usage=True,
    )
    model.eval()
    print("Model loaded and ready!")
    return tokenizer, model


def _openai_messages_to_gemma(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Convert OpenAI-style messages to the format expected by apply_chat_template."""
    out: list[dict[str, Any]] = []
    for m in messages:
        role = m.get("role")
        if role not in ("system", "user", "assistant"):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported message role: {role!r}",
            )
        content = m.get("content")
        if isinstance(content, str):
            gemma_content: list[dict[str, str]] = [{"type": "text", "text": content}]
        elif isinstance(content, list):
            gemma_content = []
            for part in content:
                if not isinstance(part, dict):
                    continue
                if part.get("type") == "text":
                    gemma_content.append(
                        {"type": "text", "text": str(part.get("text", ""))}
                    )
                elif part.get("type") == "image_url":
                    raise HTTPException(
                        status_code=400,
                        detail="Image input is not supported on this CPU-only GGUF server.",
                    )
            if not gemma_content:
                gemma_content = [{"type": "text", "text": ""}]
        else:
            gemma_content = [{"type": "text", "text": str(content)}]
        out.append({"role": role, "content": gemma_content})
    return out


# ── FastAPI app ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _tokenizer, _model
    _tokenizer, _model = _load_model()
    yield
    _tokenizer, _model = None, None


app = FastAPI(title="MedGemma GGUF Q8 — OpenAI-compatible API", lifespan=lifespan)


# ── Pydantic models ───────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str | list[dict[str, Any]]


class ChatCompletionRequest(BaseModel):
    model: str = Field(default=SERVED_MODEL_NAME)
    messages: list[ChatMessage]
    max_tokens: int | None = Field(default=256, ge=1, le=4096)
    temperature: float | None = Field(default=0.0, ge=0.0, le=2.0)
    stream: bool = False
    max_completion_tokens: int | None = Field(default=None, ge=1, le=4096)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": GGUF_FILE}


@app.get("/v1/models")
def list_models() -> dict[str, Any]:
    now = int(time.time())
    return {
        "object": "list",
        "data": [
            {
                "id": SERVED_MODEL_NAME,
                "object": "model",
                "created": now,
                "owned_by": "local",
            }
        ],
    }


@app.post("/v1/chat/completions")
def chat_completions(body: ChatCompletionRequest) -> dict[str, Any]:
    if _tokenizer is None or _model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if body.stream:
        raise HTTPException(
            status_code=400,
            detail="stream=true is not supported; omit stream or set stream=false.",
        )

    max_new = body.max_completion_tokens or body.max_tokens or 256
    messages = [m.model_dump() for m in body.messages]
    gemma_messages = _openai_messages_to_gemma(messages)

    # Apply chat template → token ids
    try:
        input_ids = _tokenizer.apply_chat_template(
            gemma_messages,
            add_generation_prompt=True,
            tokenize=True,
            return_tensors="pt",
        ).to(_device())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Chat template error: {e}") from e

    prompt_len = input_ids.shape[-1]
    do_sample = (body.temperature or 0.0) > 0.0
    gen_kwargs: dict[str, Any] = {
        "max_new_tokens": max_new,
        "do_sample": do_sample,
    }
    if do_sample:
        gen_kwargs["temperature"] = float(body.temperature)

    t0 = time.time()
    with torch.inference_mode():
        out = _model.generate(input_ids, **gen_kwargs)
    elapsed = time.time() - t0

    new_tokens = out[0, prompt_len:]
    text = _tokenizer.decode(new_tokens, skip_special_tokens=True)
    completion_tokens = int(new_tokens.shape[-1])

    return {
        "id": f"chatcmpl-{uuid.uuid4().hex[:24]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": body.model or SERVED_MODEL_NAME,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": text},
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": prompt_len,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_len + completion_tokens,
        },
        "medgemma_latency_sec": round(elapsed, 3),
    }


# ── Demo mode ─────────────────────────────────────────────────────────────────

def main_demo() -> None:
    """Load model and run one prompt without starting the HTTP server."""
    tokenizer, model = _load_model()
    dev = next(model.parameters()).device

    messages = [
        {
            "role": "user",
            "content": [{"type": "text", "text": "What are common symptoms of pneumonia?"}],
        }
    ]
    input_ids = tokenizer.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_tensors="pt",
    ).to(dev)

    input_len = input_ids.shape[-1]
    with torch.inference_mode():
        out = model.generate(input_ids, max_new_tokens=128, do_sample=False)

    new_tokens = out[0, input_len:]
    print(tokenizer.decode(new_tokens, skip_special_tokens=True))


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if "--demo" in sys.argv:
        main_demo()
    else:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
