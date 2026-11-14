[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskPromptTemplateParams

# Interface: ITaskPromptTemplateParams

Parameters for [taskPromptTemplate](../functions/taskPromptTemplate.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-datarules"></a> `dataRules?` | `readonly` | `string` | Defaults to [taskDataInterpretationRules](../variables/taskDataInterpretationRules.md). |
| <a id="property-instructions"></a> `instructions` | `readonly` | `string` | The host's fixed, trusted instructions — literal text, the first thing in the body. |
| <a id="property-stableslots"></a> `stableSlots?` | `readonly` | readonly `SlotName`[] | Host slots placed, in this order, between the fixed text and the task context. Each should be declared with the stability its value actually has. |
| <a id="property-taskslot"></a> `taskSlot?` | `readonly` | `SlotName` | Defaults to [defaultTaskContextSlotName](../variables/defaultTaskContextSlotName.md). |
