# Convention — Result-integration boundary package shape

> Moved out of `LIBRARY_CAPABILITIES.md` by the `library-capabilities-split` stream: it is a
> repo convention about how to shape a package, not a capability of any one package. The
> capabilities index links here.

---

When fgv wants to expose functionality from a well-maintained upstream library without baking in opinion or maintenance burden, the right shape is a thin **Result-integration boundary**: convert thrown exceptions / rejected promises into `Result<T>`, expose ~5–8 primitive operations, and enumerate explicitly what is NOT in scope. No opinionated orchestration beyond the conversion.

Reference instances in this file:
- **`@fgv/ts-extras-webauthn` + `@fgv/ts-web-extras-webauthn`** — six primitives wrapping `@simplewebauthn/*`; ceremony orchestration, challenge management, and credential storage are explicitly out of scope.
- **`@fgv/ts-extras-transformers` + `@fgv/ts-web-extras-transformers`** — four primitives wrapping `@huggingface/transformers`; pipeline cache, model registry, device/quantization policy are explicitly out of scope.
- **`@fgv/ts-extras-mcp`** — seven primitives wrapping `@modelcontextprotocol/sdk` plus one piece of glue (`adaptMcpTools` → `AiAssist.IAiClientTool[]`); browser sibling, MCP resources/prompts/sampling, OAuth, and multimodal passthrough are explicitly out of scope.
- **`@fgv/ts-extras-ollama`** — six primitives (v0.1; native `embed` cut — Ollama embeddings are owned by `AiAssist.callProviderEmbedding` via `/v1`) wrapping the `ollama` JS lib's *native* API (model management, streamed pull, grammar-constrained structured output); the completion path (ai-assist via `/v1`), browser/CORS, and model authoring are explicitly out of scope.
- **`@fgv/ts-agent-memory-sqlite-vec`** — `SqliteVecVectorIndex` **and** `SqliteVecFragmentIndex` wrapping `better-sqlite3` + `sqlite-vec` to implement `@fgv/ts-agent-memory`'s `IVectorIndex` **and `IFragmentVectorIndex`** seams with a persistent `vec0` file (survives restart → no re-embed on open); ANN/large-N, connection lifecycle, embedding, and a browser sibling are explicitly out of scope. Note this one implements existing *fgv* seams (rather than only wrapping the upstream lib), so its "primitives" are the `IVectorIndex` / `IFragmentVectorIndex` methods plus each `create` / `open`.

**Dependency posture is per-package and deliberately not uniform.** Do not read the convention as prescribing one. The upstream lib is a **direct dependency** in `ts-extras-mcp` (`@modelcontextprotocol/sdk`) and `ts-extras-webauthn` (`@simplewebauthn/*`), and a **peer dependency** in `ts-extras-transformers` (`@huggingface/transformers`), `ts-extras-ollama` (`ollama`) and `ts-agent-memory-sqlite-vec` (`better-sqlite3`, `sqlite-vec`).

The axis that decides it is **whether the consumer needs to control the version or the instance**. Peer when they do — a native binding they must match to their platform, a model runtime they pin themselves, a database handle they own and whose lifecycle the boundary explicitly does not manage. Direct when the upstream is a pure-JS protocol client the consumer has no reason to hold a second opinion about, and where a peer dep would just be an install step that can only go wrong. `ts-extras-mcp`'s design cites "webauthn-style" for exactly this reason.

State the choice and its reason in the new package's README. The cost of leaving it unstated is that every subsequent boundary package re-derives it from scratch — which is how this ended up two-and-two without anyone deciding it.

Both pairs have an explicit "NOT in scope" enumeration — that list is load-bearing. A new integration-boundary package should carry the same shape: thin conversion + explicit not-in-scope list + no opinion added. See the WebAuthn pair's README as the prose template.

---
