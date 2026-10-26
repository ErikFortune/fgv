# Result: `agent-memory-atomic-writes`

**Shipped:** `FileTreeMemoryStore` writes every record file atomically at the strongest guarantee its root offers, reports what it established on `store.durability`, refuses a second store on the same root until the first is disposed, and sweeps interrupted-write working files at open.

Origin: personaility#700 (fgv-ask). Base / PR target: `integration/asks`.

## What changed

### `@fgv/ts-json-base` (minor, additive)

- `IAtomicWriteCapabilities.reason?: string`. Populated by `FsFileTreeAccessors` (the qualification
  reason: `'ext2/ext3/ext4 on linux'`, or the platform / filesystem-type / mutability refusal), by
  `InMemoryTreeAccessors` (`'in-memory tree: …'`, or mutability disabled), and by
  `DirectoryItem` over non-atomic accessors. Before this, the reason was computed by
  `qualifyAtomicWrites` and only reachable by attempting a write.
- *(review round 1)* `DirectoryItem.getStorageIdentity()` (optional on `IFileTreeDirectoryItem`) →
  `IFileTreeStorageIdentity { accessors, path, realPath? }`; optional
  `IFileTreeAccessors.resolveRealPath(path)`, implemented by `FsFileTreeAccessors`
  (`fs.realpathSync`); exported `atomicWriteGuarantees` (ordered; `AtomicWriteGuarantee` is now
  derived from it — same type); `FsFileTreeAccessors` qualifies the **real path** of a directory, so
  a root or scope directory reached through a symbolic link is qualified as its target instead of
  failing `lstat` as "not a directory".
- The stale comments in `DirectoryItem.writeChildAtomically` corrected (brief's `directoryItem.ts:179`
  "once F2 makes that accessor atomic-capable", plus the neighbouring "the filesystem one is not yet
  atomic-capable"; the filesystem accessor is atomic-capable and only confines a write when it has
  a root prefix).

### `@fgv/ts-agent-memory` (minor, `BREAKING:`)

- **Atomic writes.** `writeRecordFile` (`storeFileAccess.ts`) writes through
  `writeChildAtomically` at the store's guarantee whenever it has one; otherwise it writes plainly
  (the old path, now `writePlain`). Every rewrite (flat put, versioned new version,
  `_invalidateVersion`, reconcile restamp) still funnels through `_persist` → `writeRecordFile`.
- **Durability report.** `store.durability: IMemoryStoreDurability` — `{ atomic, guarantee?, reason,
removedTemporaries }`, computed once at `create`, strongest listed guarantee. Not in `coverage()`.
- **Non-qualified roots.** Default degrades and reports (`atomic: false` + reason). Opt-in
  `create({ durability: { require: 'session' | 'process-crash' } })` refuses, before the root is
  claimed; an unrecognized requirement is refused by converter. A write that later cannot honour the
  guarantee fails — a scope directory that is not atomic-capable, or one whose `writeChildAtomically`
  refuses at validate — with no plain-write fallback.
- **Uncertain visibility.** `'replaced'` → committed: success, `warn`, index patched. `'unknown'`
  and an unclassified failure (no detail) → re-read: contents equal → committed (success + `warn`);
  contents differ or file absent → failure "a re-read shows the write did not take effect", index
  untouched; re-read itself fails → failure whose message says the file may hold either record and
  the index keeps the previous one until reopened. `'unchanged'` → failure.
- **Single-writer guard** (`rootOwnership.ts`, as revised in review round 1). A root is claimed by
  its storage identity: `(accessors instance, path)`, plus its `realPath` for a filesystem root; an
  item that cannot name its storage is claimed by the item itself. Two claims conflict when they
  share accessors and their paths **overlap** (equal, or one beneath the other), or when both carry
  real paths that overlap. **Guarantee: the guard detects the same accessor instance, or the same
  real filesystem directory** — two `getDirectory('/')` calls on one tree, two `FsTree` instances over
  one directory, a final or intermediate symlink alias, macOS `/tmp` vs `/private/tmp`. **Not
  detectable:** two separate accessor objects over one non-filesystem backing store (two
  `localStorage` accessors on one key) — they carry no real path. **Nested roots are refused**
  (ancestor/descendant overlap), unlike ts-agent-tasks, which checks equality only: a store's open
  walk reads every directory beneath its root, so an outer and an inner store would both index and
  write the inner records. `dispose()` (new, idempotent; also optional on `IMemoryStore`) releases;
  a failed **or throwing** open releases. A disposed store refuses at the write lock (`_enqueue`, so
  put / delete / reconcile, queued ones included), before every vector `add` / `addFragments`, and in
  `writeRecordFile` / `deleteRecordFile`; it still reads, possibly stale once a new owner writes.
