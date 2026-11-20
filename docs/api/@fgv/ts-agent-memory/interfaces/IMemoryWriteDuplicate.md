[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryWriteDuplicate

# Interface: IMemoryWriteDuplicate

The detail of a conditional `put` refused because its content already exists under another id.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-code"></a> `code` | `readonly` | `"duplicate"` | Always `'duplicate'`. |
| <a id="property-existingid"></a> `existingId` | `readonly` | [`MemoryId`](../type-aliases/MemoryId.md) | The id of the existing record, in the same scope, that holds the content. |
