[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedFillingRecipeProcedure

# Interface: IResolvedFillingRecipeProcedure

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:517](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L517)

A resolved procedure reference with the full procedure object.
Used in runtime recipes to provide direct access to procedure details.

## Properties

### entity

> `readonly` **entity**: [`IProcedureRefEntity`](../../Entities/namespaces/Fillings/type-aliases/IProcedureRefEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:536](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L536)

The original procedure reference entity data.

***

### id

> `readonly` **id**: [`ProcedureId`](../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:521](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L521)

The procedure ID (for consistency with IResolvedConfectionProcedure).

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:531](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L531)

Optional notes specific to using this procedure with the recipe.

***

### procedure

> `readonly` **procedure**: [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:526](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L526)

The fully resolved procedure object.