- **Temporary sweep** (revised in round 1). At open, after the claim and before the walk,
  `sweepAtomicTemporaries` calls `cleanupAtomicTemporaries` on each **scope directory** — a
  directory beneath the root that holds a record file, i.e. the directories the walk reads records
  from. The root, intermediate directories, and a scope directory whose only content is an
  interrupted first write are not swept (the last is swept by a later open). Removed paths — including
  the ones a sweep that then failed did remove, found by re-listing — go on
  `durability.removedTemporaries` and are logged at `info`; failures (and a throwing sweep) log
  `warn` and do not fail the open. A foreign store rooted beneath this one is out of scope: it is
  refused in-process by the overlap rule, and across processes it is the host's single-writer
  violation.
- **Capability inquiry** (as settled in round 2). Only a successful answer that says "unqualified"
  degrades (`atomic: false`, reason). An inquiry that fails or throws fails the open: the inquiry is
  also where a root is checked against its accessors' confinement, and degrading on that refusal
  wrote plainly outside the tree (round 1 briefly degraded; reversed). A root that cannot be listed
  fails the open with `memory store: cannot list root …`.
- **Real-path confinement** (round 2, ts-json-base). The atomic methods require the containing
  directory's real path to lie under the root's real path, so a scope directory that links outside
  the tree is refused; one linking elsewhere inside it is accepted. The plain mutators are unchanged
  and do not confine; see `docs/TECH_DEBT.md`.
- **Layout.** New modules `openReport.ts` (public types; `MemoryRecordErrorMode` and
  `ISkippedRecord` moved here from `fileTreeMemoryStore.ts`, unchanged, same barrel), `storeRootSession.ts`
  (internal: inquiry, requirement, claim, sweep, writer), `rootOwnership.ts`. `fileTreeMemoryStore.ts`
  is **1988** lines (cap 2000).
- **Consumers fixed** for the guard: 28 reopen sites across 9 test files and
  `perf/residentMemory.js` now dispose the first store. `samples/testbed` opens once (no change).

## The ask was wrong about one thing

The ask spoke of on-disk index files that could tear. **There are none**: `MemoryIndex` is resident
and is rebuilt from the record files at every open. The only files the store writes are record
files, at the two sites the brief named.

## Red-then-green evidence

- **ts-json-base** — base sources restored, new assertions kept: `atomicWrite.test` 28 passed /
  3 failed, `fsAtomicWrite.test` 41 passed / 3 failed (6 red: every `reason` assertion). Green after.
- **ts-agent-memory** — base sources of both packages restored, `durability.test.ts` run with
  `@ts-nocheck` and `dispose?.()` so it compiles against the old API: **25 failed, 6 passed**. The
  centrepiece, _"a write interrupted before its replacement leaves the previous record whole"_, fails
  on base because the file is left holding `---\nid:` — the torn record of the ask. Of the 6 that
  passed on base, 3 were then strengthened so they discriminate (a `durability` assertion on two, a
  `warn`-logged assertion on the fs `'replaced'` test); those 3 were not re-run against base, but each
  now asserts something base does not have. The remaining 3 are guard non-regressions that are green
  on base by nature: two in-memory trees at `/` both open; a failed open releases its claim (base has
  no claim); fs `require: 'process-crash'` opens (base ignores the option).
- Green: ts-agent-memory **1002 passed, 0 failed, 100% coverage**; lint clean.

## Check-then-act windows

