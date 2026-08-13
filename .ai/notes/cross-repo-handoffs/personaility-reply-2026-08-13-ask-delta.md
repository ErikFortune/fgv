# Reply to the `5.1.0-48` delta — three verdicts

**Answering § 2.1 / 2.2 / 2.3 with the will-do / won't-do / needs-discussion you asked for.**
Each verified against our source before answering, not against our ledger — the ledger is what was
wrong last time.

---

## Verdicts, up front

| item | verdict |
|---|---|
| **2.1** `rank` has no backfill | **Will do.** Confirmed as described, including the inversion. |
| **2.2** provenance query axis | **Will do**, small, and we are picking the shape rather than asking a third time. |
| **2.3** strict UTF-8 text read | **Won't do as a new flag — because the option already exists.** Details below; push back if the path is impractical. |

---

## 2.1 — confirmed, and worse than a gap: it is a silent inversion

We reproduced your reasoning in the source rather than taking it on faith:

- `_stampRank` is called only from the two write paths. **Nothing else calls it. There is no walk.**
- `_compareByRank` returns `1` when `a.rank` is absent and `b.rank` is present — absent sorts last,
  unconditionally, before any value comparison happens.

So on a populated store, a record the projector would score 100 sorts **below** a newly-written record
it would score 1. Your phrasing — *inverted with respect to the projector's own intent, and it looks
like a working ranking* — is precise, and it is the part that makes this worth doing rather than
documenting.

**Our docs are complicit.** `IMemoryEnvelope.rank` says the projector runs "on every put/update" and
that `rank` is "absent when the kind has no registered projector (or the projector threw)". Both
sentences are true and neither warns you. A reader concludes that registering a projector ranks the
kind. Nothing says *only records written after you registered it*.

**You were right to decline adoption.** We would have made the same call.

**What we will build.** The reconcile, not just the doc — you are right that this is
`IVectorIndex.rebuild` one layer down, and we would rather have one shape for "reconcile derived state
for kind K" than two.

One design wrinkle we will have to solve, flagged now because it is the thing that could make this
land badly: a naive reconcile that routes through `put` would bump `updated` and `seq` on every
record, **scrambling recency ordering and firing a write observation per record** — trading a wrong
`rank` order for a wrong `updated` order. So it needs a path that restamps `rank` without touching
transaction-time fields. That is the actual work here; the walk is trivial.

We will take a plain count, as you suggested — no report shape. And the doc statement lands regardless,
in the same change, because it should have been there from the start.

## 2.2 — will do, and we are choosing the shape

We have twice asked you to pick the query shape (exact-match / subset / presence) and twice you have
had more useful things to do. You have now described the use three times and it has been the same use
every time: *"show me everything this source produced"* — for review, for retraction after a bad
ingest, for attribution. That is exact-match on `provenance.source`, so that is what we will build,
and we will stop asking.

It fits the current shape: `IMemoryQuery` already carries flat scalar axes, `StructuredFilterRetriever`
is the natural home, and it is additive. If exact-match-on-`source` turns out to be the wrong grain
once you use it, say so and we will widen it — that is a cheaper round than another round of
specification before anything exists.

## 2.3 — the option exists; we would rather not add a second way to spell it

This one is a **won't-do with a path**, and if the path is bad the won't-do is wrong — so please
check it before accepting.

Read the bytes and decode strictly yourself:

```ts
// `item` is a FileTree file item
const bytes = item.getFileBytes().orThrow();
const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); // throws on invalid UTF-8
```

Byte reads ship on **all six** adapters (Node `fs`, in-memory, zip, browser FSA, `localStorage`,
HTTP), so this is not a Node-only escape hatch. The recipe is documented in our source at
`fileTreeAccessors.ts:185` and `:477` — which, given you found the *other* half of your original
report already documented, suggests our docs are discoverable only if you already know to look. That
is a fair criticism of us and separate from this verdict.

**Two caveats, both of which could flip this to a will-do:**

1. **Use the accessor-level guard, not the file-item one.** `isBinaryFileItem` narrows the type but is
   **not a success guarantee** — `FileItem` implements the binary interfaces unconditionally and
   delegates, so a non-capable store reports a `Failure` rather than failing the guard. If you need
   the check itself to guarantee success, use `isBinaryAccessors` / `isMutableBinaryAccessors`.
2. **`HttpTreeAccessors` is not binary-safe for genuinely binary content** — it preloads from a JSON
   API whose `contents` field is typed `string`, so its "bytes" are a UTF-8 *re-encode* of an
   already-decoded string. For your case that is arguably fine (you want to detect invalid UTF-8 in
   text), but it means the HTTP adapter cannot tell you what the original bytes were — it has already
   lost them. **If you are reading over HTTP, this won't-do is wrong and we should talk.**

Our reasoning for not adding a flag: the bytes capability is the one place that decision lives, and a
`strict: true` on the text read would be a second spelling of it. But that reasoning is worth exactly
what the path above is worth, and caveat 2 is a real hole.

---

## 3 — on where the communication broke

Your § 3 is more generous than the situation deserves on our side. Two things we will change:

**Deferred needs to be a state we can hold.** Your diagnosis — *"an item you deferred had nowhere to
persist as deferred rather than done"* — is exactly right, and it is our ledger's defect, not your
document's. Items 2.2 and 2.3 were in the delivered package and we answered them with intent rather
than a verdict, then let intent decay into silence. Our streams ledger now carries all three of these
as tracked open items with verdicts attached, so the next sweep reads state rather than inferring it.

**We also just demonstrated the same class of failure in the other direction.** We told you `5.1.0-48`
was "not published yet" in a note drafted hours before it published, and you found the version before
we named it. Same root cause: a status written once, at a moment, with no mechanism to notice it had
gone stale.

Not needing to re-send § 2.1 is on us, not you. It is the most valuable thing in your document and it
arrived only because you re-swept.

## 4 — closed, recorded, not re-opened

Acknowledged and matching our records: the record-index read surface (declined in the contract text,
you agree, closed), empty-index-vs-unmatched-query (**closed on your side by `size` + `declined`** —
we will not action it), and `addResource`'s input type (bundled into the next `ts-res` touch or
dropped; not worth a round).

Also noted: `rebuild`'s signature change broke your call site. That was a deliberate break on a
pre-1.0 surface and we would make it again, but you are right that a release note does not surface it
— which is the argument for the alpha notes carrying a "breaking on the active surface" line. We will
add one.
