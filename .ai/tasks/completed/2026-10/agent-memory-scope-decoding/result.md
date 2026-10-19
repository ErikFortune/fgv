# Result: `agent-memory-scope-decoding`

**Shipped:** `FileTreeMemoryStore.create` takes `scopeDecoding`, the inverse of `scopeEncoding`, so a vault written under a non-identity scope encoding reopens with every record reachable by the scope it was written to.

Base `integration/asks` at `84fc3cef4`. Implementation commit `2e06e8bc5`. PR #747.

## API

```ts
readonly scopeEncoding?: (scope: MemoryScopeKey) => Result<string>;     // unchanged
readonly scopeDecoding?: (encoded: string) => Result<MemoryScopeKey>;   // new
```

- **Pairing.** `scopeEncoding` without `scopeDecoding` fails `create` with
  `memory store: scopeEncoding requires scopeDecoding, …`. A `scopeDecoding` supplied alone pairs
  with `defaultMemoryScopeEncoding`. With neither, the layout is the identity and the store behaves
  exactly as before.
- **Contract (TSDoc).** The pair must be a bijection on the scopes the vault uses: `decode(encode(s))`
  is `s`, and `encode(decode(d))` is `d`.
- **`ISkippedRecord`.** `scope` is now optional. It is absent when the record's directory does not
  decode. `path` is the on-disk path. Both are unchanged in the identity case. This is a type change
  on a `ts-agent-memory` public interface. The package is on the active surface, so the change file
  is `minor` with `BREAKING:`.

## Where decoding runs

All in `storeFileAccess.ts`, through one `IScopeCoding { encode; decode? }` that the store holds in
place of the bare encoder:

- **`decodeScopeDir(scopes, dir)`.** Decodes the directory, requires the result to pass
  `Convert.scopeKey`, and requires it to re-encode to exactly `dir`. Identity case: the raw path, as
  before.
- **`encodeScope(scopes, scope)`.** Encodes the scope and requires the directory to decode back to
  that scope. Identity case: the bare encoding.

Read and write paths:

- **Open walk** (`_collectEntries` → `_loadRecordFile`). Each directory that holds a `.md` file is
  decoded once, through `decodeScopeDir`. The scope invariant (`verifyLoadedIdentity`) is checked
  against the decoded scope. A failure fails the open. Under `'skip'` it quarantines each record in
  that directory, with `scope` absent.
- **Every address-first read and every write.** `resolveScopeDir` and `ensureScopeDir` go through
  `encodeScope`. That covers:
  - `_readRecord`, used by `get`, `getById`, `resolveRecord`, materialization, and the read before
    every flat write;
  - `_rewriteEnvelope`, used by `reconcile` for rank and the vector `stampRef`;
  - `writeRecordFile`, used by every persist, versioned writes included;
  - `deleteRecordFile`, used by delete and eviction.

  A scope that does not round-trip therefore fails the read or the write. The write case matters:
  without it, a write would create a directory the next open refuses.

## Tests

`src/test/unit/store/scopeDecoding.test.ts` has 19 tests:

- **Reopen.** A per-segment prefix pair (`s-conversations/s-c1`) and a whole-scope percent-encoding
  (`conversations%2Fc1`) both reopen. `get`, `getById`, `resolveRecord`, `list` and `listScoped`
  return every record. The tests also check the on-disk directory names.
- **Reopened store.** Update and delete work in place on the reopened store. `reconcile(kind, 'rank')`
  rewrites both MTM records under their encoded directories.
- **Pairing at create.** An encoding without a decoding is refused. A decoding alone pairs with the
  default encoding, and a directory the default encoding refuses (`bad:seg`) fails the open.
- **Identity default.** It is unchanged. The existing suite also covers it.
- **Non-round-tripping pairs.** Three kinds: a decoding that does not invert, a directory the
  decoding rejects, and a decoded scope that `Convert.scopeKey` rejects. Each is refused in `'fail'`
  mode and quarantined with `scope` absent in `'skip'` mode. The check is per directory: in skip
  mode, a valid sibling still loads.
- **Reads and writes.** A pair where two scopes share one directory fails `getById` on the aliased
  scope, and fails a `put` while leaving no file.
- **Scope invariant through the decoding.** A scope-blind codec makes the store's check the only
  one. The test file sits under a directory that decodes to a foreign scope, and that file is refused
  in fail mode. In skip mode it is quarantined under its decoded scope. A well-placed record still
  loads.

`fileTreeMemoryStore.test.ts` "uses a custom scope encoding" now supplies `scopeDecoding`.

## Consumer sweep

Searched for `scopeEncoding|scopeDecoding|skippedRecords|ISkippedRecord` across `libraries/`, `tools/`
and `samples/`, excluding `lib/`:

