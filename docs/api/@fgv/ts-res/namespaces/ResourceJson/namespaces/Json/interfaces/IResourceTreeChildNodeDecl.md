[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IResourceTreeChildNodeDecl

# Interface: IResourceTreeChildNodeDecl\<TQualifierNames\>

Normalized non-validated declaration of a [resource](../../../../../classes/Resource.md) tree node.

## Remarks

Parameterized on `TQualifierNames` so the `resources` and `children` fields
thread the narrowed axis-name set throughout the tree. Defaults to `string` for
back-compat.

## Extended by

- [`IResourceTreeRootDecl`](IResourceTreeRootDecl.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-children"></a> `children?` | `readonly` | `Record`\<`string`, `IResourceTreeChildNodeDecl`\<`TQualifierNames`\>\> |
| <a id="property-resources"></a> `resources?` | `readonly` | `Record`\<`string`, [`IChildResourceDecl`](IChildResourceDecl.md)\<`TQualifierNames`\>\> |
