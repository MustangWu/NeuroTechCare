# CogniTrack — ML Inference Server: Backend Integration Guide

This document is for the **backend team** integrating `index.js` (or any Node.js/Python service) with the MedGemma FastAPI inference server running on EC2.

---

## Endpoint

```
POST http://<EC2_PUBLIC_DNS>:8000/chat
GET  http://<EC2_PUBLIC_DNS>:8000/health
GET  http://<EC2_PUBLIC_DNS>:8000/v1/models
```

The current EC2 public DNS is set via the `EC2_ENDPOINT` environment variable in the backend:

```env
EC2_ENDPOINT=http://ec2-52-206-128-95.compute-1.amazonaws.com:8000/chat
```

> **Security:** Port 8000 on the EC2 security group should be restricted to your backend server's IP (not `0.0.0.0/0`). The connection is plain HTTP — do not send patient data over the public internet without a VPN or HTTPS reverse proxy in front.

---

## Request format

```json
POST /chat
Content-Type: application/json

{
  "prompt": "[00:00:00 - 00:00:08] Anyone else other than I was...\n[00:00:09 - 00:00:13] we walked to school...",
  "max_new_tokens": 800
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `prompt` | string | ✅ | Timestamped speech transcript (see format below) |
| `max_new_tokens` | integer | ❌ | Default `800`. Range `1–2048`. Keep at 800+ to avoid truncated JSON responses. |

### Transcript format

The `prompt` field must be a timestamped transcript where each line follows this pattern:

```
[HH:MM:SS - HH:MM:SS] speaker utterance text here
```

Example:

```
[00:00:00 - 00:00:08] Anyone else other than I was a Black kid, and it was a segregated society. Um,
[00:00:09 - 00:00:13] we walked to school. The white kids had a school bus.
[00:00:14 - 00:00:15] And, um,
[00:00:16 - 00:00:17] I was crazy about Roy Rogers.
```

The timestamps are used by Stage 1 (rule-based extractor) to compute `pause_ratio` — the proportion of silence/gaps between utterances. If no timestamps are present, the server falls back gracefully but `pause_ratio` will be `0.0`.

---

## Response format

```json
{
  "mlu_score": 7.43,
  "pause_ratio": 0.182,
  "type_token_ratio": 0.614,
  "filler_word_count": 4,
  "syntactic_complexity": 2.3,
  "dementia_risk_level": "Low Risk",
  "confidence_score": 0.78,
  "biomarker_summaries": {
    "mlu_score": {
      "value": 7.43,
      "summary": "The patient produced an average of 7.43 words per utterance, within the normal range of 7–12, suggesting preserved basic sentence construction."
    },
    "pause_ratio": {
      "value": 0.182,
      "summary": "18.2% of recording time consisted of silence gaps. Notable pauses at 6s and 13s align with moments of topic transition rather than word-finding failure."
    },
    "type_token_ratio": {
      "value": 0.614,
      "summary": "A TTR of 0.614 indicates healthy lexical diversity; the patient used varied vocabulary without repeating the same words excessively."
    },
    "filler_word_count": {
      "value": 4,
      "summary": "Four filler words were detected (\"um\" ×2, \"uh\" ×2). This is within normal conversational range and does not indicate significant word-finding difficulty."
    },
    "syntactic_complexity": {
      "value": 2.3,
      "summary": "Sentence structure is mostly simple with some compound clauses. No evidence of severely degraded grammar or agrammatism."
    },
    "overall_risk": {
      "value": "Low Risk",
      "summary": "Based on preserved MLU, healthy lexical diversity, and low filler frequency, this transcript shows no strong indicators of MCI or early dementia. Continued longitudinal monitoring is recommended."
    }
  },
  "medgemma_latency_sec": 47.3,
  "raw_response": "{ ... raw JSON string from MedGemma ... }"
}
```

### Field reference

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `mlu_score` | float | Stage 1 (rule-based) | Mean Length of Utterance in words. Normal range: 7–12. |
| `pause_ratio` | float 0–1 | Stage 1 (rule-based) | Fraction of recording time that is silence/pauses (>0.3s gaps). |
| `type_token_ratio` | float 0–1 | Stage 1 (rule-based) | Lexical diversity. Below 0.4 = repetitive/restricted vocabulary. |
| `filler_word_count` | integer | Stage 1 (rule-based) | Count of "um", "uh", "like", "you know", etc. |
| `syntactic_complexity` | float 1–5 | Stage 2 (MedGemma) | 1 = very simple (single-clause); 5 = complex multi-clause sentences. |
| `dementia_risk_level` | string | Stage 2 (MedGemma) | `"Low Risk"`, `"Moderate Risk"`, or `"High Risk"`. |
| `confidence_score` | float 0–1 | Stage 2 (MedGemma) | MedGemma's confidence in its risk assessment. |
| `biomarker_summaries` | object | Stage 2 (MedGemma) | XAI layer — per-biomarker explanations citing transcript evidence. Store as JSONB. |
| `medgemma_latency_sec` | float | Server | Time taken by the LLM inference call only (Stage 2). Expect 30–120s on CPU. |
| `raw_response` | string | Server | Raw JSON string returned by MedGemma before parsing. Useful for debugging. |

---

## `trend_direction` — compute in the backend, not here

`trend_direction` is **not returned by this endpoint**. A single recording has no prior context to compare against. Trend computation must happen in your Node.js backend after inserting the new row:

```js
async function computeTrendDirection(client, patientId, newConfidenceScore, newRiskLevel) {
  const { rows } = await client.query(
    `SELECT confidence_score, dementia_risk_level
     FROM biomarker_analysis
     WHERE patient_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [patientId]
  );

  if (rows.length === 0) return "stable";

  const prev = rows[0];
  const riskOrder = { "Low Risk": 0, "Moderate Risk": 1, "High Risk": 2 };
  const riskDelta = riskOrder[newRiskLevel] - riskOrder[prev.dementia_risk_level];
  const confidenceDelta = newConfidenceScore - parseFloat(prev.confidence_score);

  if (riskDelta > 0 || (riskDelta === 0 && confidenceDelta > 0.1))  return "declining";
  if (riskDelta < 0 || (riskDelta === 0 && confidenceDelta < -0.1)) return "improving";
  return "stable";
}
```

---

## Database: required migration

Before deploying, run this migration to add the `biomarker_summaries` JSONB column:

```sql
ALTER TABLE biomarker_analysis
  ADD COLUMN IF NOT EXISTS biomarker_summaries JSONB;
```

When inserting, serialize the object from the ML response:

```js
biomarker_summaries = JSON.stringify(mlResult.biomarker_summaries ?? null)
```

---

## Calling the endpoint from Node.js

```js
const response = await fetch(process.env.EC2_ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: transcriptText,
    max_new_tokens: 800,
  }),
  signal: AbortSignal.timeout(300_000), // 5 min — CPU inference is slow
});

if (!response.ok) {
  throw new Error(`ML inference failed: ${response.status}`);
}

const mlResult = await response.json();
```

> **Timeout:** CPU inference on `m7i-flex.large` typically takes 30–120 seconds per request. Set your HTTP client timeout to at least 5 minutes (`300_000 ms`).

---

## Quick smoke test (curl)

```bash
# Health check
curl -sS http://<EC2_PUBLIC_DNS>:8000/health

# Full inference request
curl -X POST http://<EC2_PUBLIC_DNS>:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "[00:00:00 - 00:00:08] Anyone else other than I was a Black kid, it was a segregated society. Um,\n[00:00:09 - 00:00:13] we walked to school. The white kids had a school bus.\n[00:00:14 - 00:00:15] And, um,\n[00:00:31 - 00:00:32] I think trying to answer your question,\n[00:00:34 - 00:00:47] I had never experienced the North. I did not know anything about the North.",
    "max_new_tokens": 800
  }'
```

Interactive Swagger UI: `http://<EC2_PUBLIC_DNS>:8000/docs`

---

## Expected latency

| Phase | Time |
|-------|------|
| Stage 1 (rule-based extraction) | < 10 ms |
| Stage 2 (MedGemma LLM on CPU) | 30–120 seconds |
| Total round-trip | ~30–120 seconds |

Inference is slow because the model runs entirely on CPU (`n_gpu_layers=0`). This is expected behaviour on `m7i-flex.large`. A GPU instance (e.g. `g4dn.xlarge`) would reduce latency to 2–5 seconds but increases cost significantly.

---

## Keeping the server running

The inference server must be kept alive inside `tmux` so SSH disconnects do not kill the process:

```bash
# First time
tmux new -s medgemma
source ~/.medgemma-venv/bin/activate
cd /home/ubuntu
python medgemma_cpu_infer.py

# Detach without stopping: Ctrl-b then d
# Reattach later: tmux attach -t medgemma
```

For auto-start on EC2 reboot, see `MEDGEMMA_EC2_S3_HOSTING.md` → Part C, Section 5.
