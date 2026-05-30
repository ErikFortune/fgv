[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Normalized](../README.md) / IResourceTreeChildNodeDecl

# Interface: IResourceTreeChildNodeDecl

Normalized non-validated declaration of a [resource](../../../../../classes/Resource.md) tree node.

## Extended by

- [`IResourceTreeRootDecl`](IResourceTreeRootDecl.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="children"></a> `children?` | `readonly` | `Record`\<`string`, `IResourceTreeChildNodeDecl`\> |
| <a id="resources"></a> `resources?` | `readonly` | `Record`\<`string`, [`IChildResourceDecl`](IChildResourceDecl.md)\> |
