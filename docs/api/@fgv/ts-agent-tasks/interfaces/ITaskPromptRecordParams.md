[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskPromptRecordParams

# Interface: ITaskPromptRecordParams

Parameters for [taskPromptRecord](../functions/taskPromptRecord.md).

## Extends

- [`ITaskPromptDescriptorParams`](ITaskPromptDescriptorParams.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-datarules"></a> `dataRules?` | `readonly` | `string` | - |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - |
| <a id="property-id"></a> `id` | `readonly` | `PromptId` | - |
| <a id="property-instructions"></a> `instructions` | `readonly` | `string` | - |
| <a id="property-scope"></a> `scope` | `readonly` | `ScopeKey` | - |
| <a id="property-stableslots"></a> `stableSlots?` | `readonly` | readonly `IPromptSlot`[] | The host's slots, in template order. |
| <a id="property-surface"></a> `surface?` | `readonly` | `string` | Defaults to `'chat'`. |
| <a id="property-taskslot"></a> `taskSlot?` | `readonly` | `IPromptSlot` | Defaults to [taskContextSlot](../functions/taskContextSlot.md)`()`. |
| <a id="property-title"></a> `title` | `readonly` | `string` | - |
