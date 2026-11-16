[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISourceBinding

# Interface: ISourceBinding

Binding from a task to the external source that executes it.

## Remarks

`reference` is opaque source-owned data, versioned independently of the task
envelope and of the task's detail schema.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-reference"></a> `reference` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |
| <a id="property-referenceversion"></a> `referenceVersion` | `readonly` | `number` |
| <a id="property-sourceid"></a> `sourceId` | `readonly` | `string` |
