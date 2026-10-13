# mcp-round-2a — MCP fidelity and lifecycle

**Shipped**: 2026-10-13 into `integration/asks` (PR number recorded in `meta.yaml` at open).
Package: `@fgv/ts-extras-mcp`.

## Summary

Three PersonAIlity asks, closing the gap between what an MCP server sends and what this package
hands on:

- **#674.** `closeMcpSession` ends a Streamable-HTTP session on the server by sending the `DELETE`
  before closing. This is best-effort and bounded to 2 s.
- **#676.** Tool descriptors carry `title` and `outputSchema`. A new `onToolsChanged` callback
  reports `notifications/tools/list_changed`.
- **#675.** `callMcpTool` returns every content block, converter-validated, as `blocks`, plus
  `structuredContent`. Its text projection now carries a resource link's URI and name, and an
  embedded resource's text. Media data is opt-in. Links are never followed.

## The facts the design rests on

- **The SDK's default `CallToolResultSchema` validates `content` as a closed union.** One block of
  an unknown type rejects the whole response. `callMcpTool` therefore reads results with the SDK's
  generic `ResultSchema` and validates every block itself. An unknown or malformed block becomes
  `{ type: 'unknown', blockType? }` and never fails the call.
- **`terminateSession()` sends the `DELETE` on the transport's own abort signal.** A silent server
  holds it until the transport closes. The 2 s bound is enforced by this package, and the close that
  follows is what aborts a pending `DELETE`.

## Files changed

- `libraries/ts-extras-mcp/src/packlets/mcp/`:
  - new `content.ts`;
  - `model.ts`, `sdk.ts`, `session.ts`, `operations.ts`, `request.ts` (the shared `printable`), and
    `adapter.ts`.
- `libraries/ts-extras-mcp/src/test/unit/`:
  - new `terminate`, `toolsChanged` and `richResults` suites;
  - `mcp`, `failures`, `endToEnd`, `cancellation` and `customTransport` updated for `blocks`.
- `etc/ts-extras-mcp.api.md`, `CAPABILITIES.md`, `README.md`, three change files (`minor`; the #675
  one is `BREAKING:`), and `docs/FUTURE.md` (the multimodal entry is retired).

## Decisions made during execution

- **`__proto__` is refused, not dropped.** A `structuredContent` or `outputSchema` that holds an own
  `__proto__` key is omitted whole, and the refusal is logged at `info`.
- **A `tools/list_changed` that arrives during the connect is held.** It is delivered once, on a
  macrotask after the session has been returned.
- **Strings are checked before they are echoed.** Received strings that reach the projection or a
  descriptor must be one printable line. This also refuses U+2028/U+2029, which `singleLine` admits.
- **Losing connect paths send no `DELETE`.** That keeps them fire-and-forget.

## Open

- `blocks` do not reach an ai-assist client tool. That needs a multimodal tool-result shape in
  `@fgv/ts-extras`.
- The SDK's `tools/list` parse drops some `__proto__` keys before this package sees them. The same
  exposure exists on `inputSchema`. A TECH_DEBT entry is proposed in `result.md`.
- `mcp-round-2b` should route the `DELETE` through its guarded egress and auth. See `result.md`.

See `result.md` for the full record:

- the verdict on each of the brief's beliefs;
- the block mapping;
- the check-then-act windows;
- the 20-row revert matrix;
- the dispositions of the code-reviewer's findings;
- the gate counts.
