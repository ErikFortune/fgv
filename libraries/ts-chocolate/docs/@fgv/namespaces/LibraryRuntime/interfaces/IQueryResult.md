[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IQueryResult

# Interface: IQueryResult\<T\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:750](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L750)

Result of a query execution with metadata

## Type Parameters

### T

`T`

## Properties

### hasMore

> `readonly` **hasMore**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:764](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L764)

Whether there are more items available (for pagination)

***

### items

> `readonly` **items**: readonly `T`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:754](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L754)

The matched items

***

### totalCount

> `readonly` **totalCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:759](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L759)

Total count of items before pagination (if applicable)
