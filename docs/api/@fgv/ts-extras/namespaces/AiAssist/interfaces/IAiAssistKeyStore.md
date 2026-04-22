[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiAssistKeyStore

# Interface: IAiAssistKeyStore

Minimal keystore interface for AI assist API key resolution.
Satisfied structurally by the concrete `KeyStore` class from `@fgv/ts-extras`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="isunlocked"></a> `isUnlocked` | `readonly` | `boolean` | Whether the keystore is currently unlocked |

## Methods

### getApiKey()

> **getApiKey**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Get an API key by secret name

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

***

### hasSecret()

> **hasSecret**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Check if a named secret exists

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>
