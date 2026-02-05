[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / EncryptedFileHandling

# Type Alias: EncryptedFileHandling

> **EncryptedFileHandling** = `"fail"` \| `"skip"` \| `"warn"` \| `"capture"`

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:86](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L86)

How to handle encrypted files in synchronous loading.
- `'fail'`: Fail the entire load operation (original behavior)
- `'skip'`: Silently skip encrypted files
- `'warn'`: Log warning and skip encrypted files
- `'capture'`: Capture encrypted files for later decryption (default)
