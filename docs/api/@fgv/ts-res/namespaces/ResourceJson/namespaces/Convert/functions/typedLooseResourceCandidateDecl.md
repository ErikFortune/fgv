[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Convert](../README.md) / typedLooseResourceCandidateDecl

# Function: typedLooseResourceCandidateDecl()

> **typedLooseResourceCandidateDecl**\<`TQualifierNames`\>(`qualifierNameConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ILooseResourceCandidateDecl`](../../Json/interfaces/ILooseResourceCandidateDecl.md)\<`TQualifierNames`\>\>

Returns a `Converter` for a `Json.ILooseResourceCandidateDecl<TQualifierNames>`
narrowed on a supplied `qualifierName` converter.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `qualifierNameConverter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TQualifierNames`\> |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ILooseResourceCandidateDecl`](../../Json/interfaces/ILooseResourceCandidateDecl.md)\<`TQualifierNames`\>\>
