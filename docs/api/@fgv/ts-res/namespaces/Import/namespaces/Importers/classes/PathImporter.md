[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Import](../../../README.md) / [Importers](../README.md) / PathImporter

# Class: PathImporter

[Importer](../interfaces/IImporter.md) implementation which imports resources from a `FileTree`
given a path.

## Implements

- [`IImporter`](../interfaces/IImporter.md)

## Constructors

### Constructor

> `protected` **new PathImporter**(`params`): `PathImporter`

Protected constructor for the PathImporter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IPathImporterCreateParams`](../interfaces/IPathImporterCreateParams.md) | Parameters for creating the PathImporter. |

#### Returns

`PathImporter`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="ignorefiletypes"></a> `ignoreFileTypes` | `readonly` | `string`[] | The types of files to ignore when importing. Any file not ignored is converted to an [IImportableFsItem](../../../interfaces/IImportableFsItem.md). |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifier collector](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use for this importer. |
| <a id="tree"></a> `tree` | `readonly` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `FileTree` from which resources will be imported. |
| <a id="types"></a> `types` | `readonly` | readonly `string`[] | The types of [importables](../../../interfaces/IImportable.md) that this importer can handle. |

## Methods

### \_getFileTreeItemFromImportable()

> `protected` **\_getFileTreeItemFromImportable**(`item`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FsItem`](../../../classes/FsItem.md), [`FsItemResultDetail`](../../../type-aliases/FsItemResultDetail.md)\>

Gets an [FsItem](../../../classes/FsItem.md) from an [importable](../../../interfaces/IImportable.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`IImportable`](../../../interfaces/IImportable.md) | The importable to convert. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FsItem`](../../../classes/FsItem.md), [`FsItemResultDetail`](../../../type-aliases/FsItemResultDetail.md)\>

`Success` containing the `FsItem` if successful, `Failure` with an error message if not.

***

### import()

> **import**(`item`, `__manager`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IImportable`](../../../interfaces/IImportable.md)[], [`ImporterResultDetail`](../type-aliases/ImporterResultDetail.md)\>

Imports an item, extracting any resources or candidates from it and returns an optional
list of additional importable items derived from it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`IImportable`](../../../interfaces/IImportable.md) | The [importable](../../../interfaces/IImportable.md) item to import. |
| `__manager` | [`ResourceManagerBuilder`](../../../../../classes/ResourceManagerBuilder.md) | The [resource manager builder](../../../../../classes/ResourceManagerBuilder.md) to use for the import. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IImportable`](../../../interfaces/IImportable.md)[], [`ImporterResultDetail`](../type-aliases/ImporterResultDetail.md)\>

`Success` with a list of additional importable items derived from the original, or
`Failure` with an error message and a [result detail](../type-aliases/ImporterResultDetail.md).

#### Implementation of

[`IImporter`](../interfaces/IImporter.md).[`import`](../interfaces/IImporter.md#import)

***

### create()

> `static` **create**(`params`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`PathImporter`\>

Creates a new PathImporter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IPathImporterCreateParams`](../interfaces/IPathImporterCreateParams.md) | Parameters for creating the dirPathImporter. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`PathImporter`\>

`Success` with the new `PathImporter` if successful, `Failure` with an error message if not.
