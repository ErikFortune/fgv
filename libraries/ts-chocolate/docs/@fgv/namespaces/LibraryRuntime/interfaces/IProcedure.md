[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IProcedure

# Interface: IProcedure

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:166](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L166)

A resolved runtime view of a procedure with rendering capabilities.

This interface provides runtime-layer access to procedure data with:
- Composite identity (`id`, `collectionId`) for cross-source references
- Proper task resolution (not placeholders)
- Computed timing properties

## Properties

### baseId

> `readonly` **baseId**: [`BaseProcedureId`](../../../../type-aliases/BaseProcedureId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:178](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L178)

The base procedure ID within the source.

***

### category?

> `readonly` `optional` **category**: [`ProcedureType`](../../../../type-aliases/ProcedureType.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:189](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L189)

Optional category this procedure applies to

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:186](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L186)

Optional description

***

### entity

> `readonly` **entity**: [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:233](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L233)

Gets the underlying procedure data entity

***

### id

> `readonly` **id**: [`ProcedureId`](../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:173](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L173)

The composite procedure ID (e.g., "common.ganache-basic").
Combines source and base ID for unique identification across sources.

***

### isCategorySpecific

> `readonly` **isCategorySpecific**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:218](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L218)

Whether this procedure is category-specific

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:183](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L183)

Human-readable name

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:198](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L198)

Optional categorized notes

***

### stepCount

> `readonly` **stepCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:215](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L215)

Number of steps

***

### steps

> `readonly` **steps**: readonly [`IProcedureStepEntity`](../../Entities/interfaces/IProcedureStepEntity.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:192](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L192)

Steps of the procedure in order

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:195](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L195)

Optional tags

***

### totalActiveTime

> `readonly` **totalActiveTime**: [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:203](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L203)

Total active time for all steps

***

### totalHoldTime

> `readonly` **totalHoldTime**: [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:209](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L209)

Total hold time for all steps

***

### totalTime

> `readonly` **totalTime**: [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:212](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L212)

Total time (active + wait + hold)

***

### totalWaitTime

> `readonly` **totalWaitTime**: [`Minutes`](../../../../type-aliases/Minutes.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:206](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L206)

Total wait time for all steps

## Methods

### render()

> **render**(`context`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRenderedProcedure`](IRenderedProcedure.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/procedures/model.ts:228](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/procedures/model.ts#L228)

Renders the procedure with the given context.
Resolves task references to actual task content (not placeholders).

#### Parameters

##### context

[`IProcedureRenderContext`](IProcedureRenderContext.md)

The render context with recipe and library access

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRenderedProcedure`](IRenderedProcedure.md)\>

Success with rendered procedure, or Failure if rendering fails
