[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedIngredientFillingOption

# Interface: IResolvedIngredientFillingOption

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1267](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1267)

Resolved ingredient filling option.

## Properties

### entity

> `readonly` **entity**: [`IIngredientFillingOptionEntity`](../../Entities/namespaces/Confections/interfaces/IIngredientFillingOptionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1277](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1277)

The original ingredient filling option entity data

***

### id

> `readonly` **id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1271](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1271)

The ingredient ID (satisfies IHasId for IOptionsWithPreferred)

***

### ingredient

> `readonly` **ingredient**: [`IIngredient`](IIngredient.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1273](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1273)

The resolved ingredient object

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1275](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1275)

Optional notes specific to this filling option

***

### type

> `readonly` **type**: `"ingredient"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1269](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1269)

Discriminator for type-safe access
