[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Procedures](../README.md) / IValidatedProcedureStep

# Interface: IValidatedProcedureStep

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:97](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L97)

A procedure step with runtime validation state attached.
Used during rendering when validation has been performed.

## Extends

- [`IProcedureStepEntity`](../../../interfaces/IProcedureStepEntity.md)

## Properties

### activeTime?

> `readonly` `optional` **activeTime**: [`Minutes`](../../../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:48](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L48)

Time actively working on this step (overrides task default)

#### Inherited from

[`IProcedureStepEntity`](../../../interfaces/IProcedureStepEntity.md).[`activeTime`](../../../interfaces/IProcedureStepEntity.md#activetime)

***

### holdTime?

> `readonly` `optional` **holdTime**: [`Minutes`](../../../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:58](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L58)

Time to hold at a temperature (overrides task default)

#### Inherited from

[`IProcedureStepEntity`](../../../interfaces/IProcedureStepEntity.md).[`holdTime`](../../../interfaces/IProcedureStepEntity.md#holdtime)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:68](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L68)

Optional categorized notes for this step

#### Inherited from

[`IProcedureStepEntity`](../../../interfaces/IProcedureStepEntity.md).[`notes`](../../../interfaces/IProcedureStepEntity.md#notes)

***

### order

> `readonly` **order**: `number`

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:38](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L38)

Order number of this step (1-based)

#### Inherited from

[`IProcedureStepEntity`](../../../interfaces/IProcedureStepEntity.md).[`order`](../../../interfaces/IProcedureStepEntity.md#order)

***

### task

> `readonly` **task**: [`ITaskEntityInvocation`](../../../type-aliases/ITaskEntityInvocation.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:43](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L43)

The task for this step - either a reference to a public task or an inline task definition

#### Inherited from

[`IProcedureStepEntity`](../../../interfaces/IProcedureStepEntity.md).[`task`](../../../interfaces/IProcedureStepEntity.md#task)

***

### temperature?

> `readonly` `optional` **temperature**: [`Celsius`](../../../../../../type-aliases/Celsius.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:63](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L63)

Target temperature for this step (overrides task default)

#### Inherited from

[`IProcedureStepEntity`](../../../interfaces/IProcedureStepEntity.md).[`temperature`](../../../interfaces/IProcedureStepEntity.md#temperature)

***

### validation?

> `readonly` `optional` **validation**: [`IProcedureStepValidation`](IProcedureStepValidation.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:101](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L101)

Runtime validation state (computed, not persisted)

***

### waitTime?

> `readonly` `optional` **waitTime**: [`Minutes`](../../../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/procedures/model.ts:53](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/procedures/model.ts#L53)

Passive waiting time (overrides task default)

#### Inherited from

[`IProcedureStepEntity`](../../../interfaces/IProcedureStepEntity.md).[`waitTime`](../../../interfaces/IProcedureStepEntity.md#waittime)
