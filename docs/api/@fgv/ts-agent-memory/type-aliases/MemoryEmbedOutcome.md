[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / MemoryEmbedOutcome

# Type Alias: MemoryEmbedOutcome

> **MemoryEmbedOutcome** = `"embedded"` \| `"declined"` \| `"excluded"` \| `"failed"`

What the record-granular vector index did about a written record.

## Remarks

This exists because **`embeddingRef` absence is three-ways ambiguous**: a
record with no reference may have been declined, excluded, or genuinely
failed to embed, and the `put`'s own `outcome` cannot tell you which — it is
`'success'` in all three, because embed-on-write is best-effort by design and
never fails a durable write. Deriving index coverage from the absent field
alone therefore cannot distinguish a policy decision from an outage.

- `'embedded'` — embedded and added; the record carries an `embeddingRef`.
- `'declined'` — the [MemoryEmbedder](MemoryEmbedder.md) resolved `undefined`: deliberately
  not embedded. Not a fault.
- `'excluded'` — the record's kind is outside the store's `embedKinds`
  declaration, so the embedder was never called. Also not a fault, and the
  cheaper of the two.
- `'failed'` — the embedder returned a `Failure` (or threw), **or** the index
  `add` did. Both are faults, and what they leave behind depends on whether
  the record had been embedded before: a **first** write ends up with no
  `embeddingRef` and nothing in the index, while an **update** keeps the
  reference and vector it already had — so the index goes on answering on the
  record's **previous** content until a `rebuild` reconciles it. Stale, not
  absent. The store's diagnostic logger names which fault it was, because the
  remediation differs (an embedder outage versus an index outage) while the
  coverage answer — "this record needs a re-embed" — does not.

Absent on a write observation means **no outcome is being reported**, which
covers three cases:

1. no vector index / embedder is wired, so there is no index for the record to
   be absent from;
2. the `put` was a dedup no-op, which attempted nothing;
3. the `put` **failed** (`outcome: 'failure'`). An embed step may well have run
   before the failure — a record can even have been added to the index and then
   lost its durable write, leaving an orphan vector that a later `rebuild`
   reconciles. That is deliberately not reported here: the field answers
   "is this *stored* record in the index?", and on a failed write there is no
   stored record for it to be a statement about.

So `embed` is a property of successful writes. Never present on `'read'` /
`'delete'` / `'retrieve'`.

Record-granular only. The fragment path is independent and reports nothing
here — a record may be fragment-embedded while its record-level outcome is
`'excluded'`.
