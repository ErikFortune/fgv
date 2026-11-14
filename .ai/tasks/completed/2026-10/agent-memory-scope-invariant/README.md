# agent-memory-scope-invariant: the store enforces scope == codec scope on load

**Shipped**: 2026-10-17 into `integration/asks`. The PR number goes in `meta.yaml` when the PR is
opened. Package: `@fgv/ts-agent-memory`.

## Summary

Follow-up D2 from `agent-memory-merge-scope` (#731). The hybrid merge keys on
`scopedAddressOf(record, resolver)`. That address is the one a record was read from only if
`scope == codec(kind).encode(entityId).scope` holds for every loaded record.

Before this stream, the shipped codecs happened to guarantee that, but the `IIdentityCodec`
contract did not. `verifyLoadedIdentity` now checks it on every load, for every codec. A
foreign-scope file fails the read or the open, or is quarantined under `onRecordError: 'skip'`.

## Files changed

- `libraries/ts-agent-memory/src/packlets/store/storeIdentity.ts`: the check, as one chain.
- `libraries/ts-agent-memory/src/packlets/store/fileTreeMemoryStore.ts`: class and `_verifyLoaded`
  TSDoc.
- `libraries/ts-agent-memory/src/packlets/types/identityCodec.ts`: `verifyRoundTrip` TSDoc.
- `libraries/ts-agent-memory/src/packlets/types/identityResolver.ts`: `scopedAddressOf` TSDoc.
- New `libraries/ts-agent-memory/src/test/unit/store/scopeInvariant.test.ts`.
- `libraries/ts-agent-memory/CAPABILITIES.md` and a change file.

## Decisions made during execution

- No fixture changed. None of the five test codecs #731 named loads from a foreign scope.
- The regression suite brings its own scope-blind flat and versioned codecs, rather than repurposing
  an existing fixture.

## Followups

None opened. `result.md` reports that a non-identity `scopeEncoding` produces a vault the store
cannot reopen. The new check makes that failure loud instead of silent, but the fix needs an
inverse encoding.

## Evidence

`result.md` covers the belief verdicts, neutralize-and-confirm, per-fixture dispositions, the
`scopeEncoding` probe and the gate counts.
