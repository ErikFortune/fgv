# Result — `filetree-atomic-write`

**Shipped: an optional atomic-write capability on `FileTree`, and a Node implementation whose
durability claim is decided per root by positive identification rather than assumed from a
platform string.** F1 declared the contracts and a session-guarantee in-memory implementation;
F2 implemented the Node temp/flush/rename/directory-flush protocol, qualified it, and reconciled
the failure vocabulary against the protocol that now exists. The pair lands as one squash to
`release`.

## What a consumer gets

`isAtomicAccessors` / `isAtomicDirectoryItem` narrow to the capability;
`getAtomicWriteCapabilities` says what a write would actually achieve;
`writeFileAtomically` / `writeChildAtomically` commit; `cleanupAtomicTemporaries` reclaims the
working files an interrupted write leaves behind. A directory item performs an atomic child write
with no native path and no accessor internals in sight.

Four questions this surface keeps separate, having historically conflated them: **method
presence** (the guard), **writability** (`fileIsMutable`), **atomic visibility**
(`atomicReplace`), and **durability** (`guarantees`).

## The tested matrix — what is claimed, and on what evidence

Every row below was **run**. Nothing is listed because it is expected to work.

| platform | filesystem | magic | advertises | evidence |
|---|---|---|---|---|
| Linux (Node 22.22.2, x64) | ext4 | `0xef53` | `['session', 'process-crash']` | full suite + 11 subprocess tests, **10 of them crash-synchronized** (the 11th is the uninterrupted control) |
| Linux (Node 22.22.2, x64) | tmpfs (`/dev/shm`) | `0x1021994` | `['session', 'process-crash']` | full suite + the same 11 |
| Linux | procfs | `0x9fa0` | nothing; refuses | `refuses an atomic write on a filesystem the allowlist does not name`, which asserts the magic number as well as the refusal |
| any | in-memory | — | `['session']` | F1's suite, **extended** by F2 — the advertised guarantee is unchanged, but the implementation gained `cleanupAtomicTemporaries` and the suite grew |

**Unsupported, and why — each of these refuses rather than downgrading:**

| case | why |
|---|---|
| **macOS / darwin** | The protocol needs a *stable* identification of the filesystem under a path. Linux's `statfs` magic is exactly that. macOS reports a mount-table index rather than a stable magic, and Node exposes no equivalent of `f_fstypename`, so a darwin root **cannot be positively identified from inside this package**. |
| Windows | unqualified platform; no evidence gathered |
| xfs, btrfs, zfs, apfs | expected to be fine, **not run**. Unqualified means "no evidence", not "known broken". Adding one means running the qualification suite there. |
| overlayfs, NFS/SMB, FUSE, cloud-synced | rename and flush semantics differ from the local case |
| any root whose filesystem cannot be identified | "we could not tell" is recorded as unqualified, never as qualified |

**At the time this stream ran, this was a deviation from decision A1, which named macOS in the
intended matrix.** A1's text is *"Qualification is pending, not a claim that these tests ran"*, and
the acceptance criterion this stream was held to is *"no platform claimed without evidence actually
run on it"* — so the deviation was in the honest direction, but it was a real narrowing.

> **Resolved by amendment, 2026-09-22 — read this before treating darwin as an open gap.** A1 was
> amended from "Linux/macOS" to "Linux": darwin is **dropped from the intended matrix, not
> deferred**, and no darwin qualification slice is queued. The reference consumer develops on macOS
> but runs in containers, so `process.platform` is `'linux'` and `statfs` returns a real magic
> number — the darwin gap is never on the execution path. **The live question is the filesystem,
> not the platform:** `overlayfs` is deliberately absent from the allowlist, so a container root on
> the writable layer is *refused* while a named volume or Linux bind mount qualifies. See
> `docs/design/agent-tasks/implementation-plan.md` § *A1 amendment* for the mount table and the
> one-liner that reads a root's magic number.

## Which guarantee each test proves

