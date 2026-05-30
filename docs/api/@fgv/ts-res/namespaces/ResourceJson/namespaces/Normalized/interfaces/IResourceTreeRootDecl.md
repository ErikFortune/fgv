[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Normalized](../README.md) / IResourceTreeRootDecl

# Interface: IResourceTreeRootDecl

Normalized non-validated declaration of a [resource](../../../../../classes/Resource.md) tree root.

## Extends

- [`IResourceTreeChildNodeDecl`](IResourceTreeChildNodeDecl.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="children"></a> `children?` | `readonly` | `Record`\<`string`, [`IResourceTreeChildNodeDecl`](IResourceTreeChildNodeDecl.md)\> |
| <a id="context"></a> `context?` | `readonly` | [`IContainerContextDecl`](IContainerContextDecl.md) |
| <a id="metadata"></a> `metadata?` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| <a id="resources"></a> `resources?` | `readonly` | `Record`\<`string`, [`IChildResourceDecl`](IChildResourceDecl.md)\> |
