# `@fgv/ts-extras-ollama` — native Ollama sidecar Result boundary

> **This file is authoritative for what ``@fgv/ts-extras-ollama`` provides and what not to hand-roll.**
> `README.md`, where present, is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.


---

[libraries/ts-extras-ollama](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-extras-ollama)

**A Result-integration boundary over the official [`ollama`](https://github.com/ollama/ollama-js) JS library — owning ONLY the native-API surface the OpenAI-compat `/v1` endpoint cannot express.** Node-only at v0.1. The text-completion / streaming / tool-use path is **NOT** here — `@fgv/ts-extras/ai-assist` owns it via the `/v1` compat layer (point a provider descriptor's `endpoint` at `http://localhost:11434/v1` and call `callProviderCompletion` / `callProviderCompletionStream` / `executeClientToolTurn`). This package is the *native-only* complement: model management, streamed pulls, and grammar-constrained structured output.

`createOllamaClient({ host?, fetch?, headers? })` returns `Result<IOllamaClient>` (the opaque upstream `Ollama` handle, re-exported — anything not wrapped here is reachable on it directly). Every primitive is client-first and returns `Promise<Result<T>>`:

| Primitive | Wraps | Returns |
|---|---|---|
| `listModels(client)` | `GET /api/tags` | `ReadonlyArray<IOllamaModel>` — GGUF `size`/`family`/`parameterSize`/`quantizationLevel`/`modifiedAt` the `/v1/models` list can't give. |
| `listRunning(client)` | `GET /api/ps` | `ReadonlyArray<IOllamaRunningModel>` — loaded models + `sizeVram` + `expiresAt`. |
| `showModel(client, model, { verbose? })` | `POST /api/show` | `IOllamaModelInfo` — `modelfile`/`parameters`/`template`/`capabilities`/`modelInfo`. |
| `deleteModel(client, model)` | `DELETE /api/delete` | `IOllamaDeleteResult` (`{ model, deleted: true }` — not `Result<void>`). |
| `pullModel(client, { model, insecure?, onProgress?, signal? })` | `POST /api/pull` (streamed) | `IOllamaPullResult` (`{ model, finalStatus, chunkCount }`). Drives the JSON-lines progress stream internally; `onProgress` fires per chunk; the terminal `Result` resolves when the stream ends. `AbortSignal` cancels the in-flight download. |
| `chatStructured<T>(client, { model, messages, schema, options?, keepAlive?, signal? })` | `POST /api/chat` with `format` | `IOllamaChatStructuredResult<T>` (`{ value, raw, model, doneReason? }`). |

**The headline win — `chatStructured` no-drift, grammar-constrained output.** `schema` is a `JsonSchema.ISchemaValidator<T>` (`JsonSchema.object(...)` from `@fgv/ts-json-base`). The SAME object is BOTH the wire `format` (`schema.toJson()`, draft-07-sanitized to strip `$schema`/`additionalProperties` per the Gemini precedent) AND the reply validator (`schema.validate()`) — they cannot drift. `T` is derived via `JsonSchema.Static<typeof schema>` — no caller-supplied `T`, no cast. Ollama constrains the token sampler to the schema, so the reply is structurally guaranteed to match (a stronger guarantee than ai-assist's prompt-and-parse `generateJsonCompletion`, which asks-and-parses). `chatStructured` runs over the streaming chat path internally (the only path the `ollama` lib lets an `AbortSignal` cancel) and validates the assembled document whole.

**Dependency posture (mirrors `@fgv/ts-extras-transformers`):** `ollama` is a **peer + dev** dependency (bring your own pinned version); `@fgv/ts-utils` is **peer + dev** (consumer-provided, not installed transitively); only `@fgv/ts-json-base` is a hard **dependency** (`chatStructured` consumes `JsonSchema` as a first-class surface type).

**Explicitly NOT in scope:** text completion / chat / streaming (ai-assist via `/v1`); browser / CORS (`ollama/browser` + `OLLAMA_ORIGINS` — a future `@fgv/ts-web-extras-ollama` sibling); model authoring (`push`/`create`/`copy`); `keep_alive`/lifecycle policy (pass-through only); pull-progress UI; multi-host orchestration / pooling / retries; native tool-calling on `/api/chat` (ai-assist owns tool turns). **Native embeddings (`embed`) are CUT** — resolved by the `ai-assist-embeddings` design (OQ-1): Ollama embeddings are reachable via `/v1/embeddings` and are owned by `AiAssist.callProviderEmbedding` (the `ollama` descriptor's `baseUrl` already targets `http://localhost:11434/v1` — pass the embedding model via `modelOverride`, and use the per-call `endpoint` override for a non-default host). Native `/api/embed` adds only marginal diagnostics (`total_duration`/`prompt_eval_count`) not worth a parallel path; revisit additively only if a concrete consumer needs them.

**Upstream:** `ollama` `^0.6.0` (peer dependency).

---

---

## Decision shortcuts

- **Managing a local Ollama sidecar — listing / inspecting / pulling / deleting models, or grammar-constrained structured output?** → `@fgv/ts-extras-ollama` (Node-only). `createOllamaClient({ host? })` → `Result<IOllamaClient>`, then `listModels` / `listRunning` / `showModel` / `deleteModel` (model management the `/v1` layer can't express), `pullModel({ model, onProgress?, signal? })` (streamed download progress → terminal `Result`), and **`chatStructured<T>({ model, messages, schema, signal? })`** for grammar-constrained JSON: the `JsonSchema.object(...)` schema is BOTH the wire `format` (draft-07-sanitized) AND the `schema.validate()` reply validator — one declaration, no drift, `T` derived via `JsonSchema.Static`. **For text completion / streaming / tool-use against the same daemon, this is the WRONG package — use `@fgv/ts-extras/ai-assist` with a provider `endpoint` of `http://localhost:11434/v1`.** Native `embed` is **CUT** — Ollama embeddings are owned by `AiAssist.callProviderEmbedding` via `/v1/embeddings` (see the "text → vector" decision shortcut and OQ-1), not this package. `ollama` is a peer dependency.

---

## Recent additions

*Newest first. Populated from each stream's `summary.sourceLine` — see the split brief's phase 2.*
