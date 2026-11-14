[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskContextOmissions

# Interface: ITaskContextOmissions

What a rendered context left out of what it was given.

## Remarks

Counts cover only what the host supplied. Nothing hidden is counted, and nothing is
inferred about what an omitted or unsupplied item would have said.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-abbreviated"></a> `abbreviated` | `readonly` | `number` | Items rendered in abbreviated form. |
| <a id="property-exhaustive"></a> `exhaustive` | `readonly` | `boolean` | True only when the input was complete and every supplied item was rendered in full. An abbreviated item makes a context non-exhaustive, and reports the `text` reason. |
| <a id="property-reasons"></a> `reasons` | `readonly` | readonly [`TaskContextOmissionReason`](../type-aliases/TaskContextOmissionReason.md)[] | The distinct reasons that applied, in a fixed order. |
| <a id="property-requiredupdates"></a> `requiredUpdates` | `readonly` | `number` | Required updates whose IDs are absent from the receipt — omitted or abbreviated. |
| <a id="property-visibleitems"></a> `visibleItems` | `readonly` | `number` | Supplied items (task revisions and unresolved diagnostics) not rendered in any form. |
