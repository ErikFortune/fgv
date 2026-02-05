[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedProcedures

# Interface: IResolvedProcedures

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:538](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L538)

Collection of resolved procedures associated with a recipe.

## Properties

### procedures

> `readonly` **procedures**: readonly [`IResolvedFillingRecipeProcedure`](IResolvedFillingRecipeProcedure.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:542](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L542)

Available procedures for this recipe - fully resolved.

***

### recommendedProcedure?

> `readonly` `optional` **recommendedProcedure**: [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:548](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L548)

The recommended/default procedure - fully resolved.
Undefined if no recommended procedure is specified.
