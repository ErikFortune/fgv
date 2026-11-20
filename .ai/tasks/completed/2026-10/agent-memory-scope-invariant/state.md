# State: `agent-memory-scope-invariant`

**Status:** complete, pushed to `agent-memory-scope-invariant`. No PR opened, as the brief requires.

## Checkpoints

- [x] Branch checked out at `fb9f66289`, `rush install` clean.
- [x] Beliefs 1–5 verified against source (verdicts in `result.md`).
- [x] Scope check added to `verifyLoadedIdentity` as one chain.
- [x] Existing suite run with the check in place: all 915+ tests green before any fixture change. No
      fixture needed touching.
- [x] Regression suite `test/unit/store/scopeInvariant.test.ts` (8 tests).
- [x] Neutralize-and-confirm: 5 of 8 red with the comparison removed, restored.
- [x] TSDoc (store class, `verifyRoundTrip`, `scopedAddressOf`, `_verifyLoaded`) and
      `CAPABILITIES.md` updated.
- [x] Change file (`minor`, `BREAKING:`).
- [x] Package gates, repo-wide `rebuild` and `test`, `change --verify`.
- [x] `scopeEncoding` probe run (temporary test, not committed).
- [x] Close-out: migrated, `meta.yaml`, `README.md`, ledger entry, capability feed.

## Open questions

None blocking. Two notes for the orchestrator are in `result.md` § "What the brief got wrong".
