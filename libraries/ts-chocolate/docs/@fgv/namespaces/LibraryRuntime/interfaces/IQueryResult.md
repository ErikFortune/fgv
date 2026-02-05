[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IQueryResult

# Interface: IQueryResult\<T\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:745](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L745)

Result of a query execution with metadata

## Type Parameters

### T

`T`

## Properties

### hasMore

> `readonly` **hasMore**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:759](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L759)

Whether there are more items available (for pagination)

***

### items

> `readonly` **items**: readonly `T`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:749](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L749)

The matched items

***

### totalCount

> `readonly` **totalCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:754](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L754)

Total count of items before pagination (if applicable)
