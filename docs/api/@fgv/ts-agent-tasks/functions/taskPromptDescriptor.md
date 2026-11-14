[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / taskPromptDescriptor

# Function: taskPromptDescriptor()

> **taskPromptDescriptor**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`IPromptDescriptor`\>

Builds a free-text prompt descriptor declaring the host's slots and the task-context slot.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ITaskPromptDescriptorParams`](../interfaces/ITaskPromptDescriptorParams.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`IPromptDescriptor`\>

## Remarks

Fails when two slots share a name.
