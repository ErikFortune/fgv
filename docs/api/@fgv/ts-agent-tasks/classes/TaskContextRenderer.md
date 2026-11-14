[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskContextRenderer

# Class: TaskContextRenderer

Renders task context: deterministic selection, bounded framed text, and an honest pure
inclusion receipt.

## Remarks

The renderer has no repository, no clock, no ID factory, no random source, no checkpoint
store and no logger — there is nothing for it to write to. Its only injected dependency is
the host's disclosure projection. Every input is validated before anything is rendered,
and every projection result is validated again.

What a receipt claims is exactly what the text holds: an entry per rendered task revision,
and an update ID only where that update's complete payload was rendered.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-converters"></a> `converters` | `public readonly` | [`TaskConverters`](TaskConverters.md) | The converters validating this renderer's input. |
| <a id="property-framingreserve"></a> `framingReserve` | `public readonly` | `number` | Characters every rendering reserves for framing and the omission report before any record is selected. A budget whose `maxChars` is below this is rejected. |

## Methods

### render()

> **render**(`input`, `budget?`): [`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskContext`](../interfaces/ITaskContext.md)\>

Renders `input` within `budget` (default [defaultTaskContextBudget](../variables/defaultTaskContextBudget.md)).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `input` | [`ITaskContextInput`](../interfaces/ITaskContextInput.md) |
| `budget?` | [`ITaskContextBudget`](../interfaces/ITaskContextBudget.md) |

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskContext`](../interfaces/ITaskContext.md)\>

#### Remarks

Fails `invalid` for malformed input, an impossible budget, a failing projection or a
cyclic parent chain; fails `conflict` when the input describes one revision two ways, or
carries two current revisions of one task.

***

### create()

> `static` **create**(`params?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskContextRenderer`\>

Creates a renderer. Pure: builds converters when none are supplied, and nothing else.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params?` | [`ITaskContextRendererCreateParams`](../interfaces/ITaskContextRendererCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskContextRenderer`\>
