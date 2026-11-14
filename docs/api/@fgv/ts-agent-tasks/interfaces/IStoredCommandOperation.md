[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IStoredCommandOperation

# Interface: IStoredCommandOperation

Stored evidence of one execution command: its dedup key, request and evolving receipt.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-awaiting"></a> `awaiting?` | `readonly` | [`ICommandAwaiting`](ICommandAwaiting.md) | What a `source-replay` source reported the command's effect as. The receipt stays `accepted` until the feed commits that revision — `applied`, in that same commit, when the feed's projection there matches the answer's; left `accepted` when it does not — or a later one. (T6: additive and optional — no record written before T6 carries it.) |
| <a id="property-dispatch"></a> `dispatch` | `readonly` | [`StoredCommandDispatch`](../type-aliases/StoredCommandDispatch.md) | - |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) | - |
| <a id="property-principalkey"></a> `principalKey` | `readonly` | `string` | - |
| <a id="property-receipt"></a> `receipt` | `readonly` | [`ICommandReceipt`](ICommandReceipt.md) | - |
| <a id="property-request"></a> `request` | `readonly` | [`ICommandRequest`](ICommandRequest.md) | - |
| <a id="property-stop"></a> `stop?` | `readonly` | [`IStopCommandMarker`](IStopCommandMarker.md) | Present on a cascade stop's command: the intent this command is an attempt of. Storage admits a marked command only as a live, not yet landed attempt of a latching intent, and a landing is recognized only when the id and the marker both match. (T9: additive and optional.) |
| <a id="property-type"></a> `type` | `readonly` | `"command"` | - |
