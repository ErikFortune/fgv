[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / SecretProvider

# Type Alias: SecretProvider()

> **SecretProvider** = (`secretName`) => `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:408](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L408)

Function type for providing encryption keys by secret name.
Used for dynamic key lookup (e.g., from environment variables or key stores).

## Parameters

### secretName

`string`

## Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\>\>