| claim | what establishes it |
|---|---|
| a reader never observes a torn write | `atomicCrash.test.ts` — a child running the real protocol `SIGKILL`s **itself** at each of 7 boundaries; at every one the destination is byte-identical to the whole previous record or the whole new one |
| the rename is the visibility linearization point | the same suite, by the pair `before-rename` → previous record, `after-rename` → new record |
| the destination is never unlinked or truncated | `never unlinks or truncates the destination on the way to replacing it` — asserts on the *operations and the paths they were given*: every `openExclusive` went to a reserved temporary, and `rename` is the only operation that ever named the destination. Non-truncation is a claim about a path, so an operation-name log could not have made it |
| an interrupted write leaves a recognizable orphan, and reopen reclaims it | `the mid-write orphan really is partial` + `reopen reclaims the orphan and leaves the surviving record exactly as it was` |
| a failure before the rename leaves the old record authoritative | `atomicFileCommit.test.ts`, 8 injected boundaries, each asserting the *contents and permissions* afterwards |
| a failure after the rename cannot be mistaken for nonapplication | `a failed directory flush reports the replacement as visible, and it is` — asserts `visibility: 'replaced'` **and** that the destination really holds the new record |
| `'unchanged'` is only claimed on positive evidence | the errno classification table, incl. `ENOSPC is deliberately not treated as proof that nothing happened` and `a rename failure carrying no errno is unknown, not unchanged` |
| an unqualified root refuses rather than downgrades | `atomicRootQualification.test.ts` + the real-procfs test |
| nothing advertises `os-crash` / `power-loss` | `never advertises a guarantee stronger than process-crash`, and mutation M12 |
| the durability evidence is actually being gathered | `at least one discovered root is qualified, so the committing tests are not all skipped` |

**What no test here establishes.** That bytes reached the storage device. A process-kill leaves
the page cache intact, so flushed and unflushed data are **indistinguishable to every test in
this suite**. What *is* pinned is that the record is flushed once and the directory entry once,
in that order, **identified by descriptor** — structural evidence, not physical.

That descriptor detail was not a flourish. The first attempt at this assertion counted flushes,
and a mutation that flushes the *directory* twice and the record never passed it: same count,
same occurrence positions, so it survived both the count and every occurrence-indexed fault
injection. Only the descriptor tells the two apart. The flushes are performed because §8.2's acceptance
boundary requires them, and A1 already states that a directory flush does not prove power-loss
safety on a real storage stack. **No OS-crash or power-loss claim is derived from any of this.**

## Fault-injection results

Injection wraps the **real** filesystem, so everything preceding an injected failure actually
happened on disk and every assertion is about what a real reader would then see.

| boundary | injected | classification | destination afterwards |
|---|---|---|---|
| temp create | `ENOSPC` | `io` / `temporary-write` / `unchanged` | previous record, mode intact |
| write | `ENOSPC` | `io` / `temporary-write` / `unchanged` | previous record |
| write | returns 0 (no progress) | `io` / `temporary-write` / `unchanged` | previous record — loop terminates instead of spinning |
| write (2nd of a chunked write) | `EIO` | `io` / `temporary-write` / `unchanged` | previous record |
| `fchmod` | `EPERM` | `io` / `temporary-write` / `unchanged` | previous record |
| temp flush | `EIO` | `io` / `file-flush` / `unchanged` | previous record |
| temp close | `EIO` | `io` / `file-flush` / `unchanged` | previous record |
| rename | `EACCES` | `io` / `replace` / **`unchanged`** | previous record |
| rename | `EIO`, `ENOSPC`, `EDQUOT`, unknown, **absent** | `io` / `replace` / **`unknown`** | — caller must read the record back |
| directory flush | `EIO` | `io` / `directory-flush` / **`replaced`** | **new record** — and the test asserts the contents, not just the classification |
| directory close | `EIO` | `io` / `directory-flush` / `replaced` | new record |
| destination lstat | `ENOTDIR` | `io` / `validate` / `unchanged` | untouched |
| directory open | `EACCES` | `io` / `validate` / `unchanged` | untouched, nothing created |
| cleanup unlink | `EPERM` | **unchanged from the primary failure** | orphan named in the message, classification not replaced |

In every pre-rename row the orphan is removed and the destination's **permissions** are asserted
unchanged too, not just its contents.

## Watching every protection fail

A fault-injection suite that passes because the injection never fired looks identical to one that
works. Twelve protections were neutered one at a time, rebuilt, measured, restored.

M1 unlink-before-rename → 8 red · M2 no directory flush → 4 red · M3 always-`unchanged` → 7 red ·
M4 revert the guard fix → 2 red · M5 allowlist bypass → 2 red · M6 carry set-user-ID → 1 red ·
M7 temp create without `O_EXCL` → 3 red · M8 no short-write loop → 15 red · M9 no temp flush →
8 red · M10 no root confinement → 5 red · M11 follow a symlink → 3 red · M12 advertise
`os-crash`/`power-loss` → 11 red.

