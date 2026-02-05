[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedConfectionProcedure

# Interface: IResolvedConfectionProcedure

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1352](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1352)

A resolved procedure reference for confections.
Similar to IResolvedFillingRecipeProcedure but for confections.

## Properties

### entity

> `readonly` **entity**: [`IProcedureRefEntity`](../../Entities/namespaces/Fillings/type-aliases/IProcedureRefEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1360](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1360)

The original procedure reference entity data

***

### id

> `readonly` **id**: [`ProcedureId`](../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1354](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1354)

The procedure ID (for IOptionsWithPreferred compatibility)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1358](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1358)

Optional notes specific to using this procedure

***

### procedure

> `readonly` **procedure**: [`IProcedure`](IProcedure.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1356](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1356)

The resolved procedure object
