[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / Procedure

# Class: Procedure

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:63](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L63)

A resolved view of a procedure with proper task resolution.

Procedure wraps a data-layer Procedure and provides:
- Composite identity (ProcedureId) for cross-source references
- Proper task resolution (not placeholders like the data-layer)
- Computed timing properties

Unlike the data-layer Procedure.render() which returns `[Task: taskId]` placeholders,
Procedure.render() actually resolves task references and renders their templates.

## Implements

- [`IProcedure`](../interfaces/IProcedure.md)

## Accessors

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseProcedureId`](../../../../type-aliases/BaseProcedureId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:103](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L103)

The base procedure ID within the source

##### Returns

[`BaseProcedureId`](../../../../type-aliases/BaseProcedureId.md)

The base procedure ID within the source.

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`baseId`](../interfaces/IProcedure.md#baseid)

***

### category

#### Get Signature

> **get** **category**(): [`ProcedureType`](../../../../type-aliases/ProcedureType.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:128](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L128)

Optional category this procedure applies to

##### Returns

[`ProcedureType`](../../../../type-aliases/ProcedureType.md) \| `undefined`

Optional category this procedure applies to

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`category`](../interfaces/IProcedure.md#category)

***

### description

#### Get Signature

> **get** **description**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:121](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L121)

Optional description

##### Returns

`string` \| `undefined`

Optional description

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`description`](../interfaces/IProcedure.md#description)

***

### entity

#### Get Signature

> **get** **entity**(): [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:288](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L288)

Gets the underlying procedure data entity

##### Returns

[`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md)

Gets the underlying procedure data entity

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`entity`](../interfaces/IProcedure.md#entity)

***

### id

#### Get Signature

> **get** **id**(): [`ProcedureId`](../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:96](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L96)

The composite procedure ID (e.g., "common.ganache-basic")

##### Returns

[`ProcedureId`](../../../../type-aliases/ProcedureId.md)

The composite procedure ID (e.g., "common.ganache-basic").
Combines source and base ID for unique identification across sources.

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`id`](../interfaces/IProcedure.md#id)

***

### isCategorySpecific

#### Get Signature

> **get** **isCategorySpecific**(): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:202](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L202)

Whether this procedure is category-specific

##### Returns

`boolean`

Whether this procedure is category-specific

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`isCategorySpecific`](../interfaces/IProcedure.md#iscategoryspecific)

***

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:114](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L114)

Human-readable name of the procedure

##### Returns

`string`

Human-readable name

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`name`](../interfaces/IProcedure.md#name)

***

### notes

#### Get Signature

> **get** **notes**(): readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:149](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L149)

Optional categorized notes

##### Returns

readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Optional categorized notes

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`notes`](../interfaces/IProcedure.md#notes)

***

### stepCount

#### Get Signature

> **get** **stepCount**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:195](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L195)

Number of steps

##### Returns

`number`

Number of steps

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`stepCount`](../interfaces/IProcedure.md#stepcount)

***

### steps

#### Get Signature

> **get** **steps**(): readonly [`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:135](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L135)

Steps of the procedure in order

##### Returns

readonly [`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md)[]

Steps of the procedure in order

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`steps`](../interfaces/IProcedure.md#steps)

***

### tags

#### Get Signature

> **get** **tags**(): readonly `string`[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:142](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L142)

Optional tags

##### Returns

readonly `string`[] \| `undefined`

Optional tags

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`tags`](../interfaces/IProcedure.md#tags)

***

### totalActiveTime

#### Get Signature

> **get** **totalActiveTime**(): [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:160](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L160)

Total active time for all steps

##### Returns

[`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Total active time for all steps

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`totalActiveTime`](../interfaces/IProcedure.md#totalactivetime)

***

### totalHoldTime

#### Get Signature

> **get** **totalHoldTime**(): [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:176](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L176)

Total hold time for all steps

##### Returns

[`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Total hold time for all steps

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`totalHoldTime`](../interfaces/IProcedure.md#totalholdtime)

***

### totalTime

#### Get Signature

> **get** **totalTime**(): [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:184](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L184)

Total time (active + wait + hold)

##### Returns

[`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Total time (active + wait + hold)

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`totalTime`](../interfaces/IProcedure.md#totaltime)

***

### totalWaitTime

#### Get Signature

> **get** **totalWaitTime**(): [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:168](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L168)

Total wait time for all steps

##### Returns

[`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Total wait time for all steps

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`totalWaitTime`](../interfaces/IProcedure.md#totalwaittime)

## Methods

### render()

> **render**(`renderContext`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRenderedProcedure`](../interfaces/IRenderedProcedure.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:221](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L221)

Renders the procedure with the given context.
Resolves task references to actual task content (not placeholders).

This is the main difference from the data-layer Procedure.render():
- Data layer: Returns `[Task: taskId]` placeholders for task references
- Runtime layer: Actually resolves task references and renders templates

#### Parameters

##### renderContext

[`IProcedureRenderContext`](../interfaces/IProcedureRenderContext.md)

The render context with recipe and library access

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRenderedProcedure`](../interfaces/IRenderedProcedure.md)\>

Success with rendered procedure, or Failure if rendering fails

#### Implementation of

[`IProcedure`](../interfaces/IProcedure.md).[`render`](../interfaces/IProcedure.md#render)

***

### create()

> `static` **create**(`context`, `id`, `procedure`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Procedure`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts:81](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/procedure.ts#L81)

Factory method for creating a Procedure.

#### Parameters

##### context

[`IProcedureContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context for task resolution

##### id

[`ProcedureId`](../../../../type-aliases/ProcedureId.md)

The composite procedure ID

##### procedure

[`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md)

The procedure data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Procedure`\>

Success with Procedure
