[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ILoadCollectionFromFileTreeParams

# Interface: ILoadCollectionFromFileTreeParams\<TCOLLECTIONID\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:92](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L92)

Parameters used to load collections from a file tree.

## Extends

- `Omit`\<[`ICollectionFilterInitParams`](ICollectionFilterInitParams.md)\<`TCOLLECTIONID`\>, `"nameConverter"`\>

## Type Parameters

### TCOLLECTIONID

`TCOLLECTIONID` *extends* `string`

## Properties

### encryption?

> `readonly` `optional` **encryption**: [`IEncryptionConfig`](IEncryptionConfig.md)

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:104](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L104)

Optional encryption configuration for decrypting encrypted collection files.
If not provided, encrypted files will be treated as regular JSON (and likely fail validation).

***

### errorOnInvalidName?

> `readonly` `optional` **errorOnInvalidName**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:41](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L41)

#### Inherited from

`Omit.errorOnInvalidName`

***

### excluded?

> `readonly` `optional` **excluded**: readonly [`FilterPattern`](../type-aliases/FilterPattern.md)[]

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:39](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L39)

Patterns to exclude. Names matching any pattern are excluded (takes precedence over included).
Strings are matched exactly, RegExp patterns use `.test()`.

#### Inherited from

`Omit.excluded`

***

### included?

> `readonly` `optional` **included**: readonly [`FilterPattern`](../type-aliases/FilterPattern.md)[]

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:34](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L34)

Patterns to include. If specified, only names matching at least one pattern are included.
Strings are matched exactly, RegExp patterns use `.test()`.

#### Inherited from

`Omit.included`

***

### isBuiltIn?

> `readonly` `optional` **isBuiltIn**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:121](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L121)

Whether collections loaded from this source are built-in library data.
Used to mark protected collections appropriately when they are captured.
Defaults to `false`.

***

### mutable?

> `readonly` `optional` **mutable**: [`MutabilitySpec`](../type-aliases/MutabilitySpec.md)

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:99](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L99)

Overrides the default mutability specification for this load operation.
If not specified, uses the loader's default.

***

### onEncryptedFile?

> `readonly` `optional` **onEncryptedFile**: [`EncryptedFileHandling`](../type-aliases/EncryptedFileHandling.md)

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:115](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L115)

How to handle encrypted files in synchronous loading.
- `'fail'`: Fail the entire load operation
- `'skip'`: Silently skip encrypted files
- `'warn'`: Log warning and skip encrypted files
- `'capture'`: Capture encrypted files for later decryption (default)

Defaults to `'capture'` so encrypted files are tracked and can be decrypted
on-demand when keys become available.

***

### recurseWithDelimiter?

> `readonly` `optional` **recurseWithDelimiter**: `string`

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:94](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L94)
