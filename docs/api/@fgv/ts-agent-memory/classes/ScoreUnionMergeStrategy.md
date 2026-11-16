[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / ScoreUnionMergeStrategy

# Class: ScoreUnionMergeStrategy

The reference [IMergeStrategy](../interfaces/IMergeStrategy.md): a score-union. Every record is scored by
the number of composed result sets it appears in; the merged result is ordered
by descending score, then by recency. Records surfaced by more retrievers rank
higher.

## Remarks

**Identity is the record's scope-qualified address, not its bare `id`.** A
`MemoryId` is unique only within a scope — the MTM codec mints `turn-<n>` under
every conversation — so two records are "the same" when their
[\`(scope, id)\` addresses](../functions/scopedAddressOf.md) match, the scope coming from
the injected [IScoreUnionMergeStrategyCreateParams.identityResolver \| identity resolver](../interfaces/IScoreUnionMergeStrategyCreateParams.md#property-identityresolver). A record appearing several times in one result set counts
once for that set; distinct versions of a versioned entity have distinct ids and
stay distinct.

A record whose identity cannot be resolved (no codec for its kind, or a codec
that rejects its entity id) fails the whole merge, naming the kind and entity id.
There is deliberately no fallback to the bare id: that would silently conflate
records again.

## Implements

- [`IMergeStrategy`](../interfaces/IMergeStrategy.md)

## Methods

### merge()

> **merge**(`resultSets`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]\>

Merge the per-retriever result sets into a single ordered result.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resultSets` | readonly (readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[])[] | One entry per composed retriever, in composition order. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]\>

#### Implementation of

[`IMergeStrategy`](../interfaces/IMergeStrategy.md).[`merge`](../interfaces/IMergeStrategy.md#merge)

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ScoreUnionMergeStrategy`\>

Family-convention factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IScoreUnionMergeStrategyCreateParams`](../interfaces/IScoreUnionMergeStrategyCreateParams.md) | [IScoreUnionMergeStrategyCreateParams](../interfaces/IScoreUnionMergeStrategyCreateParams.md); the identity resolver is required. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`ScoreUnionMergeStrategy`\>
