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
- **Single-writer guard** (`rootOwnership.ts`). A root is held by its directory item always, and by
  its absolute path unless it is session-only (strongest guarantee exactly `'session'` — the
  in-memory tree). Non-atomic roots are path-held. `dispose()` (new, idempotent) releases; a failed
  open releases; a disposed store reads but refuses writes and deletes (`checkWritable` on every
  `writeRecordFile` / `deleteRecordFile`).
- **Temporary sweep.** At open, after the claim and before the walk, `sweepAtomicTemporaries` calls
  `cleanupAtomicTemporaries` on every directory under the root; removed paths go on
  `durability.removedTemporaries` and are logged at `info`. A sweep failure logs `warn` and does not
  fail the open (a working file is not a `.md` file, so it can never be read as a record).
- **Layout.** New modules `openReport.ts` (public types; `MemoryRecordErrorMode` and
  `ISkippedRecord` moved here from `fileTreeMemoryStore.ts`, unchanged, same barrel), `storeRootSession.ts`
  (internal: inquiry, requirement, claim, sweep, writer), `rootOwnership.ts`. `fileTreeMemoryStore.ts`
  is **1979** lines (cap 2000).
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
  centrepiece, *"a write interrupted before its replacement leaves the previous record whole"*, fails
  on base because the file is left holding `---\nid:` — the torn record of the ask. Of the 6 that
  passed on base, 3 were then strengthened so they discriminate (a `durability` assertion on two, a
  `warn`-logged assertion on the fs `'replaced'` test); those 3 were not re-run against base, but each
  now asserts something base does not have. The remaining 3 are guard non-regressions that are green
  on base by nature: two in-memory trees at `/` both open; a failed open releases its claim (base has
  no claim); fs `require: 'process-crash'` opens (base ignores the option).
- Green: ts-agent-memory **1002 passed, 0 failed, 100% coverage**; lint clean.

## Check-then-act windows

| window | what is checked | what can change between check and act | what re-checks after |
|---|---|---|---|
| open: inquiry → requirement → claim | `getAtomicWriteCapabilities()` on the root; requirement rank | another store could claim the root between inquiry and claim | `acquireStoreRoot` is the synchronous check-and-set itself; nothing awaits between it and the inquiry, so no other store can interleave in-process |
| open: claim → sweep → walk | claim held | nothing in-process (guard); out-of-process writers are out of the fault model | the sweep runs only under the claim; the walk follows synchronously. A failed walk releases the claim |
| open: guarantee chosen once → every later write | guarantee fixed in the session | the scope directory may sit on another mount, or the root may have been remounted | `writeChildAtomically` re-qualifies the containing directory on every fs write and refuses at validate; the store fails on that refusal and never retries plainly |
| write → visibility settle → index patch | `writeChildAtomically` outcome | on `'unknown'`, the file may or may not hold the new record | the re-read is the re-check; the index is patched (`_persist` `.onSuccess`) only when the result is success, i.e. only when the file holds the new record. The one window left open: re-read fails → reported failure, index keeps previous envelope, disk may hold the new record; the message says so and a reopen settles it. Reads materialize bodies from disk, so a read in that window returns the new body |
| write/delete → disposed? | `checkWritable` at entry of `writeRecordFile` / `deleteRecordFile` | `dispose()` during an in-flight put's `await` | `checkWritable` runs synchronously immediately before the file operation, after every `await` in the put path (the write funnel is synchronous from `_persist` on). A put whose file write already happened before `dispose()` completes normally |
| cap-cull admission (write + N deletes), versioned put (write + invalidate) | per file | a crash between files | not atomic by design; per-file atomicity + highest-`seq` current selection + re-cull at next admission (documented in README / CAPABILITIES) |

## Decisions inside the brief's latitude

- Path-keying: non-session roots only (see table). An earlier draft also made session and path
  holders refuse each other at the same path, as ts-agent-tasks does; dropped, because an in-memory
  tree is never the same root as a path-held one and the cross-check would refuse e.g. a browser
  app's in-memory scratch store at `/` while a non-atomic store at `/` is open.
- Sweep failure warns rather than failing the open.
- `durability.removedTemporaries` carries the sweep report (brief offered report or logger; both).
- A disposed store refuses writes, so a disposed instance cannot be a second writer behind a new
  owner — the property #701's compare-and-set relies on.

## Gates

Recorded in the final report and `state.md`.
