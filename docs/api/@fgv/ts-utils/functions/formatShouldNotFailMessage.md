[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / \_formatShouldNotFailMessage

# Function: \_formatShouldNotFailMessage()

> **\_formatShouldNotFailMessage**(`originalMessage`, `label`, `frame`): `string`

**`Internal`**

Composes the error message thrown by `Result<T>.shouldNotFail` from the
captured frame and optional label.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `originalMessage` | `string` |
| `label` | `string` \| `undefined` |
| `frame` | [`_IShouldNotFailFrame`](../interfaces/IShouldNotFailFrame.md) |

## Returns

`string`
