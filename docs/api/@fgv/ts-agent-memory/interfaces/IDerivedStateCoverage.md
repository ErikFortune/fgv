[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IDerivedStateCoverage

# Interface: IDerivedStateCoverage

A snapshot of how much of the store's **derived state** exists, resolved by
[Kind](../type-aliases/Kind.md) — the answer to *"is my derived state consistent with my
records?"*.

## Remarks

**Absent is not zero.** Each artifact member is optional, and `undefined` means
*this artifact is not derived here at all* — no rank projector is registered,
or that index lane is not wired. It never means *nothing is covered*. Folding
the two would make a health surface render a confident `0%` for a feature the
deployment deliberately did not turn on, which is the same defect as
`embeddingRef`'s three-way ambiguity one level up.

So: `fragmentVectors: undefined` is a store with no fragment index and is not a
problem. `fragmentVectors: { indexRecordCount: 0, indexFragmentCount: 0 }` is a
wired fragment index holding nothing, and probably is.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-fragmentvectors"></a> `fragmentVectors?` | `readonly` | [`IFragmentIndexCoverage`](IFragmentIndexCoverage.md) | Absent when the fragment lane is not wired. |
| <a id="property-rank"></a> `rank?` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), [`IArtifactCoverage`](IArtifactCoverage.md)\> | Absent when no kind has a registered [RankProjector](../type-aliases/RankProjector.md). |
| <a id="property-records"></a> `records` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), `number`\> | Records per kind — the denominator every other number is read against. |
| <a id="property-recordvectors"></a> `recordVectors?` | `readonly` | [`IIndexCoverage`](IIndexCoverage.md) | Absent when the record-vector lane is not wired. |
