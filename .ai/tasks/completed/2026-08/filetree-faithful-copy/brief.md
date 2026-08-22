# Stream brief — `filetree-faithful-copy`

**Status: READY 🟢 — ask verified against source, one premise corrected, design question answered.**
The one open decision (destination-cannot-hold-bytes → fail / skip / encode) is **closed: `'fail'`
by default, `'skip'` explicit-only**, confirmed by the consumer 2026-08-22. No design work remains
before implementation; the sequencing gate below is the only thing holding it.
Filed 2026-08-22 from PersonAIlity's long-form note § 1, which reached us late (§ 2 of the same
note was the structured-output ask, shipped as **#652**).
**Shape:** additive on `@fgv/ts-json-base`'s `file-tree` packlet. Touches the capability model,
so it wants a design decision before code.

## The consumer's bug

They copy a directory tree in two places (a snapshot codec and a hub store), both doing
`getRawContents()` → `createChildFile(name, contents)` — **a text read and a text write**. Lossless
while the trees held only Markdown and JSON; **lossy the moment a SQLite file went in one**, so
snapshot-then-restore now lands a mangled database.

Their bug, and they say so. The ask is about the shape that made it easy to write.

## Verification — claim by claim, against `libraries/ts-json-base/src/packlets/file-tree/`

| claim | verdict |
|---|---|
| No `copyInto` / `copyChild` / `copyTo` / `clone` anywhere in the package | ✅ confirmed — grepped the packlet and `ts-extras/zip-file-tree`; every `copy` hit is MIT licence boilerplate |
| `IBinaryFileTreeFileItem.getRawBytes(): Result<Uint8Array>` | ✅ `fileTreeAccessors.ts:249`, impl `fileItem.ts:184` |
| `IMutableBinaryFileTreeFileItem.setRawBytes(bytes): Result<Uint8Array>` | ✅ impl `fileItem.ts:194` |
| `createChildFile(name, contents: string)` is string-only, no byte-native sibling | ✅ `fileTreeAccessors.ts:371`; no `createChildFileBytes` / `createChildBinary` / equivalent exists |
| `isBinaryAccessors`' own docs say it *"does not promise `getRawBytes()` will succeed"* | ❌ **misattributed — see below** |

### The correction, and why it matters to them

The "narrows the type but does not promise success" caveat belongs to the **file-item** guards
(`isBinaryFileItem` / `isMutableBinaryFileItem`), **not** to the accessor guards. The source says the
opposite of the claim (`fileTreeAccessors.ts:306-312`):

> **At the file-item level that distinction is not visible to the guard.** `FileItem` implements
> this interface unconditionally and delegates to its accessors, so `isMutableBinaryFileItem` is
> `true` for any `FileItem` — including one backed by a text-persisting store, whose `setRawBytes`
> then returns a `Failure`. Narrow the **accessors** with `isMutableBinaryAccessors` when you need
> the capability check to be a success guarantee.

`LIBRARY_CAPABILITIES.md` says the same thing in the same words.

**This is not a gotcha — it makes their present situation better than they think.** They describe
"four combinations, each with a live failure path". Narrowed at the **accessor** level, all four are
**decidable up front**, with no live failure path at all: the guard is the answer. If their copy is
currently narrowing at the file-item level, that alone is why it feels like a trap, and it is fixable
today without waiting for us.

**It does not dissolve the ask.** Four combinations still exist, the decision at the end of them is
still real, and `createChildFile` is still string-only — so the faithful copy is still
create-with-a-placeholder-then-set-bytes, and every consumer still writes it.

## What is actually being asked

1. **A capability-aware copy** — `copyInto(dst)` / `copyChild(child, dst)` or equivalent — that
   preserves bytes where both ends support them, with **one defined, documented behaviour** where
   they do not.
2. **The narrower fallback:** a byte-native create on `IMutableFileTreeDirectoryItem`, which collapses
   create-then-set into one fallible step and removes the placeholder. They say they would take the
   copy helper over this if forced to choose.
3. **Explicitly NOT asking:** any weakening of `isBinaryAccessors`. They call narrowing-without-
   promising the honest contract and do not want it changed. (Given the correction above, the guard
   they were actually thinking of is a different one — worth telling them, but the instruction stands
   for both.)

