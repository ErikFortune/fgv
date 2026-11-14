[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IScoreUnionMergeStrategyCreateParams

# Interface: IScoreUnionMergeStrategyCreateParams

Parameters for [ScoreUnionMergeStrategy.create](../classes/ScoreUnionMergeStrategy.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-identityresolver"></a> `identityResolver` | `readonly` | [`IIdentityResolver`](IIdentityResolver.md) | Resolves each merged record's `(kind, entityId)` to the scope it lives under, which together with its `id` is the identity the merge deduplicates and scores on. Normally the store the composed retrievers read from (`IMemoryStore` is an `IIdentityResolver`), so the merge uses the same codecs the records were loaded and verified with. |
