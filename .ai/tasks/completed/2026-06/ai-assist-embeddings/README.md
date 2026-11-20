# ai-assist-embeddings — cross-provider embedding primitive

**Status:** ✅ shipped to integration branch `ai-assist-embeddings` (Phases 1–4; PRs #481–#484).
**Package surface:** `@fgv/ts-extras/ai-assist` (new `embeddingClient.ts`, `http.ts`; `model.ts`, `registry.ts`, `apiClient.ts`, `index.ts`) + `.ai/instructions/LIBRARY_CAPABILITIES.md`.
**Resolves:** ollama-native OQ-1.

## Mission

Add the missing third modality to ai-assist — `text → vector` embeddings — as a
cross-provider HTTP primitive mirroring the completion and image-generation
primitives. Cloud + self-hosted via one descriptor-driven dispatcher.

## What shipped

- **`callProviderEmbedding(params): Promise<Result<IAiEmbeddingResult>>`** and the
  **`callProxiedEmbedding(proxyUrl, params)`** browser/CORS mirror.
- Two-member **`AiEmbeddingApiFormat`** dispatch:
  - `openai-embeddings` (`POST /embeddings`) — **OpenAI** (`text-embedding-3-*`),
    **Ollama** (via `/v1`), **openai-compat**, **Mistral** (`mistral-embed`).
  - `gemini-embeddings` (`POST /models/{model}:batchEmbedContents`) — **Google
    Gemini** (`gemini-embedding-001`) with `taskType` + `outputDimensionality`.
- **Capability declaration:** additive `embedding?: IAiEmbeddingModelCapability[]`
  on `IAiProviderDescriptor` + new `'embedding'` `ModelSpecKey` + `supportsEmbedding`
  / `resolveEmbeddingCapability` (longest-prefix). `xai-grok` / `anthropic` / `groq`
  omit the capability (no first-party endpoint) and reject up front.
- **Cross-provider knobs (`dimensions`, `taskType`):** flat optional fields, gated by
  per-capability `supports*` flags. Honored where supported, **logged no-op (never a
  failure) where not** — preserves Gemini's query-vs-document retrieval asymmetry
  without lowering symmetric providers to a denominator.
- **Result shape:** `number[][]` (not `Float32Array`) for JSON-wire/validator/proxy
  fidelity; library does not L2-normalize.
- **Robustness:** empty-input short-circuit (no wire call); `maxBatchSize` fail-fast
  (no auto-chunking); OpenAI response-alignment validation (count + index integrity
  0..n-1 + uniform dimensionality) against malformed compat-server responses.

## Outcome

- Additive only — no existing export changed. All five phases green: `rushx build`
  + `lint` + `test` at **100% coverage**; `etc/ts-extras.api.md` regenerated;
  `rush change` (type none).
- **OQ-1 resolved:** `@fgv/ts-extras-ollama` native `embed` is **CUT** — Ollama
  embeddings flow through `callProviderEmbedding` via `/v1`. `LIBRARY_CAPABILITIES.md`
  reconciled (decision shortcut + ollama entry + package-shape summary).
- A shared internal `http.ts` (`fetchJson` + `IAiApiConfig`) was extracted from
  `apiClient.ts` and is reused by both clients (behavior-preserving; keeps
  `apiClient.ts` under its line ceiling).
- Review: `code-reviewer` run per phase before each PR; Copilot loop drove
  per-phase (response-alignment hardening on #482, then doc-accuracy nitpicks on
  #483/#484). Stopped on diminishing returns (docs-only by #484).

## Phases / PRs

| Phase | PR | Content |
|---|---|---|
| 1 | #481 | Types + capability declaration + registry |
| 2 | #482 | `callProviderEmbedding` + OpenAI adapter + `http.ts` extraction (+ Copilot response-alignment hardening) |
| 3 | #483 | Gemini `batchEmbedContents` adapter + `callProxiedEmbedding` |
| 4 | #484 | `LIBRARY_CAPABILITIES.md` docs + artifact finalization |

## Artifacts

- [`brief.md`](./brief.md) — commissioning brief.
- [`design.md`](./design.md) — Phase A design (incl. §14 orchestrator-review amendments).
- [`result.md`](./result.md) — outcome + decisions ledger.
