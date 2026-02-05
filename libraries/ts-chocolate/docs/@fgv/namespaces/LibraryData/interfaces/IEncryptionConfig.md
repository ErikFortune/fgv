[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IEncryptionConfig

# Interface: IEncryptionConfig

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:414](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L414)

Configuration for handling encrypted collections during loading.

## Properties

### cryptoProvider

> `readonly` **cryptoProvider**: [`ICryptoProvider`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:431](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L431)

The crypto provider to use for decryption.
Use `nodeCryptoProvider` for Node.js or `BrowserCryptoProvider` for browsers.

***

### onDecryptionError?

> `readonly` `optional` **onDecryptionError**: [`EncryptedFileErrorMode`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:447](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L447)

How to handle decryption errors (e.g., wrong key, corrupted data).
- `'fail'` (default): Fail the entire load operation.
- `'skip'`: Skip the file and continue loading other files.
- `'warn'`: Log a warning and skip the file.

***

### onMissingKey?

> `readonly` `optional` **onMissingKey**: [`EncryptedFileErrorMode`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:439](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L439)

How to handle encrypted files when the required secret is not available.
- `'fail'` (default): Fail the entire load operation.
- `'skip'`: Skip the encrypted file and continue loading other files.
- `'warn'`: Log a warning and skip the encrypted file.

***

### secretProvider?

> `readonly` `optional` **secretProvider**: [`SecretProvider`](../type-aliases/SecretProvider.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:425](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L425)

Optional function to dynamically provide keys by secret name.
Called when a secret is not found in the `secrets` array.

***

### secrets?

> `readonly` `optional` **secrets**: readonly [`INamedSecret`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)[]

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:419](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L419)

Array of named secrets to use for decryption.
Each secret has a name and a 32-byte key for AES-256 encryption.
