[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedFillingIngredient

# Interface: IResolvedFillingIngredient\<TIngredient\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:683](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L683)

A resolved ingredient reference with full ingredient data and alternates.
This is the primary interface for accessing recipe ingredients in the runtime layer.

## Type Parameters

### TIngredient

`TIngredient` *extends* [`IIngredient`](IIngredient.md) = [`IIngredient`](IIngredient.md)

## Properties

### alternates

> `readonly` **alternates**: readonly `TIngredient`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:702](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L702)

Resolved alternate ingredients that can substitute for the primary

***

### amount

> `readonly` **amount**: [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:692](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L692)

Amount in grams

***

### entity

> `readonly` **entity**: [`IFillingIngredientEntity`](../../Entities/namespaces/Fillings/interfaces/IFillingIngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:707](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L707)

The original ingredient entity reference data

***

### ingredient

> `readonly` **ingredient**: `TIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:687](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L687)

The fully resolved ingredient object

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:697](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L697)

Optional notes for this specific ingredient usage
