[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Import](../../../README.md) / [Importers](../README.md) / JsonImporter

# Class: JsonImporter

[Importer](../interfaces/IImporter.md) implementation which imports resources from a JSON object.

## Implements

- [`IImporter`](../interfaces/IImporter.md)

## Constructors

### Constructor

> `protected` **new JsonImporter**(): `JsonImporter`

Protected JsonImporter constructor for derived classes.

#### Returns

`JsonImporter`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="types"></a> `types` | `readonly` | readonly `string`[] | The types of [importable](../../../type-aliases/Importable.md) items that this importer can process. |

## Methods

### import()

> **import**(`item`, `manager`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IImportable`](../../../interfaces/IImportable.md)[], [`ImporterResultDetail`](../type-aliases/ImporterResultDetail.md)\>

Imports an item, extracting any resources or candidates from it and returns an optional
list of additional importable items derived from it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`IImportable`](../../../interfaces/IImportable.md) | The [importable](../../../interfaces/IImportable.md) item to import. |
| `manager` | [`ResourceManagerBuilder`](../../../../../classes/ResourceManagerBuilder.md) | The [resource manager builder](../../../../../classes/ResourceManagerBuilder.md) to use for the import. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IImportable`](../../../interfaces/IImportable.md)[], [`ImporterResultDetail`](../type-aliases/ImporterResultDetail.md)\>

`Success` with a list of additional importable items derived from the original, or
`Failure` with an error message and a [result detail](../type-aliases/ImporterResultDetail.md).

#### Implementation of

[`IImporter`](../interfaces/IImporter.md).[`import`](../interfaces/IImporter.md#import)

***

### create()

> `static` **create**(): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`JsonImporter`\>

Creates a new JsonImporter instance.

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`JsonImporter`\>

`Success` with the new JsonImporter if successful,
`Failure` otherwise.
