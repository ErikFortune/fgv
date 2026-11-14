[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / ISaferFetchResponse

# Interface: ISaferFetchResponse\<T\>

A successful safer-fetch response.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-bytesread"></a> `bytesRead` | `readonly` | `number` | Decoded bytes read from the response body. |
| <a id="property-headers"></a> `headers` | `readonly` | `Readonly`\<`Record`\<`string`, `string`\>\> | Header names are lowercased. |
| <a id="property-status"></a> `status` | `readonly` | `number` | - |
| <a id="property-urlchain"></a> `urlChain` | `readonly` | readonly `string`[] | Every URL actually requested, in order, as cleared by the address guard. `[0]` is the caller's; later entries are redirect hops. A caller that allowlisted `api.example.com` and was redirected to `cdn.example.com` usually wants to know. |
| <a id="property-value"></a> `value` | `readonly` | `T` | - |
