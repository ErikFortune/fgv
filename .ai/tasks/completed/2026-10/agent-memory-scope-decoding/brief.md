# Brief: `agent-memory-scope-decoding` — give `scopeEncoding` an inverse (followups D4)

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** followups D4 and the `TECH_DEBT.md` P3 entry "`ts-agent-memory` cannot reopen a vault written with a non-identity `scopeEncoding`". User decision (a), 2026-10-19. **Base / PR target:** `integration/asks`.

## Problem

Writes go through `scopeEncoding(scope)`, but the open-time walk (`_collectEntries` in `fileTreeMemoryStore.ts`) indexes records under the **raw** directory segments, and nothing can recover the scope from them. Since #733, a reopen with a non-identity encoding fails loudly on the scope invariant, so such a vault cannot be reopened at all.

## Decision

- **Pairing.** `FileTreeMemoryStore.create` accepts `scopeDecoding` alongside `scopeEncoding`. Supplying `scopeEncoding` **without** `scopeDecoding` fails `create` with a clear message. This is a breaking change for callers who pass `scopeEncoding` alone, typed `minor` with `BREAKING:`. Search for such callers in the repo and update them.
- **Use at open.** The open walk and every address-first read (`getById`, `resolveRecord`, the reconcile path) map each on-disk path back through `scopeDecoding` before indexing or checking the scope invariant.
- **Round-trip check.** At open, every walked directory must satisfy `scopeEncoding(scopeDecoding(dir)) === dir`, and the decoded scope must be valid per the scope converter. A violation fails, or is quarantined into `skippedRecords` under `onRecordError: 'skip'`, matching the existing error modes. The check is per directory as walked, not a global probe.
- **Signatures.** Choose the decoding signature to mirror `scopeEncoding`'s, returning `Result`. Document the contract in TSDoc: the pair must be a bijection on the scopes the vault uses.
- **Identity case.** With neither option supplied, behaviour is unchanged.

## Acceptance

- [ ] Tests:
  - a vault written with a non-identity encoding (e.g. percent-encoding or a prefix) reopens and every record is retrievable by `get`, `getById` and `list`;
  - an encoding without a decoding is refused at create;
  - a non-round-tripping pair is refused at open, in both modes;
  - the identity default is unchanged;
  - the scope invariant from #733, #735 and #741 still holds through the decoding.
- [ ] Sweep: callers of `scopeEncoding` across `libraries/`, `samples/` and `tools/`, listed in `result.md`.
- [ ] Docs: `ts-agent-memory` CAPABILITIES.md and TSDoc. Resolve the TECH_DEBT entry, citing this stream, and mark D4 shipped (`#TBD`) in followups.md.
- [ ] Gates:
  - package build, lint and test at 100%;
  - repo-wide rebuild and test;
  - `change --verify`, capability docs, feed check;
  - prettier 2.8.
- [ ] Close-out as usual.

## Mechanics

Own worktree. Push only to `agent-memory-scope-decoding`; no PR. No sub-agents. Commit before gates; run gates in the foreground with per-worktree logs.