| hit | classification | action |
|---|---|---|
| `ts-agent-memory/src/test/unit/store/fileTreeMemoryStore.test.ts:208` | the only caller of `FileTreeMemoryStore.create` with `scopeEncoding` | added `scopeDecoding` |
| `ts-agent-memory/src/test/unit/store/{lenientOpen,scopeInvariant}.test.ts` | read `ISkippedRecord.scope` / `.path` | unchanged; identity case, assertions still hold |
| `ts-prompt-assist` `FileTreePromptStore` / `promptStoreFixture` | a separate store with its own `scopeEncoding`, already paired with `scopeDecoding` | none; it is the precedent this signature mirrors |
| `samples/`, `tools/` | no hits | — |

## Gates

Each gate was run from the repo root with per-worktree logs, and graded by grep.

- **Package.** `rushx build`, `lint` and `fixlint` are clean, and `test` passes at 100% on all four
  metrics.
- **`api.md`.** It gains `scopeDecoding?` and `scope?` and nothing else. No `ae-*` warnings.
- **Prettier.** 2.8.8, from the `rush-prettier` autoinstaller.
- **`rush rebuild`.** 38 completed. 0 on `not met|FAILURE|Operations failed|error TS`. The only
  warning is the symlink notice. No NUL padding.
- **`rush test`.** No failure traces to this change. The run took three passes, because three
  sibling workers were loading the machine:
  - **Full runs, twice.** 17 projects completed each time. The only failure was the known
    load-sensitive `ts-extras` `md5Normalizer.browser` "large objects" timing test (691 ms against a
    300 ms bound), and it blocked everything downstream. Re-run alone, `ts-extras` passed at 100%.
  - **`--impacted-by-except @fgv/ts-extras`.** 18 of 19 completed, including `ts-agent-memory` and
    `ts-agent-memory-sqlite-vec`. `ts-res-cli` hit four 5 s Jest timeouts. That package does not
    depend on `ts-agent-memory`, and re-run alone it passed.
  - **Every log:** 0 `not met` or `error TS`, the symlink notice as the only warning, and no NUL
    padding.
- **Verifiers.** `verify-capability-docs`: 0 failed. `rush change --verify --target-branch
  origin/release`: exit 0. The capability feed was regenerated, and `--check` is clean.

## Where the brief was refined

- **Which directories are checked.** The brief says *"every walked directory must satisfy
  `encode(decode(dir)) === dir`"*. Implemented as every walked directory **that holds a record
  file**. An intermediate directory of an encoded layout need not be a scope. Under the per-segment
  prefix, `s-conversations` holds only subdirectories, and decoding it would refuse a correct vault.
- **Reads and writes.** The brief names reads only. The round-trip check also runs on writes, for
  the reason given above.
- **`ISkippedRecord.scope` had to become optional**, which the brief did not anticipate. A
  directory that does not decode has no validated scope to report.
- **Decoding alone is accepted.** The brief is silent on this case.

## Review round 1

The deep review found no P1s. Everything below is applied in `32852d0ef`, after merging
`origin/integration/asks` (#743) in `1c7d73fdb`.

- **P2: a throwing host coder escaped.** `decodeScopeDir` and `encodeScope` now call both coders
  through `captureResult`. A throw is a failure (`scopeDecoding threw: …`). At open it fails the
  open, or is quarantined under `'skip'`. On a read or a write it fails that operation. Tests cover
  a throw at open in both modes, at read, and at write, for both the decoding and the encoding.
- **P2: write check vs path normalization.** `encodeScope` now refuses an encoded path that is not
  canonical: empty, or with an empty, `.` or `..` segment. Without this, directory resolution drops
  empty segments, so `/s-a` or `a//b` would be written under a path the walk recovers differently,
  and `''` would land at the root, where the walk ignores record files. Tests cover `''`, a leading
  slash, a double slash, `..` and `.`. Each is refused on write, and nothing is written. The identity
  case is untouched: the default encoding already refuses empty segments.
- **P2: ledger counts.** Recomputed from the entries after the merge. The archive has 37 `###`
  entries and the index has 37 ids, and both counters now read 37. The feed was regenerated.
- **P3: versioned kind and nested scopes.** A `TemporalIdentityCodec` kind under the prefix encoding
  reopens: `get` returns the current version, and `list` returns both versions. A parent scope `a`
  and its child `a/b` (`s-a/` holds records and `s-a/s-b/`) reopen as separate scopes.

TSDoc, `CAPABILITIES.md` and the change file now state the canonical-path rule and that a throw is
a failure. `scopeDecoding.test.ts` has 29 tests, and the package is at 100%.

**Gates (round 1).**
- **Package.** Build, lint and fixlint are clean, and test is at 100%.
- **`rush rebuild`.** 38 completed. 0 errors. The only warning is the symlink notice. No NUL
  padding.
- **`rush test`.** 36 projects completed, including `ts-agent-memory`, and one defines no work.
  `ts-res-cli` failed once on its load-sensitive "build same input twice" test, and passed when
  re-run alone.
- **Verifiers.** `change --verify`: exit 0. `verify-capability-docs`: 0 failed. Feed `--check`: 0
  stale.
