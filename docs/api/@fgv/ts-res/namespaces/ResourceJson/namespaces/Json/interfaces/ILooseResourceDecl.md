[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / ILooseResourceDecl

# Interface: ILooseResourceDecl\<TQualifierNames\>

Non-validated loose declaration of a [resource](../../../../../classes/Resource.md).

## Remarks

Parameterized on `TQualifierNames`; inherits via `IChildResourceDecl`.
Defaults to `string` for back-compat.

## Extends

- [`IChildResourceDecl`](IChildResourceDecl.md)\<`TQualifierNames`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-candidates"></a> `candidates?` | `readonly` | readonly [`IChildResourceCandidateDecl`](IChildResourceCandidateDecl.md)\<`TQualifierNames`\>[] | Possible candidates for this value. |
| <a id="property-id"></a> `id` | `readonly` | `string` | The id of the resource. |
| <a id="property-resourcetypename"></a> `resourceTypeName` | `readonly` | `string` | The name of the type of this resource. |
