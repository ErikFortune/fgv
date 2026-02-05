[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedRecipeFillingOption

# Interface: IResolvedRecipeFillingOption

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1250](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1250)

Resolved recipe filling option.

## Properties

### entity

> `readonly` **entity**: [`IRecipeFillingOptionEntity`](../../Entities/namespaces/Confections/interfaces/IRecipeFillingOptionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1260](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1260)

The original recipe filling option entity data

***

### filling

> `readonly` **filling**: [`IFillingRecipe`](IFillingRecipe.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1256](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1256)

The resolved filling recipe object

***

### id

> `readonly` **id**: [`FillingId`](../../../../type-aliases/FillingId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1254](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1254)

The filling ID (satisfies IHasId for IOptionsWithPreferred)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1258](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1258)

Optional notes specific to this filling option

***

### type

> `readonly` **type**: `"recipe"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1252](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1252)

Discriminator for type-safe access
