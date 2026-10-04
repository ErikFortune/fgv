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

## Gates

Graded by grepping logs, not exit codes. "Warning" counts are case-insensitive (`grep -ci warning`).

| gate | where | result |
|---|---|---|
| `install-run-rush.js rebuild` (repo-wide) | after `b8a120c4` | `SUCCESS: 37 operations`; errors 0 (`not met\|FAILURE\|Operations failed\|Error:\|error TS`); warnings 1 — Rush's pre-build *"Detected 1 Git-tracked symlinks"* repo-analysis notice, present on every run and not a project warning (no `SUCCESS WITH WARNINGS` banner); log not NUL-padded |
| `install-run-rush.js test` (repo-wide) | after `b8a120c4` | `SUCCESS: 36 operations`; errors 0; warnings 1 — the same symlink notice; log not NUL-padded |
| `rushx test` `ts-extras-mcp` | final tree | 106 tests, 8 suites, 100 % statements/branches/functions/lines; warnings 0 |
| `rushx lint` `ts-extras-mcp` | final tree | errors 0, warnings 0 |
| `rushx test` `ts-extras` | after `6478fe28` | 3109 tests, 100 % all metrics; warnings 0 |
| `rushx lint` `ts-extras` | after `6478fe28` | errors 0, warnings 0 |
| `rushx fixlint` | both packages, before each commit | run |
| `change --verify --target-branch origin/integration/asks` | final tree | passes (both change files found) |

After the repo-wide runs, only `ts-extras-mcp` **test files** and docs changed (antagonist-pass
test additions); no source, signature or `ts-extras` file moved, so the package-local run above
covers them.
