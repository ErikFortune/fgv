[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ICommandResolution

# Interface: ICommandResolution

What the pump did with one unsettled command.

## Remarks

- `dispatched` — an intent that had never been sent was sent (after re-authorization).
- `resolved` — a lookup or a deduplicated resend settled it.
- `held` — outcome unknown and a resend is not safe (no source-key idempotency, or the key
  expired); left for source or host resolution.
- `denied` — the pump's principal may not run it; left as it is.
- `unavailable` — the source could not be reached; left as it is.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-action"></a> `action` | `readonly` | `"denied"` \| `"unavailable"` \| `"resolved"` \| `"dispatched"` \| `"held"` |
| <a id="property-operationid"></a> `operationId` | `readonly` | [`OperationId`](../type-aliases/OperationId.md) |
| <a id="property-result"></a> `result?` | `readonly` | [`CommandState`](../type-aliases/CommandState.md) |
| <a id="property-taskid"></a> `taskId` | `readonly` | [`TaskId`](../type-aliases/TaskId.md) |
