[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / JsonDropZone

# Function: JsonDropZone()

> **JsonDropZone**\<`T`\>(`props`): `ReactElement`

Generic JSON drop/paste target with converter-based validation.
Accepts text via drag-and-drop or paste, strips markdown code fences,
parses as JSON, validates through the provided converter, and calls
the appropriate callback.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The expected validated type |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`IJsonDropZoneProps`](../interfaces/IJsonDropZoneProps.md)\<`T`\> |

## Returns

`ReactElement`
