# Result — ollama-native

Shipped first-class Ollama support across two activities.

- **Task A** — ai-assist recipe + `ollama`/`openai-compat` capability-config, making the already-working local `/v1` completion path discoverable (empty-key omission, `defaultModel: ''` caveat, `endpoint` override incl. `executeClientToolTurn`, `OLLAMA_ORIGINS` CORS caveat) — **PR #468** (→ `release`).
- **Task B** — `@fgv/ts-extras-ollama` (Node) native-API Result boundary over the `ollama` JS lib: model management (`listModels`/`listRunning`/`showModel`/`deleteModel`), streamed `pullModel`, and grammar-constrained `chatStructured` (one-declaration `JsonSchema` no-drift + draft-07 sanitizer) — **PRs #472–#475**.
- **Promoted to `release`** — **PR #477**.

Native `embed` is **CUT** (OQ-1, resolved by `ai-assist-embeddings`): Ollama embeddings are owned by `AiAssist.callProviderEmbedding` via `/v1`. `chatStructured` runs over the **streaming** chat path (the only `AbortSignal`-cancellable path) per the ratified O-4 deviation. Browser sibling (O-5) deferred in `docs/FUTURE.md`. See `state.md` for the full phase ledger and `design.md` for the surface.
