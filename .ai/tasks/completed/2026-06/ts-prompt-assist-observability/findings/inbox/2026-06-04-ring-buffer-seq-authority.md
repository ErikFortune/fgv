# Finding: `RetainingRingBuffer` is a pure seq-ring; the library (not the buffer) owns seq + timestamp

**Date:** 2026-06-04
**Phase:** C (implementation)
**Disposition:** resolved in-stream (additive design refinement of the Phase A buffer sketch); recorded here for the `retaining-logger-ring-buffer-refactor` fast-follow agent.

---

## What the Phase A sketch said

Phase A's design Q1 sketched the buffer as owning seq + clock:

```ts
RetainingRingBuffer<T>.push(makeRecord: (seq, timestamp) => T): T   // buffer assigns seq + timestamp
```

and the Phase C kickoff echoed "inject `now?: () => number` (default `Date.now`)" on the buffer.

## What Phase C shipped instead

```ts
class RetainingRingBuffer<T extends { readonly seq: number }> {
  push(record: T): T;                       // caller mints the record (incl. its own seq)
  query({ sinceSeq?, limit?, filter? }): ReadonlyArray<T>;
  get lastSeq(): number;                     // max seq pushed; preserved across clear()
  clear(): void; get size(): number; get records(): ReadonlyArray<T>;
}
```

The buffer is a **pure seq-ring**: it does NOT assign `seq` and does NOT own a clock. The caller mints each record (assigning `seq` + `timestamp`) and pushes it.

## Why — the load-bearing constraint

This is forced by the **locked** OQ-5 (two cross-linked records via `linkedResolveSeq`) + multi-observer fan-out:

- `linkedResolveSeq` on an output record must reference the resolve record's `seq`. For that reference to be meaningful **across multiple observer stores** (the fan-out supports N observers), `seq` must come from a **single authority** shared by every store — not be assigned independently per-store by each store's buffer.
- Therefore `PromptLibrary` owns the monotonic `seq` counter (`_nextObservationSeq`) and the clock (`_observationNow`), stamps every record before fan-out, and every store receives the *same* record object with the *same* `seq`. `linkedResolveSeq` then resolves consistently in every store.
- If the buffer assigned `seq` on push, each store would assign its own independent `seq` and `linkedResolveSeq` (computed once by the library) could not be consistent across stores. The buffer-owns-seq model is incompatible with the locked cross-link semantics under multi-observer fan-out.

## Why this is also better for the fast-follow

`RetainingLogger` today owns its own `_lastSeq` counter and `_now` clock and builds the full `ILogRecord` in `_logStructured`. A pure seq-ring lets the fast-follow (`retaining-logger-ring-buffer-refactor`) compose `RetainingRingBuffer<ILogRecord>` with **minimal** change: `RetainingLogger` keeps assigning `seq`/`timestamp` exactly as it does now and just delegates the ring storage + `getRecords` paging to the buffer. No behavior change, `etc/ts-utils.api.md` stays a no-op on the public `RetainingLogger` surface — exactly what that stream's acceptance criteria require.

The `now`-injection-on-the-buffer detail from the kickoff is therefore satisfied at the timestamp **authority** (the library / the future logger), which is the more reusable seam.

## Net

- No locked prompt-assist behavior changed; all of Q3's field list and Q4's query API ship as drafted.
- The only deviation is the buffer's internal API shape (pure seq-ring vs factory-assigns-seq), which Phase B left to the agent ("agent picks the packlet / shape").
- The fast-follow agent should compose `RetainingRingBuffer<ILogRecord>` keeping `RetainingLogger`'s existing seq/clock ownership — do NOT move seq assignment into the buffer.
