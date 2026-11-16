[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IImporterResourceDecl

# Type Alias: IImporterResourceDecl\<TQualifierNames\>

> **IImporterResourceDecl**\<`TQualifierNames`\> = [`ILooseResourceDecl`](../interfaces/ILooseResourceDecl.md)\<`TQualifierNames`\> \| [`IChildResourceDecl`](../interfaces/IChildResourceDecl.md)\<`TQualifierNames`\>

Non-validated declaration of a resource for import,
which can be either a loose or child resource.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Remarks

Parameterized on `TQualifierNames`; defaults to `string` for back-compat.
