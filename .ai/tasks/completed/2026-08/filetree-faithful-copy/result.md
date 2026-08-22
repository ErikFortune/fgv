# Result — `filetree-faithful-copy`

**Shipped 2026-08-22.** Additive on `@fgv/ts-json-base`'s `file-tree` packlet.

## What shipped

Two free functions and one optional capability they are built on.

```ts
copyItemInto(source: FileTreeItem, destination: IMutableFileTreeDirectoryItem, options?)
copyContentsInto(source: IFileTreeDirectoryItem, destination: IMutableFileTreeDirectoryItem, options?)
```

The consumer asked for `copyInto(dst)` and `copyChild(child, dst)`. Those two names are
ambiguous together — "into" reads as *contents into* for a directory source and *as a child*
for a file source — so the shipped pair says which it is in the name. `copyContentsInto`
does not reproduce the source directory itself; `copyItemInto` does.

**The guarantee is one sentence: every file that lands is byte-identical to its source, or
the copy says so.** Where the destination store is byte-native the bytes are carried
verbatim. Where it persists text they are carried as text *only after verifying that the
text re-encodes to exactly the source bytes*. A file that survives neither route is failed
or skipped — never written in a form that differs from the source.

Supporting capability, which is also the narrower half of the ask:

```ts
interface IMutableBinaryFileTreeDirectoryItem extends IMutableFileTreeDirectoryItem {
  canCreateChildFileBytes(): boolean;
  createChildFileBytes(name: string, bytes: Uint8Array): Result<IMutableFileTreeFileItem>;
}
// + isMutableBinaryDirectoryItem, + DirectoryItem implements both
```

## Why the strict decode is not the implementation

The obvious way to write "carry it as text when the bytes are text" is a `fatal: true`
decode: if it decodes, it is text. **That is wrong, and it fails on a completely ordinary
file.** `TextDecoder` strips a leading BOM by default and `TextEncoder` does not put one
back, so `EF BB BF 68 69` decodes to `"hi"` without error and arrives three bytes shorter.

So the check is by construction — decode, re-encode, compare — rather than by argument:

```ts
const decoded = captureResult(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes)).orDefault();
return decoded !== undefined && _bytesEqual(new TextEncoder().encode(decoded), bytes) ? decoded : undefined;
```

Two paired tests make the point: the same BOM file copied to a byte destination is
**preserved**, and copied to a text destination is **refused**. Neither passes against the
strict-decode-only implementation.

This is the finding the stream would not have had without writing the check. The brief did
not anticipate it; the design question it did anticipate (fail / skip / encode) was already
answered before implementation started.

## Why it reads bytes and only bytes

An earlier draft fell back to `getRawContents()` when a source could not produce bytes. That
produces a file whose faithfulness nothing has established — precisely the outcome the
surface exists to prevent — so it is now a `Failure`. Every shipped adapter (`fs`,
in-memory, zip, browser FSA, `localStorage`, HTTP) implements `getFileBytes`, so this costs
no real consumer anything and only refuses a hand-rolled minimal accessor, loudly.

Note what this does *not* claim: on the string-backed stores those "bytes" are a re-encode of
an already-decoded string, exactly as the strict-text capability documents. The copy cannot
improve on the custody its source has. What it can do — and what the consumer's bug was — is
never *downgrade* a byte-native source into a text write.

## `'fail'` by default, and the consumer's argument is the better one

Ours was honesty at the boundary: `getFileTextStrict` refuses on a store that cannot answer
rather than returning a plausible value; `HttpTreeAccessors` refuses every file under its
default encoding for the same reason.

Theirs, which arrived after the brief was filed:

> A loud failure would have caught a **modelling error**, not a capability mismatch. The
> file that broke us is the derived record index — reconstructible, and our own durable-index
> work already flagged it as dead weight in the snapshot. We shouldn't be snapshotting it at
> all. So we'll fix the inclusion, not reach for `'skip'`.

That changes what `'fail'` is *for*, and two implementation decisions follow from it:

- **The failure names the path.** A message reading "destination cannot hold bytes" is
  useless for recognising "why is this file here at all?". Pinned by a test asserting the
  path appears in both the failure message and the skipped entry's `message` — the same
  string by construction, since the diagnosis should not depend on which mode you ran in.
- **`'skip'` stays deliberately explicit.** If it is the one-word fix, the modelling error it
  masks stays masked.

## Additive, not a widening — deliberately

