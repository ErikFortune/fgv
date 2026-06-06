# ollama-native — followup

**Status:** Task A shipped; Task B awaiting orchestrator triage (execute or promote to `docs/FUTURE.md`).

## What shipped (Task A)

The recipe + capability-config quick win, landed via **PR #468** (targets `release`):

- Added catch-all `chat` rules for the `ollama` and `openai-compat` providers to
  `DEFAULT_MODEL_CAPABILITY_CONFIG` in
  `libraries/ts-extras/src/packlets/ai-assist/registry.ts` (parallel to the
  existing `groq`/`mistral` entries).
- Unit tests (`registry.test.ts`) + integration tests through
  `callProviderListModels` (`listModels.test.ts`).
- `LIBRARY_CAPABILITIES.md` recipe: empty-key omission, `defaultModel: ''`
  caveat, `endpoint` override coverage, `OLLAMA_ORIGINS` browser-CORS caveat.
- Rush change file (`@fgv/ts-extras`, `minor`).

Gates: build / lint / test 100% green; one `code-reviewer` P2 (integration-test
gap) found + fixed pre-push; Copilot loop stopped after 1 round (diminishing
returns — doc/accuracy class).

**Merge-order note:** the doc now states `executeClientToolTurn` gains the
`endpoint` override "once PR #466 merges," so it is accurate regardless of the
order #466 and #468 land.

## Task B — deferred (out of scope this session)

Task B was explicitly excluded by the session instruction ("Do NOT do Task B").
**The original `ollama-native/brief.md` was not present in this clone**, so the
scope below is *inferred* from the cluster name (`ollama-native`) and Task A's
framing — the orchestrator should reconcile against the real brief before
acting.

**Inferred scope:** native Ollama API support beyond the OpenAI-compatible
`/v1` shim that Task A relies on — e.g. the native `/api/chat` / `/api/generate`
endpoints, native model-listing (`/api/tags`), and any Ollama-specific
request/response shape that the `apiFormat: 'openai'` path doesn't cover (model
pull/availability, streaming format differences, `keep_alive` / `options`
blocks).

**Open questions for triage:**
- Is a native `apiFormat: 'ollama'` warranted, or does the OpenAI-compat shim
  (Task A) cover the realistic consumer need?
- Is there a concrete consumer driving native-API features, or is this
  speculative? (Stability-via-consumption: no consumer → likely FUTURE.)

**Orchestrator decision:** execute as a stream (commission a brief + worker) if
a consumer need is concrete, OR promote to `docs/FUTURE.md` as a parking-lot
idea pending demand.

**Reference:** PR #468; `.ai/tasks/completed/2026-05/local-ai-exploration/` (the
broader self-hosted/local-AI cluster context).
