# ollama-native — state

## Task A — recipe + capability config
**✅ SHIPPED via PR #468 (merged to `release`, 2026-06-06).**
- `ollama` + `openai-compat` catch-all `chat` rules added to `DEFAULT_MODEL_CAPABILITY_CONFIG` (registry.ts), parallel to `groq`/`mistral`.
- `LIBRARY_CAPABILITIES.md` recipe (empty-key omission, `defaultModel: ''` caveat, `endpoint` override across all four call paths incl. `executeClientToolTurn` per #466, `OLLAMA_ORIGINS` browser-CORS caveat).
- Unit + integration tests (through `callProviderListModels`); Rush change file (`@fgv/ts-extras`, minor).
- (A speculative `followup.md` the implementing agent added — written without this brief — was stripped before merge; the authoritative artifacts are `brief.md` + `design.md` here.)

## Task B — `@fgv/ts-extras-ollama` native-API boundary
**🛠️ IMPLEMENTED (phases O-1…O-4) and promoting to `release` via PR #477.** Native `embed` remains HELD.

**Promotion:** PR **#477** (`ollama-native` → `release`). CI green; Copilot review converged in **2 rounds** — round 1 surfaced 5 documentation-accuracy findings (sanitizer-keyword spec wording, `@fgv/ts-utils` dependency-posture in LIBRARY_CAPABILITIES, and three `stream:false`→ratified-`stream:true` / `$schema`-default corrections in design.md), all fixed and the threads resolved; round 2 returned no new findings (loop stopped on convergence). Both ratified decisions (streaming transport for `chatStructured`; draft-07 `format` sanitizer) approved by the owner.


| Phase | Scope | PR (→ `ollama-native`) | Status |
|---|---|---|---|
| O-1 | Scaffold + `createOllamaClient` factory (mirrors the ts-extras-transformers Node scaffold; `ollama` dev+peer, `@fgv/ts-json-base` hard dep). | #472 | ✅ merged |
| O-2 | Model management: `listModels`/`listRunning`/`showModel`/`deleteModel` + normalized fgv-owned camelCase types. | #473 | ✅ merged |
| O-3 | `pullModel` — streamed `/api/pull` progress (terminal `Result` + `onProgress` callback, NOT a returned iterable) + `AbortSignal`; layer-2 JSON-lines fetch test. | #474 | ✅ merged |
| O-4 | `chatStructured<T>` (grammar-constrained `/api/chat` `format`, one-declaration `JsonSchema` no-drift + draft-07 sanitizer + `AbortSignal`) + README/LIBRARY_CAPABILITIES docs. | #475 | ✅ merged |

Per-phase gates met: `rushx build` + `rushx lint` (clean) + `rushx test` (100% coverage), `rushx fixlint`, and a `code-reviewer` pass before coverage-chasing. Each phase carries a `rush change` file (`type: none`, new package).

**Decision needing ratification (O-4):** `chatStructured` is implemented over the **streaming** chat path (`stream:true` + `AbortableAsyncIterator.abort()`), not the design §4 sketch's `stream:false`. Rationale: the `ollama` lib threads an `AbortSignal` only on the streaming path (non-streaming chat is uncancellable), so streaming is the only way to honor the locked OQ-3 `AbortSignal` amendment — and matches "the mechanism already exists for `pullModel`". The document is still assembled and validated whole after the stream completes. The `code-reviewer` agent vetted and approved the deviation.

**Still HELD / out of scope:**
- Native `embed` (OQ-1) — gated on the `ai-assist-embeddings` design verdict; build it here only if that design concludes native Ollama `embed` adds something `/v1`-through-ai-assist can't.
- Browser sibling `@fgv/ts-web-extras-ollama` (O-5, future) — `docs/FUTURE.md` candidate.

**Integration note:** the O-4 `LIBRARY_CAPABILITIES.md` cross-link to Task A's ai-assist Ollama `/v1` recipe is conceptual on this branch — Task A (PR #468 → `release`) isn't on the `ollama-native` base, so the literal link reconciles when this stream promotes to `release`.

### Original gating (now resolved for O-1…O-4 except the embed sub-task)
Amendments locked: `chatStructured` gets `AbortSignal` (OQ-3) ✅; draft-07 `format` sanitizer budgeted into O-4 ✅; `embed` HELD pending the embedding verdict.
