[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IRenderedStep

# Interface: IRenderedStep

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:98](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L98)

A rendered procedure step with resolved template values.

## Extends

- [`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md)

## Properties

### activeTime?

> `readonly` `optional` **activeTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:48](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L48)

Time actively working on this step (overrides task default)

#### Inherited from

[`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md).[`activeTime`](../../Entities/interfaces/IProcedureStepEntity.md#activetime)

***

### holdTime?

> `readonly` `optional` **holdTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:58](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L58)

Time to hold at a temperature (overrides task default)

#### Inherited from

[`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md).[`holdTime`](../../Entities/interfaces/IProcedureStepEntity.md#holdtime)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:68](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L68)

Optional categorized notes for this step

#### Inherited from

[`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md).[`notes`](../../Entities/interfaces/IProcedureStepEntity.md#notes)

***

### order

> `readonly` **order**: `number`

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:38](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L38)

Order number of this step (1-based)

#### Inherited from

[`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md).[`order`](../../Entities/interfaces/IProcedureStepEntity.md#order)

***

### renderedDescription

> `readonly` **renderedDescription**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:103](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L103)

The rendered description with all template values resolved.
Unlike the data-layer placeholder, this contains actual rendered content.

***

### resolvedTask?

> `readonly` `optional` **resolvedTask**: [`Task`](../classes/Task.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:109](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L109)

The resolved task that was used for rendering (if a task ref was used).
Undefined for inline tasks.

***

### task

> `readonly` **task**: [`ITaskEntityInvocation`](../../Entities/type-aliases/ITaskEntityInvocation.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:43](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L43)

The task for this step - either a reference to a public task or an inline task definition

#### Inherited from

[`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md).[`task`](../../Entities/interfaces/IProcedureStepEntity.md#task)

***

### temperature?

> `readonly` `optional` **temperature**: [`Celsius`](../../../../type-aliases/Celsius.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:63](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L63)

Target temperature for this step (overrides task default)

#### Inherited from

[`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md).[`temperature`](../../Entities/interfaces/IProcedureStepEntity.md#temperature)

***

### waitTime?

> `readonly` `optional` **waitTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:53](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L53)

Passive waiting time (overrides task default)

#### Inherited from

[`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md).[`waitTime`](../../Entities/interfaces/IProcedureStepEntity.md#waittime)
