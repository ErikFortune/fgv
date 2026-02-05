[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedProcedures

# Interface: IResolvedProcedures

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:543](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L543)

Collection of resolved procedures associated with a recipe.

## Properties

### procedures

> `readonly` **procedures**: readonly [`IResolvedFillingRecipeProcedure`](IResolvedFillingRecipeProcedure.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:547](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L547)

Available procedures for this recipe - fully resolved.

***

### recommendedProcedure?

> `readonly` `optional` **recommendedProcedure**: [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:553](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L553)

The recommended/default procedure - fully resolved.
Undefined if no recommended procedure is specified.
