[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedChocolateSpec

# Interface: IResolvedChocolateSpec

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1269](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1269)

A resolved chocolate specification with ingredient objects.
Uses same pattern as IResolvedFillingIngredient - primary + alternates.

## Properties

### alternates

> `readonly` **alternates**: readonly [`IChocolateIngredient`](IChocolateIngredient.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1273](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1273)

Alternate chocolate options (all chocolate category)

***

### chocolate

> `readonly` **chocolate**: [`IChocolateIngredient`](IChocolateIngredient.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1271](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1271)

The preferred/primary chocolate ingredient (always chocolate category)

***

### entity

> `readonly` **entity**: [`IChocolateSpec`](../../Entities/namespaces/Confections/type-aliases/IChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1275](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1275)

The original chocolate spec entity
