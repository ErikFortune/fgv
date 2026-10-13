# @fgv/ts-extras-mcp

Result-integration boundary over [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk)
for Node consumers. Connect to MCP (Model Context Protocol) servers, discover their tools, and
**adapt each into an `AiAssist.IAiClientTool`** from
[`@fgv/ts-extras`](../ts-extras) so it drops directly into `AiAssist.executeClientToolTurn`.

Net effect: any MCP server's tools become callable across all four cloud providers (Anthropic,
OpenAI, Gemini, xAI) with no per-provider work.

---

## What this is

A thin facade that wraps `@modelcontextprotocol/sdk` calls in `Result<T>` from `@fgv/ts-utils`,
mirroring the discipline established by
[`@fgv/ts-extras-webauthn`](../ts-extras-webauthn) and
[`@fgv/ts-extras-transformers`](../ts-extras-transformers): `captureAsyncResult` conversion of the
upstream throw-based API into `Result<T>`, plus exactly one piece of glue — converting MCP tool
descriptors into `IAiClientTool[]`. **No opinionated orchestration above the boundary.**

All `@modelcontextprotocol/sdk` imports live in a single file (`src/packlets/mcp/sdk.ts`) so the
announced SDK v2 client-package rename is a one-file change.

## Explicitly NOT in scope

These were considered and deferred — use `@modelcontextprotocol/sdk` directly (with
`captureAsyncResult` for your own Result wrapping) for any of them:

- **Browser sibling** (`@fgv/ts-web-extras-mcp`) — Node-only at v0.1.
- **MCP resources / prompts / sampling** — tool discovery + invocation only.
- **OAuth / managed auth** — static headers only (`createHttpTransport({ headers })`).
- **Following resource links** — `callMcpTool` reports a `resource_link`'s URI; fetching it is
  yours, through your own egress guard.
- **Rich blocks in the ai-assist round-trip** — `adaptMcpTools` hands the model the text projection;
  `callMcpTool` returns the blocks themselves.
- **Cross-server tool-name namespacing** — duplicate tool names already fail loudly in
  `AiAssist.executeClientToolTurn`.
- **MCP server orchestration / lifecycle management beyond a single session.**

See [`docs/FUTURE.md`](../../docs/FUTURE.md) for the tracked follow-ups.

## The primitives

| Function                                                                                                                 | Return                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `createStdioTransport({ command, args?, env?, cwd? })`                                                                   | `Result<IMcpTransport>`                                                                                                               |
| `createHttpTransport({ url, headers? })`                                                                                 | `Result<IMcpTransport>`                                                                                                               |
| `createCustomTransport(sdkTransport)`                                                                                    | `Result<IMcpTransport>`                                                                                                               |
| `connectMcpSession({ transport, clientName?, clientVersion?, logger?, onClose?, onToolsChanged?, timeoutMs?, signal? })` | `Promise<DetailedResult<IMcpSession, McpFailureReason>>`                                                                              |
| `closeMcpSession(session)`                                                                                               | `Promise<Result<true>>` — over Streamable HTTP, ends the server's session with a best-effort `DELETE` (bounded to 2 s) before closing |
| `listMcpTools(session, options?)`                                                                                        | `Promise<DetailedResult<ReadonlyArray<IMcpToolDescriptor>, McpFailureReason>>`                                                        |
| `callMcpTool(session, name, args, options?)`                                                                             | `Promise<DetailedResult<IMcpToolCallResult, McpFailureReason>>` — `{ content, blocks, structuredContent? }`                           |
| `adaptMcpTools(session, { logger? })`                                                                                    | `Promise<DetailedResult<IAdaptMcpToolsResult, McpFailureReason>>`                                                                     |

`listMcpTools`' `options` is an `IMcpRequestOptions`: `timeoutMs`, `signal`, `onProgress`,
`resetTimeoutOnProgress`, `maxTotalTimeoutMs`. `callMcpTool`'s is an `IMcpCallToolOptions`: the same,
plus `includeMediaData`. Every failure's `detail` is an `McpFailureReason` whose `kind` is one of
`tool-error`, `timeout`, `aborted`, `not-connected`, `session-expired`, `unauthorized`, `protocol`,
`transport`, `invalid-handle` or `invalid-options` — branch on it rather than on the message. See `CAPABILITIES.md`
for how each SDK error maps to a kind.

### Rich results

