[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedConfectionProcedure

# Interface: IResolvedConfectionProcedure

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1319](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1319)

Resolved procedure reference for confections.
Similar to IResolvedFillingRecipeProcedure but for confections.

## Properties

### entity

> `readonly` **entity**: [`IProcedureRefEntity`](../../Entities/namespaces/Fillings/type-aliases/IProcedureRefEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1327](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1327)

The original procedure reference entity data

***

### id

> `readonly` **id**: [`ProcedureId`](../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1321](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1321)

The procedure ID (for IOptionsWithPreferred compatibility)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1325](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1325)

Optional notes specific to using this procedure

***

### procedure

> `readonly` **procedure**: [`IProcedure`](IProcedure.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1323](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1323)

The resolved procedure object