## The design question — **answered 2026-08-22, decision is `'fail'`**

**What does a copy do when the destination cannot hold bytes?** Fail, skip, or encode. This was the
whole ask — they said outright that the four-combination decision "belongs with the people who own
the capability model", and they were right.

The repo's own precedent points hard at one answer. `getFileTextStrict` refuses on a store that
cannot answer honestly rather than returning a plausible value; `HttpTreeAccessors` refuses **every**
file under its default encoding for the same reason. Silently encoding bytes into a text store is the
exact shape of the bug this ask comes from, so **fail** is the default the repo's posture implies —
with skip available explicitly, per the `onRecordError: 'fail' | 'skip'` idiom `IVectorIndex.rebuild`
already established, whose default is `'fail'`.

That symmetry is worth carrying deliberately rather than re-deriving: same two words, same default,
same reason.

### The consumer confirmed it, and their reasoning is stronger than ours

We put the one question back to them (the correction note's closing section) because they own the
snapshot codec and we do not. Their answer, verbatim in substance:

> Loud failure by default; `'skip'` explicit-only. **A snapshot that silently omits a file is a
> backup nobody can trust, and the omission surfaces at restore, when the original is gone.**

That alone settles the default. But the second half of their reply is the part to carry into the
implementation, because it is an argument we did not make:

> A loud failure would have caught a **modelling error**, not a capability mismatch. The file that
> broke us is the derived record index — reconstructible, and our own durable-index work already
> flagged it as dead weight in the snapshot. **We shouldn't be snapshotting it at all.** So we'll fix
> the inclusion, not reach for `'skip'`.

**This changes what `'fail'` is for.** Our argument was about honesty at the boundary — don't return a
plausible value you cannot stand behind. Theirs is that the failure is *diagnostic*: the file that
could not be carried was a file that should never have been in the set. A `'skip'` default would have
absorbed a modelling error into a silent omission and left it absorbed. `'fail'` surfaced it at the
point where the wrong answer was "why is this here at all?".

**Implementation consequence, and it is not just tone:** the failure message must name the file, not
merely report that the copy could not complete. The whole value of the diagnosis depends on the
consumer being able to look at the named path and recognise that it does not belong. A message of the
form *"destination cannot hold bytes"* is useless for that; *"`<path>`: destination store persists
text and cannot hold bytes"* is the finding. Same reasoning that makes `IMemoryStore.reconcile` name
its kind and its artifact.

**And it argues against a per-call `'skip'` being convenient.** If reaching for `'skip'` is the
one-word fix, the modelling error stays. Keep it explicit and slightly inconvenient — an option a
caller passes deliberately, never a mode that a copy falls into.

## Sequencing note

Do **not** start this before the pending publish lands. It is additive on a package every other
library depends on, and the alpha now in flight already carries two breaking changes.

## Gates

- [ ] `rushx build` / `lint` / `test` at 100% in `@fgv/ts-json-base`
- [ ] **Repo-wide `rush rebuild`** — this widens a `FileTree` contract that six adapters and several
      consumers implement; the acceptance-criteria checkbox applies
- [ ] Change file for `@fgv/ts-json-base`
- [ ] A test per source/destination capability combination, including the two where the destination
      cannot hold bytes — those are the ones the behaviour decision is about
- [ ] A test proving a **byte-native round trip** through the copy (the consumer's SQLite case in
      miniature: bytes that are not valid UTF-8, copied and compared byte-for-byte)
- [ ] **A test asserting the failure message names the offending path**, not just the condition —
      the diagnostic value the consumer is relying on lives entirely in that string
- [ ] `LIBRARY_CAPABILITIES.md` entry, including the destination-cannot-hold-bytes behaviour — a
      consumer choosing between copy and hand-rolling needs it stated
- [x] Consumer note: the `isBinaryAccessors` correction (useful to them **before** this ships) —
      sent 2026-08-22, `.ai/notes/cross-repo-handoffs/personaility-reply-2026-08-22-binary-accessor-correction.md`
- [x] Behaviour decision settled with the consumer — `'fail'` default confirmed, see above
