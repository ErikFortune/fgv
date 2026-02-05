[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ITask

# Interface: ITask

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:64](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L64)

A resolved view of a task with rendering capabilities.

This interface provides runtime-layer access to task data with:
- Composite identity (`id`, `sourceId`) for cross-source references
- Rendering with library context
- Parameter validation

## Properties

### baseId

> `readonly` **baseId**: [`BaseTaskId`](../../../../type-aliases/BaseTaskId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:76](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L76)

The base task ID within the source.

***

### defaultActiveTime?

> `readonly` `optional` **defaultActiveTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:90](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L90)

Optional default active time

***

### defaultHoldTime?

> `readonly` `optional` **defaultHoldTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:96](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L96)

Optional default hold time

***

### defaults?

> `readonly` `optional` **defaults**: `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:108](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L108)

Optional default values for template placeholders

***

### defaultTemperature?

> `readonly` `optional` **defaultTemperature**: [`Celsius`](../../../../type-aliases/Celsius.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:99](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L99)

Optional default temperature

***

### defaultWaitTime?

> `readonly` `optional` **defaultWaitTime**: [`Minutes`](../../../../type-aliases/Minutes.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:93](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L93)

Optional default wait time

***

### entity

> `readonly` **entity**: [`IRawTaskEntity`](../../Entities/interfaces/IRawTaskEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:136](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L136)

Gets the underlying task data entity.

***

### id

> `readonly` **id**: [`TaskId`](../../../../type-aliases/TaskId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:71](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L71)

The composite task ID (e.g., "common.melt-chocolate").
Combines source and base ID for unique identification across sources.

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:81](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L81)

Human-readable name

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:102](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L102)

Optional categorized notes

***

### requiredVariables

> `readonly` **requiredVariables**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:87](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L87)

Required variables extracted from the template

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:105](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L105)

Optional tags

***

### template

> `readonly` **template**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:84](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L84)

The Mustache template string

## Methods

### render()

> **render**(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:124](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L124)

Renders the task template with the given params (merged with defaults).

#### Parameters

##### params

`Record`\<`string`, `unknown`\>

The parameter values for template rendering

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Success with rendered string, or Failure if rendering fails

***

### validateAndRender()

> **validateAndRender**(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:131](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L131)

Validates params and renders the template if validation passes.

#### Parameters

##### params

`Record`\<`string`, `unknown`\>

The parameter values to validate and render with

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Success with rendered string, or Failure with validation or render errors

***

### validateParams()

> **validateParams**(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskRefValidation`](../../Entities/namespaces/Tasks/interfaces/ITaskRefValidation.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/model.ts:117](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/tasks/model.ts#L117)

Validates that params (combined with defaults) satisfy required variables.

#### Parameters

##### params

`Record`\<`string`, `unknown`\>

The parameter values to validate

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskRefValidation`](../../Entities/namespaces/Tasks/interfaces/ITaskRefValidation.md)\>

Validation result with details about present/missing variables
