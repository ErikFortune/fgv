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

## Live empirical gate (PR #485) — PASSED

The four phased PRs landed with 100% unit coverage but **mock-fetch only** — no real
network call had ever exercised the adapters. The live gate was commissioned as a
single `@fgv/testbed` scenario (`cross-provider-embedding-search`, see
[testbed-scenario-brief.md](./testbed-scenario-brief.md)) and delivered in **PR #485**
(into `ai-assist-embeddings`; testbed-only, primitive untouched).

- **Scenario:** embeds a query (`retrieval-query`) + a 5-doc corpus in one batch call
  (`retrieval-document`), cosine-ranks, prints a computed PASS/FAIL gate matrix; runs
  against OpenAI-shaped providers or Gemini via `EMBED_PROVIDER`. Mock-fetch unit tests
  drive the **real** `callProviderEmbedding` and assert the outgoing request body
  (taskType reaching the wire, no-op on OpenAI, dimensions, batch alignment). 204 tests,
  100% coverage; `code-reviewer` (1 round, no P1) + Copilot (3 rounds → diminishing
  returns: doc-accuracy → a real query-batch-count silent-ignore gap on the Gemini path,
  now caught → a fail-fast `EMBED_ENDPOINT` diagnostic).
- **Live run (Erik, 2026-06-07):** **PASS on both wire formats.** OpenAI
  `text-embedding-3-small` (1536-d; `EMBED_DIMENSIONS=512` honored → 512-d) and Gemini
  `gemini-embedding-001` (3072-d, **`taskType` HONORED** — the `batchEmbedContents`
  retrieval-asymmetry path that had never made a real call). Ranking sane on every run
  (the password-reset doc ranks #1). **No primitive gap surfaced under live fire.**

**Verdict:** the embedding modality is empirically verified end-to-end; the
`ai-assist-embeddings` → `release` promotion is unblocked.
