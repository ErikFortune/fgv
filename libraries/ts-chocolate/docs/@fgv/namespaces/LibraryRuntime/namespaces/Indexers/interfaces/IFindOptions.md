[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / IFindOptions

# Interface: IFindOptions

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:94](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L94)

Options for the find operation.

## Properties

### aggregation?

> `optional` **aggregation**: [`AggregationMode`](../type-aliases/AggregationMode.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:101](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L101)

How to aggregate results from multiple indexers.
- 'intersection': Return only entities matching ALL indexers (AND semantics)
- 'union': Return entities matching ANY indexer (OR semantics)
Defaults to 'intersection'.