**Two findings came from the exercise rather than from the suite:**

1. **M2 and M9 did not compile on the first attempt.** They returned "nothing went red", which is
   indistinguishable from a verified protection if nobody looks. They were recorded as
   *unverified* and redone with mutations that build. Those two are the **flushes** — the
   durability-critical steps — so counting round one would have rested the least-verifiable
   claims on the weakest evidence in the set.
2. **M10 leaked `/tmp/escaped.json`**, which made M11 and M12 report a spurious extra failure.
   Tracing it back found a defect in the *test*: the confinement assertions reached for
   `path.dirname(root)` and so depended on a shared directory not containing a particular
   filename. The tree root now sits inside a container the test owns.

## The vocabulary decision

F1 declared four unions and exercised almost none of them. With the protocol implemented:

**`stage` loses `'cleanup'`** — 6 members → 5. It has no producer and cannot honestly acquire
one. Removing a working file happens *on the way out of* a failure, and the failure a caller must
act on is the one that caused it, so a cleanup problem is reported in the message and never
replaces the classification. A successful commit leaves nothing to clean up, because the
replacement consumes the working file. Reopen reclamation is a separate operation returning a
plain `Result`, not an `IAtomicWriteFailure`. The other five stages are all now produced.

**`visibility` keeps all three**, and F1's settled meaning is unchanged: *what a subsequent
reader can see at the destination path*. F2 produces the first genuine `'replaced'` (directory
flush, after the rename) and `'unknown'` (an ambiguous rename) in the stream.

**`code` keeps all three.** `'io'`, which F1 never produced, is now the classification for every
failure inside the protocol.

**`AtomicWriteGuarantee` keeps all four**, on a distinction worth stating because it is what
separates a dead union member from a live one:

> `guarantee` is an **input** vocabulary — what a caller may *ask for*. A member is witnessed by a
> **refusal** as much as by a receipt, and A1 requires `'os-crash'` and `'power-loss'` to be
> expressible precisely so they can be rejected. `stage` is an **output** vocabulary — what the
> implementation *reports*. A member with no producer there is dead.

So: 16 declared members, 11 unexercised at F1; 15 declared members, **0 unexercised** now.

## Reclamation, and the scope question it raises

**`cleanupAtomicTemporaries` was in scope, not beyond it.** The brief's F2 paragraph says
"Qualified-root inquiry; **reserved-temp cleanup on reopen**". An earlier draft of this document,
of `README.md`, of `meta.yaml` and of the ledger entry all described it as "added beyond the
brief"; that was wrong four times over and is corrected here. §8.2 step 6's failure half lives
inside the protocol; the reopen half needs a caller-reachable entry point, or a consumer would
have to know the reserved naming format — a dependency on an internal convention, which is what
reserving the namespace was meant to prevent.

**What *is* worth declaring is narrower, and it is a scope question the brief does raise.** The
brief lists as out-of-scope "any **required** member added to an existing base interface", and
`cleanupAtomicTemporaries` is a required member added to two interfaces that already existed on
the integration branch. The judgement made here: those are the **optional capability** interfaces
this very stream introduced in F1, not the base interfaces every accessor implements
(`IFileTreeAccessors`, `IMutableFileTreeAccessors`, …), which are untouched. The clause's stated
purpose — "The capability stays optional" — is preserved: no accessor is obliged to implement
anything it did not already, and the repo-wide rebuild confirms all six pre-existing accessors
across three packages still typecheck unchanged. Recorded rather than assumed, because the
alternative reading is available and nobody had engaged it.

## The defect the fault injection caught

`errnoOf` tested `error instanceof Error` before reading `.code`. Node's `fs` constructs errors in
its own realm, and `instanceof` tests the **calling** realm's `Error` — so in any `vm` context,
worker thread or test sandbox, an ordinary `ENOENT` reports as `'UNKNOWN'`. Consequence: **a
rename failure that was provably `unchanged` would have been classified `unknown`**, and a
missing destination would have read as an uninspectable one. 29 tests went red on it. It now
reads the properties directly, realm-independently, with no cast.

