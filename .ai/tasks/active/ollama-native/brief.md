# Stream brief: `ollama-native` — first-class Ollama support

**Status:** commissioned 2026-06-06 (Erik). Integration branch: `ollama-native` (off `release`).
**Scoping source:** the 2026-06-06 Ollama scoping pass (decision: A-now-then-B; reject C). Builds on the `local-ai-exploration` cluster (which shipped the in-process transformers facade) and the 2026-05-22 research note `.ai/notes/orchestrator/research/local-models-incorporation.md`.

Two activities in this stream:

- **Task A — land quickly (implementation now).** Make the *already-working* local-Ollama completion path discoverable + documented. This is the deferred "F-3 chore."
- **Task B — design now (implementation later).** A full design + phased plan for `@fgv/ts-extras-ollama`, the native-API Result boundary. Erik wants to get AHEAD of the known-incoming consumer; implementation kicks off once Task A + the MCP slice land.

**Target branch:** Task A is a tiny additive chore — **PR it directly to `release`** (fast-track; don't gate it behind the integration branch). Task B's design doc commits to the `ollama-native` integration branch (or directly to `release` as a design PR — orchestrator's call). **Never target `main`.**

---

## Context — read first (both tasks)

1. The completed scoping starting point: `.ai/notes/orchestrator/research/local-models-incorporation.md` (2026-05-22 landscape) and `.ai/tasks/completed/2026-05/local-ai-exploration/state.md` (what shipped: `@fgv/ts-extras-transformers` in-process facade — the structural TEMPLATE for Task B).
2. What already works for Ollama TODAY (so you design/document only the GAP): `libraries/ts-extras/src/packlets/ai-assist/registry.ts` (built-in `ollama` + `openai-compat` provider descriptors; `DEFAULT_MODEL_CAPABILITY_CONFIG`), `endpoint.ts` (`resolveEffectiveBaseUrl`, `bearerAuthHeader` empty-key omission), `model.ts` (`IAiAssistProviderConfig.endpoint`, `AiApiFormat`). The completion / streaming / tools / list-models path against a local Ollama **already works** via the OpenAI-compat `/v1` endpoint. NOTE: PR #466 just extended the `endpoint` override to `executeClientToolTurn` (client-tool turns now honor it too).
3. `.ai/instructions/LIBRARY_CAPABILITIES.md` ("Result-integration boundary" convention) and `.ai/instructions/ACTIVE_DEVELOPMENT.md` (ai-assist/ts-extras is active surface; additive is cheap).

---

## Task A — recipe + capability config (implement now; PR to `release`)

The completion path already works; make it discoverable.

- **`registry.ts`** — add an `ollama` (and optionally `openai-compat`) entry to `DEFAULT_MODEL_CAPABILITY_CONFIG.perProvider` with id-pattern rules so `listModels(capability)` is non-empty (today these providers resolve to `capabilities: {}`). Additive data change on the active surface. Add/extend tests to keep 100% coverage.
- **`LIBRARY_CAPABILITIES.md`** — an ai-assist recipe: construct `{ provider: 'ollama', endpoint?: 'http://host:11434/v1', model: '<installed>' }`; note the empty-key header omission, `defaultModel: ''` requiring an explicit model, that `executeClientToolTurn` now honors `endpoint` (PR #466), and the **browser CORS caveat** (`OLLAMA_ORIGINS` must be set; direct browser→localhost:11434 is blocked by default).
- Gates: `rushx build` + `rushx lint` + `rushx test` (100%) in `ts-extras`; `rushx fixlint`; `code-reviewer` on the diff. Small, fast PR to `release`.

This is the ~1-day quick win. Do it first.

---

## Task B — design `@fgv/ts-extras-ollama` (DESIGN ONLY now; no scaffolding, no `rush add`, no source)

Deliverable: a design doc at `.ai/tasks/active/ollama-native/design.md` (+ short `brief.md`/plan if warranted). The package is a native-API Result boundary owning ONLY what the `/v1` compat layer can't do. ai-assist keeps the completion path; do NOT duplicate it.

**Native-only surface to design** (mirror `@fgv/ts-extras-transformers`'s boundary shape — ~7 primitives, all `Promise<Result<T>>` via `captureAsyncResult`, explicit NOT-in-scope):

- **Model management:** `listModels` (`/api/tags` — size/family/quantization/modifiedAt detail), `showModel` (`/api/show` — capabilities/parameters), `pullModel` (`/api/pull` — STREAMED progress; design the progress callback + Result shape carefully, this is the trickiest piece), `listRunning` (`/api/ps` — loaded models + VRAM), `deleteModel`.
- **Grammar-constrained structured output:** `chatStructured<T>(client, model, messages, schema)` using native `/api/chat` `format` = full JSON schema. Design around `@fgv/ts-json-base` `JsonSchema.ISchemaValidator<T>` so the wire schema (`schema.toJson()`) and the result validator (`schema.validate()`) derive from ONE declaration and can't drift. Headline fidelity win over the prompt-and-parse `/v1` path.
- **Native embeddings:** `embed` (`/api/embed`) — FLAG as an open question whether it belongs here given the transformers facade already ships `embed` (value = reusing an already-pulled GGUF vs a separate ONNX download).

Pin concretely: exact primitive signatures, key types (`IOllamaModel`, `IOllamaModelDetail`, `IOllamaRunningModel`, `IOllamaPullProgress`, …), factory `createOllamaClient({ host?, fetch? }): Result<…>`, error handling, JSON-lines streaming envelope handling for pull progress, and a test strategy WITHOUT a live daemon (mock `fetch`/injected client; fixture `/api/tags`, `/api/show`, multi-chunk `/api/pull`, `/api/ps`, `/api/embed`, `/api/chat` with `format`). Node-only at v0.1 (localhost HTTP; document the `ollama/browser` + `OLLAMA_ORIGINS` CORS path as out-of-scope-but-possible).

**Decisions to lock:** wrap the `ollama` JS lib (recommended — it handles the JSON-lines/pull-progress envelopes) vs direct `fetch`, with justification; peer-dep (transformers-style) vs direct-dep posture; the NOT-in-scope list (completion path → ai-assist; browser/CORS; `push`/`create`; `keep_alive` policy; pull-progress UI; multi-host orchestration).

**Erik's directive:** design it fully now — do NOT defer waiting for a consumer; this is well-trod. **Caveat:** if a specific decision GENUINELY depends on the first consumer's needs, call it out as a held open-question rather than guessing — but expect few of these, and be honest about which is which.

**Design-doc structure:** problem & two-axis local-AI story; what works today vs the gap (cite files/lines); the native-only surface with full signatures + types; the `chatStructured` + `JsonSchema` design; the pull-progress streaming design; wrap-vs-fetch + dep-posture decision; test strategy; explicit NOT-in-scope; open questions (separating consumer-dependent from decided); and a **phased implementation plan** (phase breakdown + S/M/L sizing) mirroring the `local-ai-exploration` B-1→B-4 cadence. Note implementation begins after Task A + the MCP slice land.

Design-only: no `rushx build`/`test` (no code). Just the doc(s).

---

## Reject (do not pursue): Option C

A new `'ollama-native'` `AiApiFormat` in ai-assist's registry was considered and rejected — most code on the most sensitive seam (the 4-provider adapter set, different JSON-lines streaming envelope) for the least complete payoff (still orphans model management). If cross-provider structured output is ever wanted, the cheap move is an additive `responseFormat?` field on the existing completion path (benefits OpenAI/Groq/Mistral too) — a SEPARATE concern, not this stream.

## Report-back

Task A: branch, PR number (to `release`), what landed. Task B: the design doc path/PR, key decisions locked, and any genuinely consumer-dependent open questions held.
