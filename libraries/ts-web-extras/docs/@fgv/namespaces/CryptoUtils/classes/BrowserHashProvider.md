[**@fgv/ts-web-extras**](../../../../README.md)

***

[@fgv/ts-web-extras](../../../../README.md) / [CryptoUtils](../README.md) / BrowserHashProvider

# Class: BrowserHashProvider

Browser-compatible hash provider using the Web Crypto API.
Supports common hash algorithms available in browsers.

## Constructors

### Constructor

> **new BrowserHashProvider**(): `BrowserHashProvider`

#### Returns

`BrowserHashProvider`

## Methods

### hashParts()

> `static` **hashParts**(`parts`, `algorithm`, `separator`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>\>

Hash multiple strings concatenated with a separator.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `parts` | `string`[] | `undefined` | Array of strings to concatenate and hash |
| `algorithm` | `string` | `'SHA-256'` | The hash algorithm to use |
| `separator` | `string` | '\|' | Separator to use between parts (default: '|') |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>\>

Promise resolving to the hex-encoded hash

***

### hashString()

> `static` **hashString**(`data`, `algorithm`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>\>

Hash a string using the specified algorithm.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `data` | `string` | `undefined` | The string to hash |
| `algorithm` | `string` | `'SHA-256'` | The hash algorithm to use |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>\>

Promise resolving to the hex-encoded hash
