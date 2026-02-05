[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / Task

# Class: Task

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:49](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L49)

A resolved view of a task with rendering capabilities.

Task wraps a data-layer Task and provides:
- Composite identity (TaskId) for cross-source references
- Template parsing and required variable extraction
- Parameter validation
- Template rendering
- Context access for resolving task references (future use)

## Implements

- [`ITask`](../interfaces/ITask.md)

## Accessors

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseTaskId`](../../../../type-aliases/BaseTaskId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:97](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L97)

The base task ID within the source

##### Returns

[`BaseTaskId`](../../../../type-aliases/BaseTaskId.md)

The base task ID within the source.

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`baseId`](../interfaces/ITask.md#baseid)

***

### defaultActiveTime

#### Get Signature

> **get** **defaultActiveTime**(): [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:130](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L130)

Optional default active time

##### Returns

[`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Optional default active time

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`defaultActiveTime`](../interfaces/ITask.md#defaultactivetime)

***

### defaultHoldTime

#### Get Signature

> **get** **defaultHoldTime**(): [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:146](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L146)

Optional default hold time

##### Returns

[`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Optional default hold time

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`defaultHoldTime`](../interfaces/ITask.md#defaultholdtime)

***

### defaults

#### Get Signature

> **get** **defaults**(): `Readonly`\<`Record`\<`string`, `unknown`\>\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:174](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L174)

Optional default values for template placeholders

##### Returns

`Readonly`\<`Record`\<`string`, `unknown`\>\> \| `undefined`

Optional default values for template placeholders

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`defaults`](../interfaces/ITask.md#defaults)

***

### defaultTemperature

#### Get Signature

> **get** **defaultTemperature**(): [`Celsius`](../../../../type-aliases/Celsius.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:153](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L153)

Optional default temperature

##### Returns

[`Celsius`](../../../../type-aliases/Celsius.md) \| `undefined`

Optional default temperature

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`defaultTemperature`](../interfaces/ITask.md#defaulttemperature)

***

### defaultWaitTime

#### Get Signature

> **get** **defaultWaitTime**(): [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:138](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L138)

Optional default wait time

##### Returns

[`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Optional default wait time

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`defaultWaitTime`](../interfaces/ITask.md#defaultwaittime)

***

### entity

#### Get Signature

> **get** **entity**(): [`IRawTaskEntity`](../../Entities/interfaces/IRawTaskEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:252](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L252)

Gets the underlying task data entity

##### Returns

[`IRawTaskEntity`](../../Entities/interfaces/IRawTaskEntity.md)

Gets the underlying task data entity.

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`entity`](../interfaces/ITask.md#entity)

***

### id

#### Get Signature

> **get** **id**(): [`TaskId`](../../../../type-aliases/TaskId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:90](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L90)

The composite task ID (e.g., "common.melt-chocolate")

##### Returns

[`TaskId`](../../../../type-aliases/TaskId.md)

The composite task ID (e.g., "common.melt-chocolate").
Combines source and base ID for unique identification across sources.

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`id`](../interfaces/ITask.md#id)

***

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:108](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L108)

Human-readable name of the task

##### Returns

`string`

Human-readable name

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`name`](../interfaces/ITask.md#name)

***

### notes

#### Get Signature

> **get** **notes**(): readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:160](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L160)

Optional categorized notes

##### Returns

readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Optional categorized notes

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`notes`](../interfaces/ITask.md#notes)

***

### requiredVariables

#### Get Signature

> **get** **requiredVariables**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:123](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L123)

Required variables extracted from the template.
This is computed at Task creation, not stored in the data layer.

##### Returns

readonly `string`[]

Required variables extracted from the template

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`requiredVariables`](../interfaces/ITask.md#requiredvariables)

***

### tags

#### Get Signature

> **get** **tags**(): readonly `string`[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:167](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L167)

Optional tags

##### Returns

readonly `string`[] \| `undefined`

Optional tags

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`tags`](../interfaces/ITask.md#tags)

***

### template

#### Get Signature

> **get** **template**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:115](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L115)

The Mustache template string

##### Returns

`string`

The Mustache template string

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`template`](../interfaces/ITask.md#template)

## Methods

### render()

> **render**(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:236](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L236)

Renders the task template with the given params (merged with defaults).

#### Parameters

##### params

`Record`\<`string`, `unknown`\>

The parameter values for template rendering

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Success with rendered string, or Failure if rendering fails

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`render`](../interfaces/ITask.md#render)

***

### validateAndRender()

> **validateAndRender**(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:245](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L245)

Validates params and renders the template if validation passes.

#### Parameters

##### params

`Record`\<`string`, `unknown`\>

The parameter values to validate and render with

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Success with rendered string, or Failure with validation or render errors

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`validateAndRender`](../interfaces/ITask.md#validateandrender)

***

### validateParams()

> **validateParams**(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskRefValidation`](../../Entities/namespaces/Tasks/interfaces/ITaskRefValidation.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:199](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L199)

Validates that params (combined with defaults) satisfy required variables.

#### Parameters

##### params

`Record`\<`string`, `unknown`\>

The parameter values to validate

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ITaskRefValidation`](../../Entities/namespaces/Tasks/interfaces/ITaskRefValidation.md)\>

Validation result with details about present/missing variables

#### Implementation of

[`ITask`](../interfaces/ITask.md).[`validateParams`](../interfaces/ITask.md#validateparams)

***

### create()

> `static` **create**(`context`, `id`, `task`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Task`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/tasks/task.ts:77](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/tasks/task.ts#L77)

Factory method for creating a Task.
Parses the Mustache template and extracts required variables.

#### Parameters

##### context

[`ITaskContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context for task resolution

##### id

[`TaskId`](../../../../type-aliases/TaskId.md)

The composite task ID

##### task

[`IRawTaskEntity`](../../Entities/interfaces/IRawTaskEntity.md)

The task data entity

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Task`\>

Success with Task, or Failure if template parsing fails
