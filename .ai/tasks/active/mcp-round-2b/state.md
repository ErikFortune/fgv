# mcp-round-2b — working state

## Progress

- [x] 1. safer-fetch refactor: one hop walk, a per-entry-point finisher (no behaviour change)
- [x] 2. streaming guarded fetch (`createGuardedFetch`)
- [x] 3. MCP `fetch` wiring + `egress-blocked` classification
- [x] 4. OAuth (`authProvider`, `resourceMetadataUrl`, interactive gate)
- [x] code-reviewer (no P1; 3 P2 + 6 P3 fixed, 1 P3 documented), revert matrix, gates
- [ ] finalize

## Disagreements with the brief (also in result.md)

- A guarded fetch's `network` / `timeout` / `aborted` failures are not configuration refusals, so
  they do not classify as `egress-blocked`.
- The body list must include `URLSearchParams` (the SDK's token requests).
- `mcp-session-id` is not added to safer-fetch's default stripped headers (protocol-agnostic
  primitive; shared by every buffered caller); documented for MCP consumers who allow redirects.

## Open question for the orchestrator

- None blocking. FUTURE.md now carries the `auth()` helper (with a proposed shape) and pinned
  connect for MCP egress.
