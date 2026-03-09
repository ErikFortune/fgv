[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / IAiAssistKeyStore

# Interface: IAiAssistKeyStore

Minimal keystore interface for AI assist API key resolution.
Satisfied structurally by the concrete `KeyStore` class from `@fgv/ts-extras`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="isunlocked"></a> `isUnlocked` | `readonly` | `boolean` | Whether the keystore is currently unlocked |

## Methods

### getApiKey()

> **getApiKey**(`name`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Get an API key by secret name

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

***

### hasSecret()

> **hasSecret**(`name`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Check if a named secret exists

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>
