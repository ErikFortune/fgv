[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Import](../README.md) / FsItem

# Class: FsItem

Class describing some file system item to be imported.

## Implements

- [`IFsItemProps`](../interfaces/IFsItemProps.md)

## Constructors

### Constructor

> `protected` **new FsItem**(`props`, `qualifiers`): `FsItem`

Protected constructor creates a new FsItem.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `props` | [`IFsItemProps`](../interfaces/IFsItemProps.md) | The [file system item properties](../interfaces/IFsItemProps.md) to use for this item. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifiers](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) used to parse embedded condition set tokens. |

#### Returns

`FsItem`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="basename"></a> `baseName` | `readonly` | `string` | The base name of the file system item, once any conditions set tokens have been removed. |
| <a id="conditions"></a> `conditions` | `readonly` | [`IValidatedConditionDecl`](../../Conditions/interfaces/IValidatedConditionDecl.md)[] | [Conditions](../../Conditions/interfaces/IValidatedConditionDecl.md) extracted from the base name of the FsItem. |
| <a id="item"></a> `item` | `readonly` | [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The underlying `FileTreeItem` for this item. |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifiers](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use for this item. |

## Methods

### getContext()

> **getContext**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ImportContext`](ImportContext.md)\>

Gets the context for this file system item.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ImportContext`](ImportContext.md)\>

`Success` containing the [import context](ImportContext.md) for this item
if successful, or a `Failure` containing an error message if an error occurs.

***

### createForItem()

> `static` **createForItem**(`item`, `qualifiers`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FsItem`, [`FsItemResultDetail`](../type-aliases/FsItemResultDetail.md)\>

Creates a new FsItem from a `FileTreeItem`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `item` | [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The `FileTreeItem` to import. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifiers](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) used to parse embedded condition set tokens. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FsItem`, [`FsItemResultDetail`](../type-aliases/FsItemResultDetail.md)\>

`Success` containing the new FsItem if successful, or a `Failure`
containing an error message if not.  Note that the result detail `skipped` indicates that the item
was not created because it is not relevant - this is a soft error that should be silently ignored.

***

### createForPath()

> `static` **createForPath**(`importPath`, `qualifiers`, `tree?`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FsItem`, [`FsItemResultDetail`](../type-aliases/FsItemResultDetail.md)\>

Creates a new FsItem from a file system path.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `importPath` | `string` | The path to the file system item to import. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifiers](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) used to parse embedded condition set tokens. |
| `tree?` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\> | An optional [file tree](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) to use for this item. |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FsItem`, [`FsItemResultDetail`](../type-aliases/FsItemResultDetail.md)\>

`Success` containing the new FsItem if an item is created
successfully, or a `Failure` containing an error message if it is not.  Note that the result detail
`skipped` indicates that the item was not created because it is not relevant - this is a soft error
that should be silently ignored.

***

### tryParseBaseName()

> `static` **tryParseBaseName**(`baseName`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Omit`\<[`IFsItemProps`](../interfaces/IFsItemProps.md), `"item"`\>\>

Tries to parse a base name into a base name and a set of conditions.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `baseName` | `string` | The base name to parse. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifiers](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) used to parse embedded condition set tokens. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Omit`\<[`IFsItemProps`](../interfaces/IFsItemProps.md), `"item"`\>\>

`Success` containing the parsed base name and conditions on success, or `Failure` containing
an error message if it is not.
