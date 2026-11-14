[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICommandAwaiting

# Interface: ICommandAwaiting

The feed confirmation a `source-replay` command waits for: the revision its effect was reported
at, and a digest of the execution projection reported there.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-execution"></a> `execution` | `readonly` | `string` |
| <a id="property-revision"></a> `revision` | `readonly` | [`ISourceRevision`](ISourceRevision.md) |