| window                                                                     | what is checked                                                    | what can change between check and act                                             | what re-checks after                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| open: inquiry → requirement → claim | `getAtomicWriteCapabilities()` (a failure or throw fails the open; only an unqualified answer degrades); root listing; requirement rank; storage identity (`getStorageIdentity`, real path resolved at claim time) | another store could claim an overlapping root between inquiry and claim; a symlink could be retargeted after the real path is resolved | `acquireStoreRoot` is the synchronous check-and-set over every held claim, by overlap; nothing awaits between inquiry and claim. A retargeted link is outside the guard's claim (it identified the directory at claim time) |
| open: claim → sweep → walk | claim held | nothing in-process; out-of-process writers are out of the fault model | the sweep runs only under the claim and cannot throw out of it (captured); the walk, constructor and index rebuild run inside `captureResult`, and any failure or throw releases the claim |
| open: guarantee chosen once → every later write                            | guarantee fixed in the session                                     | the scope directory may sit on another mount, or the root may have been remounted | `writeChildAtomically` re-qualifies the containing directory on every fs write and refuses at validate; the store fails on that refusal and never retries plainly                                                                                                                                                                                                                                                  |
| write → visibility settle → index patch                                    | `writeChildAtomically` outcome                                     | on `'unknown'`, the file may or may not hold the new record                       | the re-read is the re-check; the index is patched (`_persist` `.onSuccess`) only when the result is success, i.e. only when the file holds the new record. The one window left open: re-read fails → reported failure, index keeps previous envelope, disk may hold the new record; the message says so and a reopen settles it. Reads materialize bodies from disk, so a read in that window returns the new body |
| lock entry → embed → vector add → file write → evictions | `checkWritable` when the queued task starts (`_enqueue`), again immediately before every `add` / `addFragments`, again in `writeRecordFile` / `deleteRecordFile` | `dispose()` during the embedder's `await`, or between the file write and the evictions (`await pruneStaleVector`) | each check is synchronous with the act it guards: nothing awaits between the pre-add check and `add`'s call, nor between the file-access check and the file operation. A put whose file write landed before `dispose()` completes; its skipped evictions warn naming the dispose, and the next owner's admission restores the cap |
| cap-cull admission (write + N deletes), versioned put (write + invalidate) | per file                                                           | a crash between files                                                             | not atomic by design; per-file atomicity + highest-`seq` current selection + re-cull at next admission (documented in README / CAPABILITIES)                                                                                                                                                                                                                                                                       |

## Decisions inside the brief's latitude

- Guard identity: superseded in review round 1 by the coordinator's decision (storage identity +
  real path, overlap refused). The first version keyed on the item always and on the absolute path
  for non-session roots, which let two `getDirectory('/')` items of one tree both open, refused two
  unrelated non-atomic backends at `/`, and missed intermediate symlinks.
- Sweep failure warns rather than failing the open.
- `durability.removedTemporaries` carries the sweep report (brief offered report or logger; both).
- A disposed store refuses writes, so a disposed instance cannot be a second writer behind a new
  owner — the property #701's compare-and-set relies on.

## Review round 1 (adversarial ref-only review of 5fed4dcb3)

Every regression test below was run against the 5fed4dcb3 sources of both packages, with the new
tests kept and `@ts-nocheck` added so they compile against the old API. Result: **ts-json-base, all 8
new tests red; ts-agent-memory `durability.test`, 26 red** (every new test except the
`IMemoryStore.dispose` one, plus existing tests whose messages or cascades changed). The probe
scripts in the review's `aw/` directory were re-run after rebuilding; results are in the last column.

