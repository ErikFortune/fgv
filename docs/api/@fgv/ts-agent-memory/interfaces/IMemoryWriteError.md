[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryWriteError

# Interface: IMemoryWriteError

The detail of a write that failed for any other reason.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-code"></a> `code` | `readonly` | `"invalid"` \| `"rejected"` \| `"not-found"` \| `"io"` | The classification; see [MemoryWriteFailureCode](../type-aliases/MemoryWriteFailureCode.md). |
