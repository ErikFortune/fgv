[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryDeleteOptions

# Interface: IMemoryDeleteOptions

Options for [IMemoryStore.delete](IMemoryStore.md#delete).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-expected"></a> `expected?` | `readonly` | `number` | Delete only if the record (for a versioned kind, the entity's current version) still carries this `seq`. A record that has gone is a `conflict` with `current: 'absent'`. Same in-process guarantee as [IMemoryWriteOptions.expected](IMemoryWriteOptions.md#property-expected). |
