[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedIngredientFillingOption

# Interface: IResolvedIngredientFillingOption

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1234](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1234)

Resolved ingredient filling option.

## Properties

### entity

> `readonly` **entity**: [`IIngredientFillingOptionEntity`](../../Entities/namespaces/Confections/interfaces/IIngredientFillingOptionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1244](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1244)

The original ingredient filling option entity data

***

### id

> `readonly` **id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1238](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1238)

The ingredient ID (satisfies IHasId for IOptionsWithPreferred)

***

### ingredient

> `readonly` **ingredient**: [`IIngredient`](IIngredient.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1240](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1240)

The resolved ingredient object

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1242](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1242)

Optional notes specific to this filling option

***

### type

> `readonly` **type**: `"ingredient"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1236](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1236)

Discriminator for type-safe access
