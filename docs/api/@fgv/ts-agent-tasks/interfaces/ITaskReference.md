[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskReference

# Interface: ITaskReference

An opaque host-owned reference carried alongside a task — an artifact, or something
wanting attention.

## Remarks

A reference carries identity only. It is never automatic permission to dereference
whatever it names, and the library never dereferences one. Waiting state carries
exactly these and nothing more: there is no input-request or answer protocol.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-key"></a> `key` | `readonly` | `string` |
| <a id="property-namespace"></a> `namespace` | `readonly` | `string` |
