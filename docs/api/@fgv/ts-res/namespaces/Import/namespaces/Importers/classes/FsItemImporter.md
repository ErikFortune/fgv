[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Import](../../../README.md) / [Importers](../README.md) / FsItemImporter

# Class: FsItemImporter

[Importer](../interfaces/IImporter.md) implementation which imports resources from a `FileTree`.

## Implements

- [`IImporter`](../interfaces/IImporter.md)

## Constructors

### Constructor

> `protected` **new FsItemImporter**(`params`): `FsItemImporter`

Protected constructor for the FsItemImporter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IFsItemImporterCreateParams`](../interfaces/IFsItemImporterCreateParams.md) | Parameters for creating the FsItemImporter. |

#### Returns

`FsItemImporter`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="filecontentconverter"></a> `fileContentConverter?` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../../../ts-res-ui-components/type-aliases/JsonValue.md), `unknown`\> | Optional converter used to parse raw file contents before they are exposed as JSON importables. |
| <a id="filecontentextensions"></a> `fileContentExtensions?` | `readonly` | readonly `string`[] | Optional list of file extensions which should be parsed using the file content converter. |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifier collector](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use for this importer. |
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

> `static` **create**(`params`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`FsItemImporter`\>

Creates a new FsItemImporter.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IFsItemImporterCreateParams`](../interfaces/IFsItemImporterCreateParams.md) | Parameters for creating the FsItemImporter. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`FsItemImporter`\>

`Success` with the new `FsItemImporter` if successful, `Failure` with an error message if not.
