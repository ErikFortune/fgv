[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedConfectionProcedure

# Interface: IResolvedConfectionProcedure

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1324](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1324)

Resolved procedure reference for confections.
Similar to IResolvedFillingRecipeProcedure but for confections.

## Properties

### entity

> `readonly` **entity**: [`IProcedureRefEntity`](../../Entities/namespaces/Fillings/type-aliases/IProcedureRefEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1332](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1332)

The original procedure reference entity data

***

### id

> `readonly` **id**: [`ProcedureId`](../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1326](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1326)

The procedure ID (for IOptionsWithPreferred compatibility)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1330](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1330)

Optional notes specific to using this procedure

***

### procedure

> `readonly` **procedure**: [`IProcedure`](IProcedure.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1328](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1328)

The resolved procedure object
