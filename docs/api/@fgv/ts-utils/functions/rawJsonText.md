[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / \_rawJsonText

# Function: \_rawJsonText()

> **\_rawJsonText**(`value`, `json?`): `string` \| `undefined`

**`Internal`**

Reads `JSON.rawJSON` text when `json` supports raw JSON and `value` is one; `undefined` otherwise.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `object` | The object to inspect. |
| `json?` | [`IRawJsonSupport`](../interfaces/IRawJsonSupport.md) | The `JSON`-like object to consult; the real `JSON` by default. |

## Returns

`string` \| `undefined`
