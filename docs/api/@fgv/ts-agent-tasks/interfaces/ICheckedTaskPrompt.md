[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICheckedTaskPrompt

# Interface: ICheckedTaskPrompt

A prompt that passed every check, holding its context's receipt back until the host says what it
sent.

## Extends

- [`ITaskPromptCheck`](ITaskPromptCheck.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cacherequest"></a> `cacheRequest` | `readonly` | [`IAiCacheRequest`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) | The cache-breakpoint plan, derived from the same composition; offsets are into `system`. |
| <a id="property-resolved"></a> `resolved` | `readonly` | `IResolvedPrompt` | The resolve, with its composition — the one the checks below were made on. |
| <a id="property-stableprefixchars"></a> `stablePrefixChars` | `readonly` | `number` | Characters before the task slot: the intended stable prefix. Always more than zero. |
| <a id="property-system"></a> `system` | `readonly` | `string` | The system text to send: exactly the analyzed body. |
| <a id="property-taskslot"></a> `taskSlot` | `readonly` | [`ITaskPromptSlotSpan`](ITaskPromptSlotSpan.md) | The task-context slot: the last section, its text the context's text exactly. |
| <a id="property-threshold"></a> `threshold` | `readonly` | [`ITaskPromptThreshold`](ITaskPromptThreshold.md) | - |

## Methods

### receiptFor()

> **receiptFor**(`sentSystem`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskInclusionReceipt`](ITaskInclusionReceipt.md)\>

The context's inclusion receipt — only if `sentSystem` is exactly [ITaskPromptCheck.system](ITaskPromptCheck.md#property-system).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sentSystem` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ITaskInclusionReceipt`](ITaskInclusionReceipt.md)\>

#### Remarks

Any change after the check — a prefix, a suffix, an edited or dropped task slot — fails: the
receipt describes what the checked body carried, and a body that differs did not carry it.
