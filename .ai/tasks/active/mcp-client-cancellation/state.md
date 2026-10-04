# State — `mcp-client-cancellation`

Worker-owned.

## Progress

| step | ask | commit |
|---|---|---|
| 1 | #678 transport seam — `createCustomTransport` | `7873d86b` |
| 2 | #673 `McpFailureReason` + `onClose` | `94c04327` |
| 3 | #671 `IMcpRequestOptions` on call / list / connect | `cee54a20` |
| 4 | #684 `IAiClientTool.execute(args, context?)` + adapter forwarding | `6478fe28` |
| — | docs + change files | see `git log` |

## Decisions taken (with the evidence that forced them)

- **Seam shape: accept a pre-built SDK transport, not `createInMemoryTransportPair`.** The pair's
  server half must be an SDK `Transport` for `server.connect` to accept it without a cast, so the
  pair would have to *name* the SDK type in its return — leaking more than the alternative.
  `createCustomTransport(t: IMcpSdkTransport)` takes a structural three-method shape (method
  bivariance admits the SDK's `send(message: JSONRPCMessage)`), names no SDK type, and also
  admits transports the package doesn't wrap (legacy SSE, WebSocket).
- **Abort is classified by identity, not by code.** SDK 1.29.0 `Protocol.request` `cancel()` wraps a
  non-`McpError` abort reason in `new McpError(ErrorCode.RequestTimeout, String(reason))`
  (`dist/esm/shared/protocol.js` ~l.685). A code-based classifier reports every abort as `timeout`.
- **Fallback kind is `transport`, not `unknown`.** Deviation from the `FetchFailureReason`
  precedent, recorded in `result.md`.
- **`unauthorized` ships now**: it has a producer today (a static bearer token refused → HTTP 401 →
  `StreamableHTTPError(401)`), proven against a real loopback server.
- **Close observation: `onClose` callback**, not a status read.

## Brief deviations

- `ts-extras/src/packlets/ai-assist/model.ts` and `index.ts` were edited (one re-export line each)
  — the brief's surface list named only `toolTypes.ts` and the builder, but a new public type must be
  re-exported through both barrels.
- The `ts-extras-system-one` precedent the brief cites does not exist as code: on
  `integration/system-one-decisions` there is only a design doc
  (`docs/design/system-one-decisions/design.md` § `SystemOneFailureReason`). The code precedent
  used is `SaferFetch.FetchFailureReason` (`ts-extras/src/packlets/safer-fetch/failureReason.ts`).

## Open questions

None blocking.
