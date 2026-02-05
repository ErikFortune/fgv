[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedIngredientFillingOption

# Interface: IResolvedIngredientFillingOption

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1239](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1239)

Resolved ingredient filling option.

## Properties

### entity

> `readonly` **entity**: [`IIngredientFillingOptionEntity`](../../Entities/namespaces/Confections/interfaces/IIngredientFillingOptionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1249](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1249)

The original ingredient filling option entity data

***

### id

> `readonly` **id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1243](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1243)

The ingredient ID (satisfies IHasId for IOptionsWithPreferred)

***

### ingredient

> `readonly` **ingredient**: [`IIngredient`](IIngredient.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1245](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1245)

The resolved ingredient object

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1247](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1247)

Optional notes specific to this filling option

***

### type

> `readonly` **type**: `"ingredient"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1241](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1241)

Discriminator for type-safe access
