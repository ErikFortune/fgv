[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IRawTaskEntity

# Interface: IRawTaskEntity

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:37](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L37)

Persisted task data - the data model stored in YAML/JSON files.
Does not include requiredVariables as those are extracted from the template at runtime.

## Extended by

- [`ITaskEntity`](ITaskEntity.md)

## Properties

### baseId

> `readonly` **baseId**: [`BaseTaskId`](../../../../type-aliases/BaseTaskId.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:42](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L42)

Base task identifier (unique within collection)
Pattern: /^[a-zA-Z0-9_-]+$/

***

### defaultActiveTime?

> `readonly` `optional` **defaultActiveTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:58](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L58)

Optional default active time (can be overridden by step)

***

### defaultHoldTime?

> `readonly` `optional` **defaultHoldTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:68](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L68)

Optional default hold time (can be overridden by step)

***

### defaults?

> `readonly` `optional` **defaults**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:89](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L89)

Optional default values for template placeholders.
Placeholders with defaults become optional when rendering.

***

### defaultTemperature?

> `readonly` `optional` **defaultTemperature**: [`Celsius`](../../../../type-aliases/Celsius.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:73](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L73)

Optional default temperature (can be overridden by step)

***

### defaultWaitTime?

> `readonly` `optional` **defaultWaitTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:63](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L63)

Optional default wait time (can be overridden by step)

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:47](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L47)

Human-readable name of the task

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:78](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L78)

Optional categorized notes about the task

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:83](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L83)

Optional tags for categorization and search

***

### template

> `readonly` **template**: `string`

Defined in: [ts-chocolate/src/packlets/entities/tasks/model.ts:53](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/tasks/model.ts#L53)

Mustache template for the task description.
Variables can be flat (e.g., temp) or dotted (e.g., ingredient.name)
