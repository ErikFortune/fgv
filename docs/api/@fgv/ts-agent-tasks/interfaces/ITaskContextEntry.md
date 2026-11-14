[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskContextEntry

# Interface: ITaskContextEntry

One rendered task revision, as structured data alongside the text.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-depth"></a> `depth` | `readonly` | `number` | Depth in the visible task tree. |
| <a id="property-presentation"></a> `presentation` | `readonly` | [`TaskContextPresentation`](../type-aliases/TaskContextPresentation.md) | - |
| <a id="property-section"></a> `section` | `readonly` | [`TaskContextSection`](../type-aliases/TaskContextSection.md) | - |
| <a id="property-summary"></a> `summary` | `readonly` | [`ITaskSummary`](ITaskSummary.md) | The projected summary that was rendered. |
| <a id="property-updateids"></a> `updateIds` | `readonly` | readonly [`UpdateId`](../type-aliases/UpdateId.md)[] | The update IDs this entry delivered — the same list as its receipt entry. |
