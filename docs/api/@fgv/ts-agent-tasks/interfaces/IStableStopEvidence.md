[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStableStopEvidence

# Interface: IStableStopEvidence

The evidence a confirmed external target's stability rests on: its source's declared stop
contract, and the source revision that confirmed the stopped state. Revalidated after every reopen
before satisfaction is presented — a contract that held before a restart is not evidence it holds
now.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-contractversion"></a> `contractVersion` | `readonly` | `string` |
| <a id="property-sourceid"></a> `sourceId` | `readonly` | `string` |
| <a id="property-sourcerevision"></a> `sourceRevision` | `readonly` | [`ISourceRevision`](ISourceRevision.md) |
