[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / serializeTaskData

# Function: serializeTaskData()

> **serializeTaskData**(`value`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Serializes any JSON value as one line of JSON in which every string — keys included — is quoted
the way the renderer quotes task prose, so no character of task data can escape the frame it is
placed in.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

## Remarks

The published form of the escaping [TaskContextRenderer](../classes/TaskContextRenderer.md) applies to task prose, for task
data a host presents to a model outside the rendered text (`task_inspect`'s details). The result
parses back with `JSON.parse` to a value equal to the input, except that `undefined` object fields
are skipped as `JSON.stringify` skips them. A number that is not finite has no JSON form and
fails rather than becoming `null`; so does any value that is not JSON at all, and a value that
contains itself.