`createChildFileBytes` could have gone onto `IMutableFileTreeDirectoryItem` as a required
member. It did not: it is a new optional interface plus guard, mirroring the binary and
strict-text conventions already in this packlet. `@fgv/ts-json-base` is an **established**
surface that every other library depends on, and the alpha in flight already carried two
breaking changes.

`canCreateChildFileBytes()` exists because the item guard cannot promise success and
`FileItem._hal` / `DirectoryItem._hal` are `protected`, so accessors are not reachable from
an item. Unlike the file-item case, though, the answer *can* be surfaced — a total,
synchronous, non-`Result` accessor in the same spirit as `getIsMutable()` and
`IMemoryStore.embedsKind`. That is what lets the copy ask before every write instead of
discovering the answer by one failing.

`createChildFileBytes` checks before it creates, so a refusal leaves **no placeholder**. A
test asserts the destination directory is untouched afterward. That is the entire reason the
method exists rather than the create-then-`setRawBytes` dance.

## The report splits by mechanism, not outcome

```ts
{ filesCopiedAsBytes, filesCopiedAsText, directoriesCreated, skipped }
```

Both counts are byte-faithful. The split is there because `filesCopied: 500` reads
identically whether a snapshot took the verbatim route or a text round trip, and an audit
wants to know which — the `IVectorRebuildReport` rule on a second surface: totals are
derivable by summing, the breakdown is derivable from nothing else.

`ISkippedCopyFile` is `{ sourcePath, destinationPath, message }` with **no `reason` field**.
An earlier draft had a `CopySkipReason` union; it collapsed to one member once
source-side failures became failures rather than skips, and a one-member union carries no
information. Adding one back is additive if a second reason ever appears.

## Two properties documented because they surprise

**A copy is not atomic and does not roll back.** `mapResults` attempts every file, so a
failure names *every* offending path rather than the first — which is the useful form when
the answer is "these files should not be in this set" — and the destination keeps whatever
succeeded. Stated in the TSDoc and pinned by a test that asserts both halves.

**A copy into a location beneath its own source is not supported.** The walk would re-read a
subtree it is concurrently growing. It cannot be detected from the items: two different
stores can present the same absolute path, so a path-prefix test would refuse legitimate
copies. The recursion is bounded at 128 instead, which turns a hang into an error naming
where it stopped. Pinned by a directory item that returns itself as its own child.

## One branch removed rather than covered

The byte comparison was first an indexed loop. Its "same length, different bytes" arm is
unreachable through the public API — a strict decode plus re-encode can only differ by the
stripped BOM, which changes the length — so it showed as the file's only uncovered lines.
Rewritten as `left.length === right.length && left.every((b, i) => b === right[i])`: the
same check, no uncoverable line, no `c8 ignore`. Per `TESTING_GUIDELINES.md` the question is
whether the branch should exist, not how to reach it.

## Gates

| gate | result |
|---|---|
| `rushx build` (`@fgv/ts-json-base`) | pass, no warnings |
| `rushx lint` | pass; `rushx fixlint` made no changes |
| `rushx test` | 29 new tests; **100% statements / branches / functions / lines** across the `file-tree` packlet |
| repo-wide `rush rebuild` | pass |
| `rush change --verify` | change file present for `@fgv/ts-json-base` |

One pre-existing suite failure is unrelated and reproduces at `HEAD` without this change:
`mutableFsTree.test.ts` → *"returns permission-denied for read-only file"* fails when the
suite runs as **root**, because `chmod 0444` does not stop root writing. `fsTree.ts` already
carries `/* c8 ignore ... unreachable when running as root (CI) */` on the matching branch.
Verified by stashing the whole change and re-running: 29 passed, 1 failed, identically.

## Review

**Layer 1 was run inline rather than via the `code-reviewer` agent**, on an explicit session
constraint against spawning subagents. Recorded here rather than left silent, because an
unnamed skipped gate is the failure the review-loop section exists to prevent.

Three things it found, all fixed:

1. `EMPTY_REPORT.skipped` was a plain `[]` spread into every per-file report, so every report
   aliased one array. Now `Object.freeze([])`.
2. `_mergeReports` propagated that alias into its result whenever no file was skipped. Now
   builds a fresh array via `flatMap`.
3. No bound on the recursion — the copy-into-a-descendant hang above.

## Not in scope

- An `overwrite` option. Existing destination files are overwritten, matching
  `createChildFile`; the consumer did not ask for a choice.
- Rollback / atomic copy. Stated as a limit instead.
- A byte-native `setContents` sibling, or byte writes on any adapter that does not already
  have them.
