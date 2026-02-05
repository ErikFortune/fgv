[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / EncryptedFileHandling

# Type Alias: EncryptedFileHandling

> **EncryptedFileHandling** = `"fail"` \| `"skip"` \| `"warn"` \| `"capture"`

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:86](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L86)

How to handle encrypted files in synchronous loading.
- `'fail'`: Fail the entire load operation (original behavior)
- `'skip'`: Silently skip encrypted files
- `'warn'`: Log warning and skip encrypted files
- `'capture'`: Capture encrypted files for later decryption (default)
