[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Normalized](../README.md) / ILooseResourceDecl

# Interface: ILooseResourceDecl

Normalized non-validated loose declaration of a [resource](../../../../../classes/Resource.md).

## Extends

- [`IChildResourceDecl`](IChildResourceDecl.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="candidates"></a> `candidates?` | `readonly` | readonly [`IChildResourceCandidateDecl`](IChildResourceCandidateDecl.md)[] | Possible candidates for this value. |
| <a id="id"></a> `id` | `readonly` | `string` | The id of the resource. |
| <a id="resourcetypename"></a> `resourceTypeName` | `readonly` | `string` | The name of the type of this resource. |
