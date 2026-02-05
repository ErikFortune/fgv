[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Fillings](../README.md) / IIngredientModifiers

# Interface: IIngredientModifiers

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:49](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L49)

Modifiers that qualify how an ingredient is measured or added.
Groups measurement hints and qualifiers to avoid interface pollution.

## Properties

### spoonLevel?

> `readonly` `optional` **spoonLevel**: [`SpoonLevel`](../../../../../../type-aliases/SpoonLevel.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:54](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L54)

For tsp/Tbsp measurements: whether the spoon is level, heaping, or scant.
This is a display hint only and does not affect scaling calculations.

***

### toTaste?

> `readonly` `optional` **toTaste**: `boolean`

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:60](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L60)

Indicates this ingredient is "to taste" - the amount is a suggestion.
Display format: "1/4 tsp salt, to taste"
