[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / createTaskCommandHandle

# Function: createTaskCommandHandle()

> **createTaskCommandHandle**\<`P`\>(`descriptor`): [`ITaskCommandHandle`](../interfaces/ITaskCommandHandle.md)

Erases a typed [ITaskCommandDescriptor](../interfaces/ITaskCommandDescriptor.md) into an [ITaskCommandHandle](../interfaces/ITaskCommandHandle.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-p"></a> `P` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor` | [`ITaskCommandDescriptor`](../interfaces/ITaskCommandDescriptor.md)\<`P`\> |

## Returns

[`ITaskCommandHandle`](../interfaces/ITaskCommandHandle.md)

## Remarks

This is the single point at which a command's parameter type leaves the type system,
and it leaves through a closure rather than a cast: `validate` captures the
descriptor's own schema and encoder, so the only way to produce canonical parameters
is to have passed that schema. `parameters` exposes the schema itself, erased to
`unknown` — readable as a wire schema and usable as a validator, but never a source of
canonical parameters, which only `validate` produces.
