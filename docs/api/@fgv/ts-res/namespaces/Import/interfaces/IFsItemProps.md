[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Import](../README.md) / IFsItemProps

# Interface: IFsItemProps

Interface describing some single file system item.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-basename"></a> `baseName` | `readonly` | `string` | The base name of the file system item, once any conditions set tokens have been removed. |
| <a id="property-conditions"></a> `conditions` | `readonly` | [`IValidatedConditionDecl`](../../Conditions/interfaces/IValidatedConditionDecl.md)[] | [Conditions](../../Conditions/interfaces/IValidatedConditionDecl.md) extracted from the base name of the [FsItem](../classes/FsItem.md). |
| <a id="property-item"></a> `item` | `readonly` | [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The underlying `FileTreeItem` for this item. |