`callMcpTool` returns every content block, converter-validated, as `blocks` — `text`,
`resource_link` (`uri`, `name?`, `title?`, `mimeType?`, `description?`), `resource` (`uri?`,
`mimeType?`, and embedded text or a blob's `byteLength`), `image` / `audio` (`mimeType?`,
`byteLength`) and `unknown` for anything else or malformed — plus `structuredContent` when it is
JSON. A `uri` or `mimeType` that is missing or not one printable line is dropped and the block kept
(except a `resource_link`'s `uri`, which is the point of that block). Line-wrapped base64 is
malformed. A block's `annotations` and `_meta` are not carried. `content` is the text projection a
model sees: a `resource_link` becomes `[resource_link: <uri> (<name>)]` and an embedded text resource
its text. Media data rides only when asked for:

```ts
const result = await callMcpTool(session, 'get-tiny-image', {}, { includeMediaData: true });
// result.value.blocks[1] → { type: 'image', mimeType: 'image/png', byteLength: 8, data: 'iVBORw0KGgo=' }
```

The package never follows a `resource_link`: its URI is server-supplied, so fetch it only through
your own egress guard.

### Cancelling and bounding calls

```ts
const controller = new AbortController();
const result = await callMcpTool(
  session,
  'search',
  { q: 'x' },
  { timeoutMs: 10_000, signal: controller.signal }
);
if (result.isFailure() && result.detail?.kind === 'timeout') {
  // ...
}
```

An adapted tool forwards the turn's signal from `AiAssist.executeClientToolTurn({ signal })`, so
aborting the turn cancels the in-flight MCP request (the server receives `notifications/cancelled`).

### Testing against an in-process server

```ts
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
await server.connect(serverSide); // your SDK `Server` / `McpServer`
const transport = createCustomTransport(clientSide).orThrow(); // single-use
const session = (await connectMcpSession({ transport })).orThrow();
```

## Usage

```typescript
import { createStdioTransport, connectMcpSession, adaptMcpTools, closeMcpSession } from '@fgv/ts-extras-mcp';
import { AiAssist } from '@fgv/ts-extras';

// 1. Connect to an MCP server (stdio spawns a subprocess; see the security note below).
const transport = createStdioTransport({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-everything']
}).orThrow();

const sessionResult = await connectMcpSession({ transport });
if (sessionResult.isFailure()) {
  // connection / handshake failed
  return;
}
const session = sessionResult.value;

// 2. Adapt the server's tools into ai-assist client tools.
const adaptResult = (await adaptMcpTools(session, { logger })).orThrow();

// adaptResult.tools  → ReadonlyArray<AiAssist.IAiClientTool>, ready to hand to the model
// adaptResult.skipped → tools whose inputSchema is outside the supported JSON Schema subset
//                       (each carries the failing schema + a JSON-pointer reason)

// 3. Drop the adapted tools straight into the client-tools turn loop.
const turn = AiAssist.executeClientToolTurn({
  descriptor,
  apiKey,
  prompt,
  clientTools: adaptResult.tools
}).orThrow();

// ... iterate turn.events / await turn.nextTurn ...

await closeMcpSession(session);
```

### Graceful degradation (load-bearing)

`adaptMcpTools` **never fails the whole catalog because one tool's schema is unsupported.** When a
discovered tool's `inputSchema` is outside the JSON Schema subset that
[`JsonSchema.fromJson`](../ts-json-base) supports, that one tool is excluded from `tools` (the
model is never offered a tool whose arguments we can't validate), surfaced structurally on
`skipped` (with the tool name, the JSON-pointer reason, and the raw failing schema), and — when a
`logger` is supplied — logged as a NOISY `warning` carrying all three. Point this at a new server
and you immediately see every schema feature that needs additive support in `JsonSchema.fromJson`.

## Compatibility probe

The `samples/testbed` `mcp-probe` scenario points this package at any MCP server and prints a
compatibility report (adapted vs. skipped tools, with the failing schema + reason for each skip).
Run it without wiring the server into an application:

```sh
# stdio server:
MCP_PROBE_COMMAND=npx MCP_PROBE_ARGS="-y @modelcontextprotocol/server-everything" \
  node samples/testbed/bin/testbed.js --scenario mcp-probe

# HTTP server:
MCP_PROBE_URL=http://localhost:3001/mcp MCP_PROBE_HEADERS="authorization=Bearer xyz" \
  node samples/testbed/bin/testbed.js --scenario mcp-probe
```

## Security — stdio transport trust boundary

`createStdioTransport` spawns `command` (with `args`) as a **child process**. The command runs
with the privileges of the host process. **Never source the command, arguments, or environment
from untrusted input** — treat them with the same care as any shell-out. The HTTP transport
(`createHttpTransport`) does not spawn a process; supply credentials via static `headers`.

## Runtime requirements

- Node.js 20 LTS or later.
- `@modelcontextprotocol/sdk` `^1.29.0` (a direct dependency).
