[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IResourceTreeRootDecl

# Interface: IResourceTreeRootDecl\<TQualifierNames\>

Normalized non-validated declaration of a [resource](../../../../../classes/Resource.md) tree root.

## Remarks

Parameterized on `TQualifierNames` so the `context` field threads the
narrowed axis-name set to the tree root context. Defaults to `string` for
back-compat.

## Extends

- [`IResourceTreeChildNodeDecl`](IResourceTreeChildNodeDecl.md)\<`TQualifierNames`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-children"></a> `children?` | `readonly` | `Record`\<`string`, [`IResourceTreeChildNodeDecl`](IResourceTreeChildNodeDecl.md)\<`TQualifierNames`\>\> |
| <a id="property-context"></a> `context?` | `readonly` | [`IContainerContextDecl`](IContainerContextDecl.md)\<`TQualifierNames`\> |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| <a id="property-resources"></a> `resources?` | `readonly` | `Record`\<`string`, [`IChildResourceDecl`](IChildResourceDecl.md)\<`TQualifierNames`\>\> |
