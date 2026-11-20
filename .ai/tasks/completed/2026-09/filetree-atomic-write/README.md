# `filetree-atomic-write` — atomic replacement for `FileTree`, and a durability claim that has to be earned

**Shipped 2026-09-21.** `@fgv/ts-json-base`. Two versions, one landing on `release`:
F1 the contracts (#681), F2 the Node implementation and its qualification.

---

## What it is

`FileTree` gained an **optional atomic-write capability**. A consumer can replace a file's
contents such that a reader never observes a torn write, and — where the root has actually been
qualified for it — can wait for a declared persistence boundary before acknowledging.

```ts
if (!FileTree.isAtomicDirectoryItem(dir)) { /* no such capability */ }

// The guard says the methods exist. This says what a write would achieve.
const caps = dir.getAtomicWriteCapabilities().orThrow();
if (!caps.guarantees.includes('process-crash')) { /* this root cannot promise that */ }

dir.writeChildAtomically('record.json', body, { guarantee: 'process-crash' });

// At exclusive reopen, reclaim what an interrupted write left behind.
dir.cleanupAtomicTemporaries();
```

Four questions this surface deliberately keeps apart, having historically run them together:
**method presence** (the guard) ≠ **writability** (`fileIsMutable`) ≠ **atomic visibility**
(`atomicReplace`) ≠ **durability** (`guarantees`).

## Why it lives on the primitive

`FsFileTreeAccessors.saveFileContents` wrote through a bare `fs.writeFileSync`. A crash mid-write
truncates the file. The consumer that needed this (`@fgv/ts-agent-tasks`) could have hand-rolled
temp-and-rename over native paths — which is exactly the workaround `CODING_STANDARDS.md`
§ *Extending Core Libraries Over Working Around Them* names: it bypasses `FileTree`, ties the
consumer to Node, and leaves the next consumer to reimplement it. So the capability landed on the
primitive, where `ts-agent-memory`'s `FileTreeMemoryStore` is the obvious second consumer.

## The one idea worth carrying elsewhere

**A durability claim is refused unless the root can be *positively identified* as one the
qualification suite actually ran on.** Not a denylist, not a platform string, not a successful
probe. Where the runtime cannot identify the filesystem, the answer is "unqualified" — because
*we could not tell* is not *yes*.

That rule cost the stream its macOS support. A1 named macOS in the intended matrix; Linux's
`statfs` magic is a stable identifier and darwin's is a mount-table index with no Node-exposed
`f_fstypename`, so a darwin root cannot be identified from inside the package. It is refused.
**That is the rule working, not failing** — and it bounds what T3 may depend on, which is
recorded rather than glossed.

The companion rule: `'visibility: unchanged'` is only ever claimed on positive evidence that the
rename was rejected before it touched a directory entry. `ENOSPC`, `EDQUOT`, `EIO`, an
unrecognized errno and an *absent* errno all classify as `'unknown'`, because the dangerous
direction is telling a caller nothing happened when something might have.

## What the evidence is, and what it is not

- **Fault injection at every protocol boundary**, wrapping the *real* filesystem — so everything
  before an injected failure actually happened on disk.
- **Subprocess crash tests** in which a child running the real protocol **kills itself** with
  `SIGKILL` at each of seven boundaries. Self-inflicted, so the synchronization is exact rather
  than a sleep the parent hoped was long enough. Verified on ext4 and tmpfs — 11 tests per
  filesystem, 10 of them crash-synchronized plus an uninterrupted control.
- **Mutation testing** — twelve protections neutered one at a time to confirm the intended test
  actually goes red. A regression test nobody has watched fail is a guess.

**It is not evidence of OS-crash or power-loss survival, and none is claimed.** A process-kill
leaves the page cache intact, so flushed and unflushed bytes are indistinguishable to every test
here. What is pinned is that the record is flushed once and the directory entry once, in that
order, **identified by descriptor** — structural evidence, not physical.

## Three things that only showed up because of how it was tested

1. **`errnoOf` used `error instanceof Error`.** Node's `fs` constructs errors in its own realm and
   `instanceof` tests the *calling* realm's `Error`, so in any `vm` context, worker thread or test
   sandbox an ordinary `ENOENT` became `'UNKNOWN'` — and a rename failure that was provably
   `unchanged` would have been reported `unknown`. 29 tests went red. Caught by the fault
   injection, not by the type checker and not by the review pass.
2. **Widening an interface without widening its type guard is invisible to the compiler**, because
   the guard's own assertion is what suppresses the check. `cleanupAtomicTemporaries` joined
   `IAtomicFileTreeAccessors`; `isAtomicAccessors` still checked two of three members, so it
   narrowed objects to a type promising a method they lacked, and the delegating call threw a
   `TypeError` instead of returning a `Result`. Caught by `code-reviewer` (P1).
3. **Two mutations did not compile, and returned "nothing went red"** — indistinguishable from a
   verified protection. They were the two *flushes*. Recorded as unverified and redone rather than
   counted. A later round caught a second instance of the same shape: an assertion that *counted*
   flushes passed a mutation flushing the directory twice and the record never, because the count
   and the occurrence positions are identical. The assertion now pins descriptors.

## Vocabulary reconciliation

F1 declared 16 union members and exercised 5. F2 had explicit license to revise rather than
inherit. Outcome: **`stage` loses `'cleanup'`** (no producer, and none obtainable honestly), every
other member is now produced, and all four `AtomicWriteGuarantee` members are **kept** — on the
distinction that

> `guarantee` is an **input** vocabulary, where a member is witnessed by a **refusal** as much as
> by a receipt. `stage` is an **output** vocabulary, where a member with no producer is dead.

15 declared members, 0 unexercised.

## Archived artifacts

| file | what it is |
|---|---|
| [`brief.md`](brief.md) | the stream brief, with the reconnaissance done before implementation |
| [`state.md`](state.md) | the live checkpoint, including the **crash-test prediction written before the first run** and the full mutation table |
| [`result.md`](result.md) | the completion record: tested matrix, guarantee-to-test mapping, fault-injection results, vocabulary reasoning |
| [`meta.yaml`](meta.yaml) | stream metadata |

Design authority: [`docs/design/agent-tasks/development-design.md`](../../../../docs/design/agent-tasks/development-design.md) §8.1–8.2.

## Handoff

`@fgv/ts-agent-tasks` T3's durable path is unblocked **on Linux ext2/ext3/ext4 and tmpfs only**.
macOS is not qualified and must not be recorded as passed.

**A1 was amended on 2026-09-22 and darwin is now out of the intended matrix, not awaiting a slice.**
A containerized consumer never executes on darwin — `process.platform` is `'linux'` and `statfs`
returns a real magic number — so the gap is off the execution path and no darwin slice is queued.
What a T3 host must check instead is **where its root is mounted**: the container's writable layer
is `overlayfs`, which is deliberately absent from the allowlist and is refused; a named volume, a
Linux bind mount, or tmpfs qualifies; a macOS-host bind mount through VirtioFS is refused. A host
that assumed the writable layer would qualify learns otherwise at run time. Mount table and the
magic-number one-liner: `docs/design/agent-tasks/implementation-plan.md` § *A1 amendment*.