This is the native-boundary class the kickoff predicted layer 1 would under-cover, and it did:
the `code-reviewer` pass ran later and found a different real defect (below), not this one.

## Layer-1 review

`code-reviewer` returned **Requires Changes**.

- **P1 (fixed)** — `isAtomicAccessors` / `isAtomicDirectoryItem` were not widened when
  `cleanupAtomicTemporaries` joined the interfaces, so they narrowed an object to a type
  promising a method they never checked for. `DirectoryItem.cleanupAtomicTemporaries` trusts that
  narrowing, so a store with the old two-method shape produced an uncaught `TypeError` instead of
  a `Result`. Invisible to the compiler, because the guard's own assertion suppresses the check.
  Both guards fixed; a store with exactly the pre-F2 shape is now in the suite.
- **P2 (fixed)** — `CAPABILITIES.md` still said a Node implementation was a follow-on stream.
- **P2 (fixed)** — the change file claimed `'cleanup'` had been removed from `stage` when it had
  not. Resolved by actually removing it, which was the better of the two available fixes.
- **P2 (fixed)** — coverage closed to 100% on all four metrics, with tests. No `c8 ignore` added.
- **P3 (fixed)** — a `{@link}` to a private method baked an `ae-unresolved-link` warning into the
  checked-in `api.md`; the warning footer is gone.
- **P3 (fixed)** — the permission carry took the low twelve bits of `mode`, including set-user-ID
  and set-group-ID. It takes nine. The replacement is a new inode, and granting a privilege bit to
  content someone else just supplied is the one direction that cannot be walked back.
- **P3 (fixed)** — `getAtomicWriteCapabilities` did not confine its argument, so a tree with a
  prefix would answer for directories outside its root and then refuse to write there.
- **P3 (judged, kept)** — the reviewer was asked explicitly whether `commitFileAtomically`'s
  sequential early returns should be a `Result` chain, and concluded the early returns are
  warranted: each step needs a different combination of conditional resource cleanup and a
  distinct `stage`/`visibility`, so chaining would thread cleanup state through every step.

**Found while closing the reviewer's coverage finding, not by the reviewer:** a read-only or
filter-excluded tree reported `unsupported` on Node but `not-writable` in memory — the same
condition, two codes, one contract. Writability is now settled before capability. And a
pre-existing filter test was passing for the wrong reason: `IFilterSpec` string patterns are
substring matches, not globs, so `include: ['**']` matched nothing and every path failed the
*include* test rather than the exclude one. That assertion would have held with the exclude list
deleted. Both filter tests use `RegExp` now.

## Layer-2 review — the external loop, and where it stopped

**Stopped after 4 external rounds on diminishing returns, not the cap.** Five findings across
Copilot (3 rounds) and CodeRabbit (1 round). **All five were genuine; all five were fixed.** No
finding was dispositioned as wrong, which is worth stating plainly — this was not a loop spent
arguing.

| round | reviewer | finding | severity | outcome |
|---|---|---|---|---|
| 1 | Copilot | `qualifyAtomicWrites` reported every `lstat` failure as "not found", including `EACCES` / `EPERM` / `ENOTDIR` | medium | fixed; `ENOENT` keeps the diagnosis, everything else reports that the directory could not be inspected |
| 1 | Copilot | `atomicFileCommit` respelled `'UNKNOWN'` instead of importing `UNKNOWN_ERRNO` | low | fixed; the sentinel is load-bearing — a spelling that drifted would silently change a durability classification |
| 2 | Copilot | `fdCalls` documented as recording every descriptor-taking operation plus the open descriptors; it records `fsync` only | low | fixed by correcting the doc, not by widening the harness |
| 3 | Copilot | the qualification guard asserts a qualified root unconditionally, so it fails off Linux | medium | fixed |
| 4 | CodeRabbit | `test.each(qualified ? expectations : [])` **fails** a suite on an empty array; it does not skip | major | fixed |
| 4 | CodeRabbit | same qualification guard as Copilot round 3 | minor | same fix |

Two are worth keeping for the lesson rather than the fix.

