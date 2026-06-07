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
- **Multimodal tool-result passthrough** — non-text content blocks are projected to a one-line
  `[<type> block]` summary.
- **Cross-server tool-name namespacing** — duplicate tool names already fail loudly in
  `AiAssist.executeClientToolTurn`.
- **MCP server orchestration / lifecycle management beyond a single session.**

See [`docs/FUTURE.md`](../../docs/FUTURE.md) for the tracked follow-ups.

## The primitives

| Function | Return |
|---|---|
| `createStdioTransport({ command, args?, env?, cwd? })` | `Result<IMcpTransport>` |
| `createHttpTransport({ url, headers? })` | `Result<IMcpTransport>` |
| `connectMcpSession({ transport, clientName?, clientVersion?, logger? })` | `Promise<Result<IMcpSession>>` |
| `closeMcpSession(session)` | `Promise<Result<true>>` |
| `listMcpTools(session)` | `Promise<Result<ReadonlyArray<IMcpToolDescriptor>>>` |
| `callMcpTool(session, name, args)` | `Promise<Result<IMcpToolCallResult>>` |
| `adaptMcpTools(session, { logger? })` | `Promise<Result<IAdaptMcpToolsResult>>` |

## Usage

```typescript
import {
  createStdioTransport,
  connectMcpSession,
  adaptMcpTools,
  closeMcpSession
} from '@fgv/ts-extras-mcp';
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
