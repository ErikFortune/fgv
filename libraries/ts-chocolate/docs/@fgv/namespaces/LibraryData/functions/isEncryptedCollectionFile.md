[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / isEncryptedCollectionFile

# Function: isEncryptedCollectionFile()

> **isEncryptedCollectionFile**(`json`): `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:64](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L64)

Checks if a JSON object appears to be an encrypted collection file.
Uses the format field as a discriminator.

## Parameters

### json

`unknown`

JSON object to check

## Returns

`boolean`

true if the object has the encrypted file format field
