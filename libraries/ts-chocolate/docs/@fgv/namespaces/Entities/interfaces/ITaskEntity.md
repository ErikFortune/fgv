[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / ITaskEntity

# Interface: ITaskEntity

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:97](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L97)

A reusable task template with runtime-computed properties.
Extends ITaskData with requiredVariables extracted from the template.

## Extends

- [`IRawTaskEntity`](IRawTaskEntity.md)

## Properties

### baseId

> `readonly` **baseId**: [`BaseTaskId`](../../../../type-aliases/BaseTaskId.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:42](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L42)

Base task identifier (unique within collection)
Pattern: /^[a-zA-Z0-9_-]+$/

#### Inherited from

[`IRawTaskEntity`](IRawTaskEntity.md).[`baseId`](IRawTaskEntity.md#baseid)

***

### defaultActiveTime?

> `readonly` `optional` **defaultActiveTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:58](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L58)

Optional default active time (can be overridden by step)

#### Inherited from

[`IRawTaskEntity`](IRawTaskEntity.md).[`defaultActiveTime`](IRawTaskEntity.md#defaultactivetime)

***

### defaultHoldTime?

> `readonly` `optional` **defaultHoldTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:68](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L68)

Optional default hold time (can be overridden by step)

#### Inherited from

[`IRawTaskEntity`](IRawTaskEntity.md).[`defaultHoldTime`](IRawTaskEntity.md#defaultholdtime)

***

### defaults?

> `readonly` `optional` **defaults**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:89](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L89)

Optional default values for template placeholders.
Placeholders with defaults become optional when rendering.

#### Inherited from

[`IRawTaskEntity`](IRawTaskEntity.md).[`defaults`](IRawTaskEntity.md#defaults)

***

### defaultTemperature?

> `readonly` `optional` **defaultTemperature**: [`Celsius`](../../../../type-aliases/Celsius.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:73](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L73)

Optional default temperature (can be overridden by step)

#### Inherited from

[`IRawTaskEntity`](IRawTaskEntity.md).[`defaultTemperature`](IRawTaskEntity.md#defaulttemperature)

***

### defaultWaitTime?

> `readonly` `optional` **defaultWaitTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:63](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L63)

Optional default wait time (can be overridden by step)

#### Inherited from

[`IRawTaskEntity`](IRawTaskEntity.md).[`defaultWaitTime`](IRawTaskEntity.md#defaultwaittime)

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:47](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L47)

Human-readable name of the task

#### Inherited from

[`IRawTaskEntity`](IRawTaskEntity.md).[`name`](IRawTaskEntity.md#name)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:78](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L78)

Optional categorized notes about the task

#### Inherited from

[`IRawTaskEntity`](IRawTaskEntity.md).[`notes`](IRawTaskEntity.md#notes)

***

### requiredVariables

> `readonly` **requiredVariables**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:102](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L102)

Required variables extracted from the template at runtime.
This is computed from parsing the Mustache template, not persisted.

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:83](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L83)

Optional tags for categorization and search

#### Inherited from

[`IRawTaskEntity`](IRawTaskEntity.md).[`tags`](IRawTaskEntity.md#tags)

***

### template

> `readonly` **template**: `string`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:53](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L53)

Mustache template for the task description.
Variables can be flat (e.g., temp) or dotted (e.g., ingredient.name)

#### Inherited from

[`IRawTaskEntity`](IRawTaskEntity.md).[`template`](IRawTaskEntity.md#template)
