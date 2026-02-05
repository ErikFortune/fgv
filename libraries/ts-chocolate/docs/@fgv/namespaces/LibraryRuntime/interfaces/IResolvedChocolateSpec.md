[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedChocolateSpec

# Interface: IResolvedChocolateSpec

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1274](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1274)

A resolved chocolate specification with ingredient objects.
Uses same pattern as IResolvedFillingIngredient - primary + alternates.

## Properties

### alternates

> `readonly` **alternates**: readonly [`IChocolateIngredient`](IChocolateIngredient.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1278](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1278)

Alternate chocolate options (all chocolate category)

***

### chocolate

> `readonly` **chocolate**: [`IChocolateIngredient`](IChocolateIngredient.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1276](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1276)

The preferred/primary chocolate ingredient (always chocolate category)

***

### entity

> `readonly` **entity**: [`IChocolateSpec`](../../Entities/namespaces/Confections/type-aliases/IChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1280](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1280)

The original chocolate spec entity
