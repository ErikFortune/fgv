[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IIndexCoverage

# Interface: IIndexCoverage

Coverage of the record-granular vector index.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-indexsize"></a> `indexSize` | `readonly` | `number` | What the index **actually holds**, whole-index. **Remarks** **This is a fact and [IArtifactCoverage.covered](IArtifactCoverage.md#property-covered) is a belief, and the two are reported separately because their disagreement is the only free signal that distinguishes a persistent index from a fresh one.** `covered` counts envelopes carrying an `embeddingRef`; `indexSize` counts vectors. With a persistent index they agree. With an in-memory index at open they do not — the envelopes still claim references from previous sessions while the index holds nothing, so `covered` **lies, in the confident direction**. Collapsing them into one "coverage %" would destroy that signal, which is why this type does not offer one. |
| <a id="property-perkind"></a> `perKind` | `readonly` | `ReadonlyMap`\<[`Kind`](../type-aliases/Kind.md), [`IArtifactCoverage`](IArtifactCoverage.md)\> | Per-kind expected/covered, derived from the envelope walk. |