**The empty-`each` finding was a real defect, not a style point**, and it was invisible here for a
structural reason: both roots on this machine qualify, so the conditional never took its empty
branch. It would have fired on the first macOS box or any runner whose `/tmp` the allowlist does
not name — precisely the machines this stream is about. Verified against the installed Jest
(``.each` called with an empty Array of table data``) rather than taken on trust, and the fix was
re-verified under a simulated unqualified machine by making `QUALIFIED_PLATFORMS` match nothing.

**One suggestion was declined in substance while the defect was accepted.** Both reviewers
proposed scoping the qualification guard with `test.skip` off Linux. That guard exists *because
silence looks like success* — it was written so that moving CI onto an unnamed filesystem turns
the suite red rather than degrading every crash test into a skip. Answering it with a skip would
reintroduce the silence it was built to prevent. Off Linux there is a correct expectation and it
is simply the opposite one, so the assertion became
`expect(roots.some(isQualified)).toBe(process.platform === 'linux')` — the test now runs
everywhere, and pins the refusal as well as the qualification. CodeRabbit re-read the commit and
agreed it is stronger than the skip it proposed.

**Why the stop is here.** The brief warned that a native-boundary package should expect a
substantive layer-2 loop on rounds 1–2 and that a clean layer-1 pass is not license to expect
nitpicks. That held exactly: rounds 1 and 4 carried the correctness findings. Rounds 2 and 3
produced one doc-accuracy item and a re-report of a finding already in hand — the finding profile
has gone from behavior to wording, which is the diminishing-returns signal the discipline names.
The final push is comment-only; commissioning another round against it would measure nothing.

## Gates

`rushx build` zero warnings · `rushx lint` clean · `rushx fixlint` run · `rushx test` 1177
passed, 0 failed · **100% statements, branches, functions and lines**, with **no `c8 ignore`
directives added** (and none removed) · `rush change --verify --target-branch origin/integration/filetree-atomic-write`
finds the change file · repo-wide `rush rebuild` **`SUCCESS: 36 operations`** and repo-wide
`rush test` **`SUCCESS: 35 operations`**, both clean at `--parallelism 1`.

**API Extractor diff — additive except for one deliberate removal, which needs stating plainly
because the brief's acceptance criterion says "Additive only".** The diff removes `'cleanup'`
from `IAtomicWriteFailure.stage` in the checked-in `etc/ts-json-base.api.md`. That is a narrowing
of a published-looking union, and the criterion exists because `ts-json-base` is a
stability-obligated surface. It is permitted here for one specific reason: **`'cleanup'` was
introduced by F1, F1 has not reached `release`, and the pair squashes as a single landing** — so
no version of `ts-json-base` has ever shipped with that member, and no consumer can have depended
on it. The integration branch exists precisely to make this revision cost a diff instead of a
migration. Nothing predating F1 is touched. Everything else in the report is additive, plus two
`implements` clauses widening.

On the repo-wide rebuild: at default parallelism it reported *"succeeded with warnings"* — 20
instances of downstream API Extractor not resolving `@fgv/ts-json-base`'s rollup `.d.ts`, which is
present on disk. F1 recorded the same phase-interleaving race. At `--parallelism 1` it is clean.
No warning names anything inside `ts-json-base`.

## Known follow-up, dispositioned

`createChildFile` / `createChildFileBytes` do not validate child names the way
`writeChildAtomically` does, and silently `joinPaths` a name containing a separator. F1
dispositioned this out of scope; **F2 does the same and routes it to `TECH_DEBT.md`.** It did not
fall out naturally: the two methods are on a different code path, the change is a behavior change
on established, stability-obligated methods, and neither is reachable from the atomic protocol.
Folding it in would mean a breaking change to two pre-existing methods inside a stream about
something else.

## Handoff

`@fgv/ts-agent-tasks` T3's durable path is unblocked **on Linux ext2/ext3/ext4 and tmpfs only**.
macOS is not qualified and must not be treated as passed.

Per the A1 amendment of 2026-09-22, that is **not** a gap awaiting a darwin slice — darwin is out of
the intended matrix and no slice is queued, because a containerized consumer never executes there.
**What a T3 host must actually check is where its root is mounted.** The container's writable layer
is `overlayfs`, which is deliberately not on the allowlist and is refused; a named volume, a Linux
bind mount, or tmpfs qualifies; a macOS-host bind mount through VirtioFS is refused. A durable root
belongs on a volume rather than the ephemeral writable layer in any case, so the refusal points at
the right practice — but a host that assumed the writable layer would qualify will be refused at
run time, and that is the failure worth anticipating. Qualifying `overlayfs` remains available as a
future slice and is deliberately not queued.
