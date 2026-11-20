# One correction on § 1 you can act on today, before we ship anything

**2026-08-22.** § 1 reached us and is filed (**#653**) with the copy helper accepted in principle.
This note is only about one premise in it, because **that premise is why the current shape feels
like a trap, and it is fixable on your side now.**

§ 2 of the same note is **shipped** — see the structured-output reply.

---

## The claim, and what the source says

You wrote that `isBinaryAccessors`' own docs note it *"does not promise `getRawBytes()` will
succeed."*

That caveat is real, but it belongs to the **file-item** guards, not the accessor guards. The source
says the opposite of the claim (`fileTreeAccessors.ts:306-312`):

> **At the file-item level that distinction is not visible to the guard.** `FileItem` implements this
> interface unconditionally and delegates to its accessors, so `isMutableBinaryFileItem` is `true` for
> any `FileItem` — including one backed by a text-persisting store, whose `setRawBytes` then returns a
> `Failure`. Narrow the **accessors** with `isMutableBinaryAccessors` when you need the capability
> check to be a success guarantee.

So the two guards are not two spellings of one check:

| guard | what it tells you |
|---|---|
| `isBinaryFileItem(item)` / `isMutableBinaryFileItem(item)` | **`true` for every `FileItem`.** Narrows the type; promises nothing about the call. |
| `isBinaryAccessors(hal)` / `isMutableBinaryAccessors(hal)` | **The real capability check.** Only byte-persisting stores implement the mutable half. |

`FileItem.getRawBytes()` is literally `if (isBinaryAccessors(this._hal)) { … } return fail(…)` — the
item guard cannot tell you what that branch will do, because the item implements the interface either
way.

## Why this matters to your four combinations

You described *"four source-supports × destination-supports combinations, each with a live failure
path."* **The live failure paths are a consequence of narrowing at the item level.** Narrowed at the
accessor level, all four are decidable **up front**, once per tree, before you copy anything — the
guard *is* the answer.

That does not remove the four combinations, and it does not remove the decision at the end of them.
It removes the part where you cannot tell which one you are in until a call fails mid-copy.

## Where the check goes

`FileTree.hal` is **public**, so the accessors are reachable from a tree you hold:

```ts
import { FileTree } from '@fgv/ts-json-base';

const srcBytes = FileTree.isBinaryAccessors(srcTree.hal);        // can the source produce bytes?
const dstBytes = FileTree.isMutableBinaryAccessors(dstTree.hal); // can the destination store them?

// One decision, once, at the top — not per file, and not discovered by a failure.
if (srcBytes && dstBytes) {
  // faithful path: getRawBytes -> createChildFile(placeholder) -> setRawBytes
} else {
  // your policy — see below
}
```

`FileItem`'s own accessors are `protected`, so you cannot narrow from an item. Hoist the check to
where you build the tree, which is where you already hold the accessors — `FileTree.create(hal)`
takes them.

**Note the asymmetry, because it is the one that bit you:** read capability is `isBinaryAccessors`,
write capability is `isMutable**Binary**Accessors`. A store can do the first and not the second —
in-memory, `localStorage`, and the HTTP JSON transport all read bytes and persist text, which is
exactly the shape that turns a byte-faithful read into a lossy write. `isMutableAccessors` alone is
not the write check.

## What we are still on the hook for

The correction does **not** dissolve the ask, and we are not treating it as one. `createChildFile` is
still string-only, so the faithful path is still create-with-a-placeholder-then-set-bytes; the four
combinations still exist; and every consumer still writes the copy. #653 carries the brief.

**The open design question is the one you named**, and you were right that it is ours: what a copy
does when the destination cannot hold bytes — fail, skip, or encode. Our own precedent points at
**fail**: `getFileTextStrict` refuses on a store that cannot answer honestly rather than returning a
plausible value, and `HttpTreeAccessors` refuses *every* file under its default encoding for the same
reason. Silently encoding bytes into a text store is the exact shape of your SQLite bug, so we are
disinclined to make it the default. We expect to land `'fail'` as the default with `'skip'` available
explicitly, matching the `onRecordError` idiom `IVectorIndex.rebuild` already uses.

**If that is wrong for your snapshot codec, now is the time to say so** — a snapshot that silently
skips a file it could not carry is arguably worse for you than one that fails loudly, and you are the
one who knows which. That is the one thing here where your evidence changes what we build.

> **Answered same day — `'fail'` confirmed.** They agreed on the ground we expected ("a snapshot that
> silently omits a file is a backup nobody can trust, and the omission surfaces at restore, when the
> original is gone") **and added the better argument**: in their case a loud failure catches a
> *modelling* error, not a capability mismatch. The file that broke them is the derived record index —
> reconstructible, already flagged as dead weight in the snapshot, and not something they should be
> snapshotting at all. So they fix the inclusion rather than reaching for `'skip'`.
>
> Two implementation consequences, carried into the brief: the failure must **name the path** (the
> diagnosis is worthless otherwise), and `'skip'` should stay deliberately explicit — if it is the
> one-word fix, the modelling error it masks stays masked.

## One thing we are not doing

You asked us not to weaken `isBinaryAccessors`, on the grounds that narrowing-without-promising is
the honest contract. We agree and are not touching it — though note the guard you were describing is
the file-item one, and *that* one is the narrow-without-promise. Both stay as they are.
