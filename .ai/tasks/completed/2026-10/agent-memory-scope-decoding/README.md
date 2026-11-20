# `agent-memory-scope-decoding`: give `scopeEncoding` an inverse

**Shipped 2026-10-19** onto `integration/asks` (PR #747).
Origin: followups D4 (`personality-asks-2026-10/followups.md`) and the retired `TECH_DEBT.md` P3
entry on non-identity `scopeEncoding`. User decision (a), 2026-10-19. It builds on
`agent-memory-scope-invariant` (#733) and the D5/D6 address checks (#735, #741).

---

## What it is

`FileTreeMemoryStore` wrote records through `scopeEncoding(scope)`, but its open-time walk indexed
records under the raw directory path. Nothing could recover a scope from the path. Since #733, such
a vault failed loudly on reopen; before #733, it silently misfiled records. This stream adds the
inverse.

## What shipped

```ts
FileTreeMemoryStore.create({
  root,
  registry,
  scopeEncoding: (scope) => succeed(encodeURIComponent(scope)),
  scopeDecoding: (dir) =>
    captureResult(() => decodeURIComponent(dir)).onSuccess((s) => Convert.scopeKey.convert(s))
});
```

- **Pairing.** `scopeEncoding` without `scopeDecoding` is refused at `create`. A decoding alone
  pairs with `defaultMemoryScopeEncoding`. Neither means the identity layout, which is unchanged.
- **Open.** Each directory that holds records is decoded once. The result must pass
  `Convert.scopeKey` and re-encode to that directory, and the #733 scope invariant is checked
  against the decoded scope. A failure fails the open, or under `'skip'` it quarantines that
  directory's records.
- **Reads and writes.** Every one requires its encoded directory to decode back to the requested
  scope, so a non-bijective pair cannot write a directory the next open would refuse.
- **`ISkippedRecord`.** `scope` is optional, absent when the directory does not decode. `path` is
  the on-disk path.

## What changed shape

- **Only record-holding directories are checked**, not every walked directory as the brief said. An
  intermediate directory of an encoded layout, such as `s-conversations` under a per-segment prefix,
  is not a scope.
- **The round-trip check also guards writes.** The brief named only the read paths.
- **`ISkippedRecord.scope` became optional.** The brief did not anticipate this.

## Artifacts

- `brief.md`: the frozen contract
- `state.md`: decisions taken inside the brief
- `result.md`: the API, the read and write paths, the tests, the consumer sweep and the gate counts