| finding | fix | regression test(s) | red on 5fed4dcb3 | probe after |
|---|---|---|---|---|
| P1-1 two `getDirectory('/')` on one tree, and parent/child roots, both open | claim by storage identity; refuse overlap within an accessor and across real paths | _two items for one directory of one tree are the same root_; _a root nested inside another root of the same tree is refused_; fs _a root nested inside an open root is refused_ (_a sibling directory … is a different root_ pins the overlap rule's prefix edge) | yes (opened) | inmem2: second open refused; guard3 nested: refused |
| P2-3 two non-atomic backends at `/` refuse each other | path is no longer a key on its own | _two different backends without atomic writes, both rooted at /, are different roots_ | yes (refused) | nonatomic: B ok |
| P2-4 intermediate symlink → two `process-crash` writers | real path in the claim | fs _a directory reached through an intermediate symbolic link is the same root_ | yes (opened) | symlink2: B refused |
| P1-2 final-component symlink root fails to open | ts-json-base qualifies the real path; an inquiry failure degrades unless `require` | ts-json-base _a directory reached through a symbolic link is qualified as its target_; fs _a root whose last component is a symbolic link opens …_; fs _a scope directory that is a symbolic link is written through_; _degrades when the root cannot answer the inquiry, and a requirement refuses it_; _degrades when the inquiry throws_ | yes | symlink: opens; symlinked-scope put ok |
| P2-1 a thrown open leaks the claim | post-claim open in `captureResult`; sweep and inquiry captured | _an open that throws releases its claim_ (throwing body converter); _an injected index that throws during the open releases the claim_ | yes (threw, then refused) | leak: both reopens ok |
| P2-2 disposed store still embeds and adds vectors | `checkWritable` in `_enqueue` (entry of `_putLocked` / `_deleteLocked` / `_reconcileLocked`) and immediately before every `add` / `addFragments` | _a put whose embedding finishes after dispose adds no vector, and a queued put never embeds_; _… fragment embedding … adds no fragments_; _a reconcile is refused once disposed, and one in flight adds nothing after it_ | yes (2 vectors) | disposeRace: 1 embed, 0 vectors |
| P3-1 sweep failure loses partial removals | the report never fails; partial removals found by re-listing | _a sweep that fails partway reports what it did remove_; _a sweep that throws is reported …_; _a directory the sweep cannot list is reported_ | yes | — |
| P3-2 sweep reaches every directory | only scope directories (holding a record) | fs _the sweep removes working files only from directories that hold records_ | yes (root's temp removed) | — |
| P3-3 lone surrogate never compares equal on re-read | compare the UTF-8 round-trips of both | fs _an ambiguous rename of a body with a lone surrogate is settled as committed_ | yes | — |
| P3-4 README drift | rewritten ("either way", the degrade wording, guard, sweep) | docs | — | — |
| P3-5 requirement values declared twice; private guarantee rank | `memoryDurabilityRequirements` `as const` → `StringOneOf` type and the converter; `FileTree.atomicWriteGuarantees` exported and used | _declares the requirements once, weakest first_; ts-json-base _atomicWriteGuarantees lists every guarantee_ | yes | — |
| P3-6 a host holding `IMemoryStore` cannot dispose | optional `dispose?(): void` on `IMemoryStore`; stale-read caveat documented | _a host holding the interface can dispose_ | compile-only (the runtime method already existed) | — |
| P3-7 an eviction skipped after dispose is blamed on a transient cap | the warning names the dispose | _a cull skipped because the store was disposed says so_ | yes | — |

Also checked: no other package defines `getStorageIdentity`, `resolveRealPath` or
`atomicWriteGuarantees`. ts-agent-tasks is the other consumer of filesystem qualification, which now
accepts symlinked directories; it passes **2407 / 0**. Outside scope: ts-agent-tasks'
`rootOwnership.ts` still keys on `absolutePath`, so it has the P1-1 / P2-4 shape too.

About the prefixed-tree probe (_guard3_, "prefixed tree root '/'"): `forFilesystem(prefix).getDirectory('/')`
resolves to the filesystem root `/`, outside the prefix. Its capability inquiry fails, so it now
degrades, as P1-2 requires, and the open walks `/`. 5fed4dcb3 refused it only because the inquiry
failure happened to be fatal. This is a ts-json-base path-resolution quirk, not a store decision.
_(Round 2 reversed degrade-on-failure, so this case is refused again; see below.)_

## Review round 2 (against cc9e1dc43)

The reviewer confirmed all nine round-1 findings fixed. This round's red run used the same method:
the cc9e1dc43 sources of both packages, with the new tests kept and `@ts-nocheck` added. Result:
**ts-json-base, 2 red** (the new escape test, on both test roots); **ts-agent-memory, 9 red**. The
tests marked "non-regression" below pass on cc9e1dc43 by design: they pin behaviour that the fix
must keep.

| finding | fix | regression test(s) | red on cc9e1dc43 |
|---|---|---|---|
| P1-A an inquiry failure (outside the prefix, not found, throw) degraded to plain writes outside the tree | `inquire` returns a `Result`; a failure or throw fails the open with `memory store: cannot ask root …`; only a successful unqualified answer degrades | _refuses the open when the root cannot answer the inquiry_; _…when the inquiry throws_; fs _a root outside its accessors' tree is refused, not degraded to plain writes there_ (with and without `require`); fs _a root that does not exist is refused, with context_; _reports a capability answer that gives no reason_ (an unqualified answer still degrades; non-regression) | yes (5 of them) |
| P2-A atomic writes followed a scope directory linking outside the root | ts-json-base `_confineToRoot` also requires `realpath(containing directory)` to lie under `realpath(prefix)`, for the inquiry, the write and the cleanup | ts-json-base _a directory inside the root that links outside it is refused, by inquiry, write and cleanup alike_; fs memory _a scope directory that links outside the root refuses the write_; non-regression: ts-json-base _…links elsewhere inside it is accepted_, memory _a scope directory that is a symbolic link is written through_ (now links inside the vault) | yes |
| P2-B no repo-wide gate on the final head | fresh `rush rebuild` and `rush test` on this head (see Gates) | — | — |
| P3 `\` treated as a separator on POSIX | separator taken from the path: `\` only for a path with no `/` | fs _a sibling whose name contains a backslash is not nested on POSIX_; _Windows-style paths nest by backslash, and a name that merely shares a prefix does not_ (non-regression) | yes / no |
| P3 case-insensitive filesystems | `resolveRealPath` uses `fs.realpathSync.native`; the remaining gap (case variants the OS does not canonicalize) is documented in the guard remarks, README and CAPABILITIES | — (Linux CI cannot exercise it) | — |
| P3 the real path is claim-time | one sentence in the guard remarks; README and CAPABILITIES too | — | — |
| P3 a missing-root open lacked context | the open lists the root first: `memory store: cannot list root …`; a missing filesystem root fails earlier at the inquiry, also prefixed | _refuses the open, with context, when the root cannot be listed_; fs _a root that does not exist is refused, with context_ | yes |
| P3 vector removals ran after dispose | `checkWritable` immediately before `remove` in the record lane, the fragment lane and `pruneStaleVector` (so `removeAll` and `removeEvictedVectors` too) | _a delete that is disposed partway removes none of the next owner's derived state_ | yes |
| P3 a throwing `getStorageIdentity` escaped `create` | captured: `memory store: cannot identify root …` | _refuses the open when the root cannot say what storage it names_ | yes |
| TECH_DEBT | new P2 entry: `resolveAbsolutePath` ignores the prefix for absolute paths; the plain mutators never confine; the prefix doc says "all paths". Options (a)–(d) are listed and the choice is left to the user | — | — |

Not changed, as instructed: `forFilesystem(prefix).getDirectory('/')` resolution and plain-write
confinement. That probe case is now refused at the inquiry ("resolves outside the tree root"),
instead of degrading and walking `/`.

## Gates

All logs under the worktree's `.gate-logs/`, graded by grep, not exit code.

- **Round 2, final code (5a4aa8018):** package gates: `ts-json-base` test **1604 / 0**, lint clean;
  `ts-agent-memory` build, lint clean, test **1032 / 0**, 100% coverage on both. Repo-wide
  `rush rebuild`: `SUCCESS: 39 operations`, 39 completed, 0 error matches, only the symlink
  warning. Repo-wide `rush test`: 34 succeeded (ts-json-base, ts-agent-memory, ts-agent-tasks among
  them), 1 no-op, 2 failed and 2 blocked behind one of them. Both failures were 5000 ms jest
  timeouts on a loaded machine: `@fgv/ts-res-cli` *cli-configuration*, which is on the known list, and
  `@fgv/ts-extras-mcp` *"a slow tool on a JSON-response server outlives the guarded fetch's headers
  deadline"*, a timing test in the same package as the known mcp ones, though that test is not itself
  listed. Neither package uses the changed surfaces. Re-run alone: ts-extras-mcp **279 / 0**,
  ts-res-cli **67 / 0**. The blocked packages: ts-extras-re2 **178 / 0**; testbed green (639
  passed in its last suite summary; it prints pre-existing React `act(...)` console noise, not
  warnings in the gate sense).

- Round 1 (after the fix commit): `ts-agent-memory` build, lint clean; test **1024 / 0**, 100%
  coverage. `ts-json-base` build, lint clean; test **1600 / 0**, 100% coverage. `ts-agent-tasks` test
  **2407 / 0**. The repo-wide runs below predate round 1.
- `ts-agent-memory`: build, lint clean; test 1002 passed / 0 failed, 100% coverage, no warnings.
- `ts-json-base`: build clean (api.md gains `reason?`); atomic suites 75 passed.
- `rush rebuild`: `SUCCESS: 39 operations`, 0 error matches, only the Git-tracked symlink warning.
- `rush test`: 37 succeeded, 1 no-op, 1 failure — `@fgv/ts-res-cli` _cli-configuration_ "test
  consistent output by building same input twice", a 5000 ms timeout at load average ~24 (other
  workers running). That is one of the known load-sensitive tests; ts-res-cli does not use the
  atomic surface. Re-run alone: failed the same timeout once, then **67 passed / 0 failed** on the
  second run.
- `rush change --verify --target-branch origin/integration/asks`: passes (both change files found).
- prettier 2.8.8 (the `rush-prettier` autoinstaller) on every touched file.
- `fileTreeMemoryStore.ts`: 1988 lines after round 1 (cap 2000).
- Capability feed regenerated; `--check` 0 stale; `verify-capability-docs` 0 failed.
