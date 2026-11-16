[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskContextSlotParams

# Interface: ITaskContextSlotParams

Parameters for [taskContextSlot](../functions/taskContextSlot.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | - |
| <a id="property-maxlength"></a> `maxLength?` | `readonly` | `number` | The slot's length cap, in UTF-16 code units. Defaults to the default context budget's `maxChars`: a slot shorter than the budget would make prompt-assist refuse a context the renderer considers within bounds. |
| <a id="property-name"></a> `name?` | `readonly` | `SlotName` | Defaults to [defaultTaskContextSlotName](../variables/defaultTaskContextSlotName.md). |
