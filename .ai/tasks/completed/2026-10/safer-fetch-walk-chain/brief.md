# Brief: `safer-fetch-walk-chain` — Result-chain the safer-fetch hop walk (followups D1)

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** followups D1, from the #729 deep review. User decision (a), 2026-10-19. **Base / PR target:** `integration/asks`.

**Read first:**
- the `mcp-round-2b` result.md, especially its **revert matrix** (`.ai/tasks/completed/2026-10/mcp-round-2b/` or wherever the ledger points);
- `libraries/ts-extras/src/packlets/safer-fetch/saferFetch.ts`;
- `docs/design` and the safer-fetch threat model, if present.

## What

`_walk` steps through six per-hop checks, each followed by an `isFailure` / `_propagate`:
1. request guard;
2. scheme recheck;
3. address guard;
4. loop detection;
5. the connect;
6. the next hop.

`_execute` does the same for three. Convert both to Result chains, or to recursion over the hop.

## This is security-critical: correctness is ordering

The SSRF guard's correctness is a property of **ordering**: every check runs before the request it guards, and nothing re-reads a mutable value between check and use. A refactor that keeps every check but moves one across an `await` or a hop boundary is a vulnerability that passes every value-based test.

- **Behaviour-preserving only.** No new checks, no removed checks, no changed messages or failure reasons except where a message is provably unreachable. The public API is unchanged.
- **Before writing code,** enumerate in `state.md` every check-then-act window in the current `_walk` / `_execute`: each `await` between a check and the action it guards, each value read twice, and the redirect-hop boundary. After the rewrite, show that the same list holds, line by line.
- **The revert matrix is the regression check.** Each `mcp-round-2b` revert row (each guard deliberately disabled) must still turn its test red after the rewrite. Run every row, and record which test goes red for each.
- **No widening.** Leave everything outside `_walk` / `_execute` alone, apart from what chaining forces.

## Acceptance

- [ ] Both functions are chained, with no stacked `isFailure` left, and readability is no worse. If a chain is less clear than the loop, recursion over hops is fine.
- [ ] The check-then-act enumeration, before and after, is in `state.md`.
- [ ] The revert matrix is re-run with every row red, and the table is in `result.md`.
- [ ] Gates:
  - ts-extras build, lint and test at 100%;
  - repo-wide rebuild and test;
  - `change --verify` (change file `none`, or `patch`-equivalent `minor` per repo convention, with the comment "internal refactor, no behaviour change");
  - capability docs and feed check;
  - prettier 2.8.
- [ ] Close-out as usual.

## Mechanics

Own worktree. Push only to `safer-fetch-walk-chain`; no PR. No sub-agents. Commit before gates; run gates in the foreground with per-worktree logs. The orchestrator runs an adversarial, ordering-focused review afterwards; expect it to be thorough.
