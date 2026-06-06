# @fgv/ts-extras-ollama

Result-integration boundary over the official [`ollama`](https://github.com/ollama/ollama-js) JS
library for Node-side consumers. Owns **exactly and only** the native-Ollama surface that the
OpenAI-compatible `/v1` endpoint cannot express.

**Status:** in development (the `ollama-native` stream, phases O-1…O-4).

---

## What this is

A thin facade that wraps the `ollama` client's native-API calls in `Result<T>` from
`@fgv/ts-utils`, mirroring the discipline established by
[`@fgv/ts-extras-webauthn`](../ts-extras-webauthn) and
[`@fgv/ts-extras-transformers`](../ts-extras-transformers): one-line `captureAsyncResult` /
`captureResult` wrappers around upstream primitives with **no opinionated orchestration** above the
boundary. Consumers compose the primitives themselves.

The text-completion / streaming / tool-use path is **not** here — `@fgv/ts-extras/ai-assist` owns it
via the `/v1` compat layer (point a provider descriptor's `endpoint` at `http://localhost:11434/v1`
and call `callProviderCompletion` / `callProviderCompletionStream` / `executeClientToolTurn`).

## The native-only surface

| Function | Wraps | Status |
|---|---|---|
| `createOllamaClient(params?)` | `new Ollama(...)` | O-1 |
| `listModels(client)` | `client.list()` (`/api/tags`) | O-2 |
| `showModel(client, model)` | `client.show(...)` (`/api/show`) | O-2 |
| `listRunning(client)` | `client.ps()` (`/api/ps`) | O-2 |
| `deleteModel(client, model)` | `client.delete(...)` (`/api/delete`) | O-2 |
| `pullModel(client, params)` | `client.pull({ stream: true })` (`/api/pull`) | O-3 |
| `chatStructured(client, params)` | `client.chat({ format })` (`/api/chat`) | O-4 |

## Explicitly NOT in scope

- Text completion / free-text chat / streaming chat → ai-assist owns it via `/v1`.
- Browser / CORS path → Node-only at v0.1; a future `@fgv/ts-web-extras-ollama` is its home.
- Model authoring / publishing (`push`, `create`, `copy`) → use the `ollama` lib directly.
- `keep_alive` / model-lifecycle policy → pass-through only, no policy applied.
- Pull-progress UI / rendering → `onProgress` hands raw chunks to the consumer.
- Multi-host orchestration / connection pooling / retries / backoff → one client = one host.
- Native embeddings (`embed`) → HELD pending the cross-provider `ai-assist-embeddings` design.

For anything not wrapped here, use the `ollama` library directly (with `captureAsyncResult` for your
own Result wrapping) — the client handle returned by `createOllamaClient` is the upstream instance.

---

## Runtime requirements

- **Node.js:** v20 LTS or later.
- **`ollama`:** ^0.6.0 (peer dependency; bring your own).
- **`@fgv/ts-utils`:** workspace:* (peer dependency).

## License

MIT — same as the parent fgv monorepo.
