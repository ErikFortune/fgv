[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedFillingRecipeProcedure

# Interface: IResolvedFillingRecipeProcedure

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:512](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L512)

A resolved procedure reference with the full procedure object.
Used in runtime recipes to provide direct access to procedure details.

## Properties

### entity

> `readonly` **entity**: [`IProcedureRefEntity`](../../Entities/namespaces/Fillings/type-aliases/IProcedureRefEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:531](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L531)

The original procedure reference entity data.

***

### id

> `readonly` **id**: [`ProcedureId`](../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:516](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L516)

The procedure ID (for consistency with IResolvedConfectionProcedure).

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:526](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L526)

Optional notes specific to using this procedure with the recipe.

***

### procedure

> `readonly` **procedure**: [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:521](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L521)

The fully resolved procedure object.
