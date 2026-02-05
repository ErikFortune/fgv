[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IProcedureStepEntity

# Interface: IProcedureStepEntity

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:34](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L34)

A single step in a procedure (persisted data model).
Does not include validation state - that is contextual and computed at runtime.

## Extended by

- [`IValidatedProcedureStep`](../namespaces/Procedures/interfaces/IValidatedProcedureStep.md)
- [`IRenderedStep`](../../LibraryRuntime/interfaces/IRenderedStep.md)

## Properties

### activeTime?

> `readonly` `optional` **activeTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:48](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L48)

Time actively working on this step (overrides task default)

***

### holdTime?

> `readonly` `optional` **holdTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:58](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L58)

Time to hold at a temperature (overrides task default)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:68](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L68)

Optional categorized notes for this step

***

### order

> `readonly` **order**: `number`

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:38](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L38)

Order number of this step (1-based)

***

### task

> `readonly` **task**: [`ITaskEntityInvocation`](../type-aliases/ITaskEntityInvocation.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:43](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L43)

The task for this step - either a reference to a public task or an inline task definition

***

### temperature?

> `readonly` `optional` **temperature**: [`Celsius`](../../../../type-aliases/Celsius.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:63](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L63)

Target temperature for this step (overrides task default)

***

### waitTime?

> `readonly` `optional` **waitTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:53](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L53)

Passive waiting time (overrides task default)
