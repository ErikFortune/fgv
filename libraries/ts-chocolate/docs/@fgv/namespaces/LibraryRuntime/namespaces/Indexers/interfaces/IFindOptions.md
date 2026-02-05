[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / IFindOptions

# Interface: IFindOptions

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:94](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L94)

Options for the find operation.

## Properties

### aggregation?

> `optional` **aggregation**: [`AggregationMode`](../type-aliases/AggregationMode.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:101](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L101)

How to aggregate results from multiple indexers.
- 'intersection': Return only entities matching ALL indexers (AND semantics)
- 'union': Return entities matching ANY indexer (OR semantics)
Defaults to 'intersection'.
