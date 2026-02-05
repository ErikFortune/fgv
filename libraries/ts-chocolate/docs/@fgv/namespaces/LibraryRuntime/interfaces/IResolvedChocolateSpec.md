[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedChocolateSpec

# Interface: IResolvedChocolateSpec

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1302](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1302)

A resolved chocolate specification with ingredient objects.
Uses same pattern as IResolvedFillingIngredient - primary + alternates.

## Properties

### alternates

> `readonly` **alternates**: readonly [`IChocolateIngredient`](IChocolateIngredient.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1306](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1306)

Alternate chocolate options (all chocolate category)

***

### chocolate

> `readonly` **chocolate**: [`IChocolateIngredient`](IChocolateIngredient.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1304](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1304)

The preferred/primary chocolate ingredient (always chocolate category)

***

### entity

> `readonly` **entity**: [`IChocolateSpec`](../../Entities/namespaces/Confections/type-aliases/IChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1308](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1308)

The original chocolate spec entity
