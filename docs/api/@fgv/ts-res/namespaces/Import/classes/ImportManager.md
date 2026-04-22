[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Import](../README.md) / ImportManager

# Class: ImportManager

Class to manage the import of resources from various sources.

## Constructors

### Constructor

> `protected` **new ImportManager**(`params`): `ImportManager`

Protected constructor for the ImportManager.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IImporterCreateParams`](../interfaces/IImporterCreateParams.md) | Parameters for creating the ImportManager. |

#### Returns

`ImportManager`

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="_importers"></a> `_importers` | `protected` | [`IImporter`](../namespaces/Importers/interfaces/IImporter.md)[] | `[]` | - |
| <a id="_stack"></a> `_stack` | `protected` | [`IImportable`](../interfaces/IImportable.md)[] | `[]` | - |
| <a id="initialcontext"></a> `initialContext` | `public` | [`ImportContext`](ImportContext.md) | `undefined` | The initial [import context](ImportContext.md) for the import operation. |
| <a id="resources"></a> `resources` | `readonly` | [`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md) | `undefined` | The [resource manager builder](../../../classes/ResourceManagerBuilder.md) into which resources will be imported. |

## Accessors

### importers

#### Get Signature

> **get** **importers**(): readonly [`IImporter`](../namespaces/Importers/interfaces/IImporter.md)[]

The list of [importers](../namespaces/Importers/interfaces/IImporter.md) to use for the
import operations.

##### Returns

readonly [`IImporter`](../namespaces/Importers/interfaces/IImporter.md)[]

## Methods

### \_import()

> **\_import**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportManager`\>

Imports any items on the import stack.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportManager`\>

`Success` with the ImportManager if successful,
or `Failure` with an error message if the import fails.

***

### import()

> **import**(`importable`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportManager`\>

Imports resources from an [importable](../interfaces/IImportable.md) object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `importable` | [`IImportable`](../interfaces/IImportable.md) | The [importable](../interfaces/IImportable.md) object to import. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportManager`\>

`Success` with the ImportManager if successful,
or `Failure` with an error message if the import fails.

***

### importFromFileSystem()

> **importFromFileSystem**(`filePath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportManager`\>

Imports resources from a file system path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path to import resources from. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportManager`\>

`Success` with the ImportManager if successful,
or `Failure` with an error message if the import fails.

***

### create()

> `static` **create**(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportManager`\>

Factory method to create a new ImportManager.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IImporterCreateParams`](../interfaces/IImporterCreateParams.md) | Parameters for creating the ImportManager. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`ImportManager`\>

`Success` with the new ImportManager
if successful, or `Failure` with an error message if creation fails.

***

### getDefaultImporters()

> `static` **getDefaultImporters**(`qualifiers`, `tree?`, `fileContentConverter?`, `fileContentExtensions?`): readonly [`IImporter`](../namespaces/Importers/interfaces/IImporter.md)[]

Gets the default importers using supplied [qualifiers](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md)
and optional `FileTree`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifiers](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use for the import. |
| `tree?` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\> | An optional `FileTree` for importing path items. |
| `fileContentConverter?` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md), `unknown`\> | An optional converter used to pre-process raw file contents before JSON import validation. |
| `fileContentExtensions?` | readonly `string`[] | Optional file extensions which should be parsed using the supplied file content converter. |

#### Returns

readonly [`IImporter`](../namespaces/Importers/interfaces/IImporter.md)[]

A read-only array of [importers](../namespaces/Importers/interfaces/IImporter.md).
