[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IRenderedProcedure

# Interface: IRenderedProcedure

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:120](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L120)

A rendered procedure with all template values resolved.

## Properties

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:129](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L129)

Optional description

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:124](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L124)

Name of the procedure

***

### steps

> `readonly` **steps**: readonly [`IRenderedStep`](IRenderedStep.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:134](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L134)

Rendered steps with resolved task templates

***

### totalActiveTime?

> `readonly` `optional` **totalActiveTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:139](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L139)

Total active time for all steps

***

### totalHoldTime?

> `readonly` `optional` **totalHoldTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:149](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L149)

Total hold time for all steps

***

### totalWaitTime?

> `readonly` `optional` **totalWaitTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:144](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L144)

Total wait time for all steps
