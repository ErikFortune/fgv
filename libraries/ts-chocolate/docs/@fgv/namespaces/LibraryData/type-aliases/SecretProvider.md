[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / SecretProvider

# Type Alias: SecretProvider()

> **SecretProvider** = (`secretName`) => `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:408](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L408)

Function type for providing encryption keys by secret name.
Used for dynamic key lookup (e.g., from environment variables or key stores).

## Parameters

### secretName

`string`

## Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\>\>
