[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IResolvedCoatingOption

# Interface: IResolvedCoatingOption

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1357](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1357)

A resolved coating option with the full ingredient object.

## Properties

### id

> `readonly` **id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1359](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1359)

The coating ingredient ID

***

### ingredient

> `readonly` **ingredient**: [`IIngredient`](IIngredient.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1361](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1361)

The resolved ingredient object

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1363](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1363)

Optional notes specific to this coating option
