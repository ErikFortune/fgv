# Brief: cross-provider embedding testbed scenario (live empirical gate)

**Stream:** `ai-assist-embeddings` (the embedding primitive landed via #481–#484 on this integration branch; the impl agent finalized the stream artifacts to `completed/`, but **the live empirical gate below has not run** — the impl's tests are all mock-fetch).
**This task:** a single **live-verified** `samples/testbed` scenario that exercises `callProviderEmbedding` across providers — **the gate before** the `ai-assist-embeddings` → `release` promotion. Commissioned 2026-06-07 (Erik).
**Branch:** sub-branch off `ai-assist-embeddings`; PR INTO `ai-assist-embeddings`. Never `main`.

## Why you exist (read this first — it changes how you work)

You are a **fresh agent**. You did **not** build the embedding primitive, and that is the point. The primitive (`callProviderEmbedding` / `callProxiedEmbedding`, the OpenAI + Gemini adapters, the capability/registry plumbing) has **100% unit coverage but has never made a real network call.** Mock-fetch tests assert what we *send*; they cannot prove a provider *accepts* it and returns a usable vector. Your job is to exercise it against the **real APIs** and **call out any gap you find** — do NOT paper over a broken primitive by mocking around it, special-casing it in the scenario, or adjusting the assertion to match wrong behavior.

**If the live run reveals the primitive is broken** (Gemini `taskType` never reaches the wire; dimension mismatch; batch misalignment; the Gemini `batchEmbedContents` response not parsed; an up-front rejection misfiring), **STOP and report it as a P1 finding** with the exact wire evidence (request body sent, response received, error). Fix it **only** with the fix prominently flagged for orchestrator ratification — never silently. The repo's "never paper over failures" rule (`TESTING_GUIDELINES.md`) governs here.

## Read first
- `.ai/tasks/completed/2026-06/ai-assist-embeddings/design.md` — esp. §6 per-provider wire mapping, §7 taskType/dimensions, **§14 amendments**; and `result.md` (what shipped + the decisions ledger).
- The primitive as shipped on this branch: `libraries/ts-extras/src/packlets/ai-assist/` — `callProviderEmbedding`, the `openai-embeddings` / `gemini-embeddings` adapters, `resolveEmbeddingCapability`, the registry `embedding` entries.
- Existing testbed scenarios as templates: **`samples/testbed/src/scenarios/local-embedding-search`** (the embedding-search demo pattern — in-process transformers; you're building the cloud/cross-provider sibling), the **`*ClientTools`** scenarios (the live-run + env-gated + CLI-dispatch pattern), and **`mcpProbe`** (a recent scenario + its mock-fetch unit tests). Scenario registration is **manual**.

## What to build — ONE scenario: `cross-provider-embedding-search`

A semantic-search / similarity demo (the real use case, design §1) that doubles as the live gate:
- Embed a small fixed document set + a query via `callProviderEmbedding`, compute cosine similarity, rank the docs. Print the ranking + the vector dimension + provider/model used.
- **Runs against more than one provider** so both wire formats are exercised live: an **OpenAI-shaped** provider (`openai`; also reachable: Ollama-via-`/v1`, openai-compat) **and Gemini** (`gemini-embeddings` — the divergent `batchEmbedContents` path). Provider selectable via env/args (default `openai`); document which keys each needs.
- **Load-bearing live checks (the must-pass gates):**
  1. **Gemini `taskType` asymmetry end-to-end** — embed the query with `retrieval-query` and the documents with `retrieval-document` on Gemini, and verify the ranking is sane and the call succeeds. This is the highest-risk wire path (a totally different shape from OpenAI) and the reason `taskType` exists.
  2. **Both wire formats return usable vectors** — OpenAI path and Gemini path each yield correctly-shaped `number[][]` aligned to inputs, with the expected dimension.
  3. **Batch input** — multiple docs embedded in one call, vectors aligned by index.
  4. **`dimensions`** honored where supported (OpenAI 3-* / Gemini), reflected in `IAiEmbeddingResult.dimensions`.

## Conventions / gates
- Scenario code carries **mock-fetch unit tests to 100% coverage** (mirror `mcpProbe`) — the deterministic CI gate. The **live run is env-gated** (skipped without keys), like the `*ClientTools` scenarios. If keys are present in your environment, **run it live and report the results**; if not, give exact run instructions and flag the live gate **PENDING** for the owner.
- `rushx build` + `rushx lint` + `rushx test` (100%) in `@fgv/testbed`; `rushx fixlint`; `code-reviewer` on the diff before coverage-chasing. PR into `ai-assist-embeddings`.
- Do NOT modify the embedding primitive except to fix a real bug you found and prominently flagged (see "Why you exist").

## Report back
- The scenario + its unit tests (PR into `ai-assist-embeddings`).
- **The live-run results per provider** (PASS/FAIL with evidence: actual dimensions returned, the Gemini `taskType` round-trip outcome, the ranking) — OR exact command + keys needed and an explicit "live gate PENDING".
- **Any gap/bug found in the primitive**, as a clearly-labeled finding with wire evidence — a primary deliverable, not an afterthought. If the primitive is clean under live fire, say so explicitly; that's the signal that unblocks the promotion.
