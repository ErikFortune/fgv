[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskContext

# Interface: ITaskContext

A rendered task context: framed text, its structured view, and an inclusion receipt.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-diagnostics"></a> `diagnostics` | `readonly` | readonly [`ITaskContextDiagnostic`](ITaskContextDiagnostic.md)[] | The unresolved references rendered as diagnostics, reduced to what the text shows. |
| <a id="property-entries"></a> `entries` | `readonly` | readonly [`ITaskContextEntry`](ITaskContextEntry.md)[] | The task revisions rendered, in render order. |
| <a id="property-omissions"></a> `omissions` | `readonly` | [`ITaskContextOmissions`](ITaskContextOmissions.md) | - |
| <a id="property-receipt"></a> `receipt` | `readonly` | [`ITaskInclusionReceipt`](ITaskInclusionReceipt.md) | - |
| <a id="property-text"></a> `text` | `readonly` | `string` | The framed, escaped context text. Task prose inside it is data, not instruction. |
