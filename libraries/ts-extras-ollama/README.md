# @fgv/ts-extras-ollama

Result-integration boundary over the official [`ollama`](https://github.com/ollama/ollama-js) JS
library for Node-side consumers. Owns **exactly and only** the native-Ollama surface that the
OpenAI-compatible `/v1` endpoint cannot express.

**Status:** v0.1 surface complete (the `ollama-native` stream, phases O-1…O-4). Native `embed` is
held pending the cross-provider `ai-assist-embeddings` design.

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

## Quick start

```typescript
import { createOllamaClient, listModels, pullModel, chatStructured } from '@fgv/ts-extras-ollama';
import { JsonSchema } from '@fgv/ts-json-base';

// Construct a client (defaults to http://127.0.0.1:11434). Returns Result<IOllamaClient>.
const client = createOllamaClient().orThrow();

// Enumerate locally-pulled models with GGUF metadata the /v1 layer can't surface.
const models = await listModels(client);
if (models.isSuccess()) {
  for (const m of models.value) {
    console.log(`${m.name} — ${m.details.parameterSize} ${m.details.quantizationLevel}, ${m.size} bytes`);
  }
}

// Pull a model with streamed progress; the Result resolves when the stream terminates.
const pulled = await pullModel(client, {
  model: 'llama3.1:8b',
  onProgress: (p) => console.log(p.status, p.completed, '/', p.total)
});

// Grammar-constrained structured output — one schema is BOTH the wire `format` and the validator.
const personSchema = JsonSchema.object({
  name: JsonSchema.string(),
  age: JsonSchema.integer()
});

const structured = await chatStructured(client, {
  model: 'llama3.1:8b',
  messages: [{ role: 'user', content: 'Invent a person as JSON.' }],
  schema: personSchema // T is derived via JsonSchema.Static<typeof personSchema> — no cast
});
if (structured.isSuccess()) {
  // structured.value.value is { name: string; age: number }, validated by the same schema.
  console.log(structured.value.value.name, structured.value.value.age);
}
```

For **text completion / streaming / tool-use** against the same daemon, use
`@fgv/ts-extras/ai-assist` (`callProviderCompletion` / `callProviderCompletionStream` /
`executeClientToolTurn`) with a provider `endpoint` of `http://localhost:11434/v1` — that path is
not duplicated here.

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
