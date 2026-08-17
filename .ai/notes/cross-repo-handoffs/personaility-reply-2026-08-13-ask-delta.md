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
| **2.3** strict UTF-8 text read | **Will do** — reversing an earlier won't-do. The path we would have pointed you at is false on the HTTP adapter you are adopting. One question back. |

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

## 2.3 — **we take it back. Will do, and we owe you a correction**

An earlier draft of this reply answered *won't-do*, on the grounds that `getFileBytes` +
`new TextDecoder('utf-8', { fatal: true })` already spells strictness. We learned you are moving to
the **HTTP** adapter, went and checked it properly, and that answer is not merely inconvenient for
you — **it is wrong, and the thing it points you at is a lie on that adapter.**

### What we actually found

`HttpTreeAccessors` extends `InMemoryTreeAccessors` and is seeded from the REST payload's
`contents: string`. The base's `getFileBytes` returns byte-seeded contents verbatim but **encodes**
string-seeded contents. Over HTTP every file is the string case.

So the sequence is: your bytes → the server's JSON encoder → **`JSON.parse` decodes them, leniently,
substituting U+FFFD** → we hold a `string` → `getFileBytes()` re-encodes that string → you decode it
with `{ fatal: true }` → **it succeeds.** Clean, valid UTF-8. Every invalid sequence already became
U+FFFD one layer upstream, outside our code, and re-encoding a replacement character produces
perfectly valid bytes.

You would have gotten a green light from a check that had nothing left to check.

**And our own docstring says the opposite.** `HttpTreeAccessors`' class doc currently claims you can
"call `getFileBytes()` to read a file's bytes *without going through a lenient UTF-8 decode*." For
this adapter that is false — the lenient decode already happened before the accessor existed. **We
are fixing that docstring regardless of what we build**, because it is wrong today and it is wrong on
exactly the path you are adopting.

### What we will build, and the part that matters

A strict read, **and a refusal**:

- On adapters that hold real bytes (Node `fs`, zip, in-memory, browser FSA, `localStorage`) a strict
  read is meaningful, and that is the straightforward half.
- On `HttpTreeAccessors` a strict read must **fail loudly as unsupported**, not succeed. If we shipped
  the flag without that, we would hand you the same false confidence in a new wrapper — and you would
  have *more* reason to trust it, because you asked for it by name.

That refusal is the established shape here, not an invention for this case: our browser `safer-fetch`
**rejects `redirectPolicy: 'validate-each-hop'` at option resolution** rather than accepting it and
failing at the first redirect, precisely so a caller whose URLs never redirect cannot ship believing a
guarantee is in force. Same principle, same reason.

### The question we need back from you

If you need to know that the bytes on the server were valid UTF-8, **no flag on our side can tell you**
— the information is destroyed by the transport before we see it. That needs a bytes-native transport
(base64 or an octet-stream body), which is a **wire-format change**, and our own docs already
acknowledge as much for the write direction: byte *writes* are unsupported over HTTP for this exact
reason.

So: is your requirement **(a)** "detect invalid UTF-8 in files I read from local/zip/FSA stores, and
get a loud unsupported over HTTP", or **(b)** "detect it over HTTP too"? (a) is the work described
above. (b) is a transport design conversation and we should have it as one rather than let us build
(a) and hand you a refusal where you needed an answer.

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
