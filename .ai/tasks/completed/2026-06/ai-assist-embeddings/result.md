# Result — ai-assist-embeddings

## Delivered

The cross-provider embedding modality for `@fgv/ts-extras/ai-assist`, built across
four phased PRs (#481–#484) onto integration branch `ai-assist-embeddings`. See
[README.md](./README.md) for the surface summary.

## Decisions ledger

- **Format dispatch:** new two-member `AiEmbeddingApiFormat` (`openai-embeddings` +
  `gemini-embeddings`) rather than reusing `AiApiFormat` — Gemini's route/auth/body
  diverge; the OpenAI shape covers everyone else. Renamed from the design's draft
  `AiEmbeddingFormat` per §14 amendment #1 (symmetry with `AiApiFormat` /
  `AiImageApiFormat`).
- **Result wire shape (OQ-2):** `number[][]`, not `Float32Array` — JSON-wire fidelity,
  validator-friendliness, proxy round-trip. Consumers call `Float32Array.from(v)` at
  the vector-store boundary.
- **Knob handling (§7):** no-op-where-unsupported (logged), never a failure — keeps a
  single cross-provider call site while preserving Gemini's retrieval asymmetry.
- **Mistral (OQ-3):** included (OpenAI-shaped, low cost).
- **`maxBatchSize` (§14 #3):** fail-fast, no auto-chunking; chunking deferred (a
  `docs/FUTURE.md` candidate if a RAG consumer exceeds 2048).
- **`encoding_format: 'float'` (§14 #5):** always sent; documented known assumption.
- **`http.ts` extraction:** `fetchJson` + `IAiApiConfig` moved out of `apiClient.ts`
  into a shared internal module (behavior-preserving; also kept `apiClient.ts` under
  the 2000-line lint ceiling).
- **OpenAI catch-all `maxBatchSize` (Phase 1 review):** removed from the catch-all to
  match design §5.1 — only the `text-embedding-3` prefix carries the batch guard.
- **Response-alignment hardening (Copilot #482):** OpenAI adapter validates count +
  index integrity (0..n-1) + uniform dimensionality before trusting the sorted
  response — guards against malformed compat-server batches.
- **`callProxiedEmbedding` cast (Phase 3 review):** reads `jsonResult.value` (typed
  `JsonObject`) cast-free; the sibling proxies' `as Record<string, unknown>` is an
  unnecessary cast here.

## OQ-1 — Ollama native embed (resolved)

**CUT.** Ollama serves embeddings on `/v1/embeddings` in the OpenAI shape; the
`ollama` descriptor already routes `/v1`, so `callProviderEmbedding` covers it with
zero Ollama-specific code. Native `/api/embed` adds only marginal diagnostics
(`total_duration` / `prompt_eval_count`) — not worth a parallel path. Revisit
additively only if a concrete consumer needs them. `LIBRARY_CAPABILITIES.md` updated
in all three places (decision shortcut, `@fgv/ts-extras-ollama` entry, package-shape
summary).

## Open questions left for later (additive, non-blocking)

- **OQ-4 (normalize knob):** not added — L2 normalization is a vector-store concern.
- **OQ-5 (`providerParams` escape hatch):** deferred until a third provider-specific
  knob appears.
- **Transparent batch-chunking above `maxBatchSize`:** deferred (FUTURE candidate).

## Gates (per phase)

`rushx build` + `rushx lint` (0 problems) + `rushx test` at **100% coverage** in
`@fgv/ts-extras`; `rushx fixlint` before each final commit; `etc/ts-extras.api.md`
regenerated; `rush change` (type none); no `any`; additive-only. `code-reviewer` run
on each phase diff before its PR; Copilot review loop driven per phase to diminishing
returns.
