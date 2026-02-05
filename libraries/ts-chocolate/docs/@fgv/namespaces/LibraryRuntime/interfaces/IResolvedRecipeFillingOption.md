[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedRecipeFillingOption

# Interface: IResolvedRecipeFillingOption

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1222](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1222)

Resolved recipe filling option.

## Properties

### entity

> `readonly` **entity**: [`IRecipeFillingOptionEntity`](../../Entities/namespaces/Confections/interfaces/IRecipeFillingOptionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1232](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1232)

The original recipe filling option entity data

***

### filling

> `readonly` **filling**: [`IFillingRecipe`](IFillingRecipe.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1228](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1228)

The resolved filling recipe object

***

### id

> `readonly` **id**: [`FillingId`](../../../../type-aliases/FillingId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1226](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1226)

The filling ID (satisfies IHasId for IOptionsWithPreferred)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1230](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1230)

Optional notes specific to this filling option

***

### type

> `readonly` **type**: `"recipe"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1224](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1224)

Discriminator for type-safe access
