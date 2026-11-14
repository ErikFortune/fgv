[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IChildResourceDecl

# Interface: IChildResourceDecl\<TQualifierNames\>

Non-validated child declaration of a [resource](../../../../../classes/Resource.md).

## Remarks

Parameterized on `TQualifierNames` so the `candidates` field threads the
narrowed axis-name set down to each candidate. Defaults to `string` for
back-compat.

## Extended by

- [`ILooseResourceDecl`](ILooseResourceDecl.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-candidates"></a> `candidates?` | `readonly` | readonly [`IChildResourceCandidateDecl`](IChildResourceCandidateDecl.md)\<`TQualifierNames`\>[] | Possible candidates for this value. |
| <a id="property-resourcetypename"></a> `resourceTypeName` | `readonly` | `string` | The name of the type of this resource. |
