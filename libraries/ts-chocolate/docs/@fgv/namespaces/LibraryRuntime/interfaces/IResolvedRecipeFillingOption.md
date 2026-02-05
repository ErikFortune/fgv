[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedRecipeFillingOption

# Interface: IResolvedRecipeFillingOption

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1217](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1217)

Resolved recipe filling option.

## Properties

### entity

> `readonly` **entity**: [`IRecipeFillingOptionEntity`](../../Entities/namespaces/Confections/interfaces/IRecipeFillingOptionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1227](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1227)

The original recipe filling option entity data

***

### filling

> `readonly` **filling**: [`IFillingRecipe`](IFillingRecipe.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1223](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1223)

The resolved filling recipe object

***

### id

> `readonly` **id**: [`FillingId`](../../../../type-aliases/FillingId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1221](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1221)

The filling ID (satisfies IHasId for IOptionsWithPreferred)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1225](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1225)

Optional notes specific to this filling option

***

### type

> `readonly` **type**: `"recipe"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1219](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1219)

Discriminator for type-safe access
