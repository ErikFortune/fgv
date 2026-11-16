[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / typedPromptFileConverter

# Function: typedPromptFileConverter()

> **typedPromptFileConverter**\<`TQualifierNames`\>(`qualifierNameConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPromptFileContents`](../interfaces/IPromptFileContents.md)\<`TQualifierNames`\>\>

Typed sibling of [promptFileConverter](../variables/promptFileConverter.md) (B-3). Routes the candidate
`conditions` validation through `ResourceJson.Convert.typedConditionSetDecl(qc)`
so typo'd axis names fail at convert time. Returned Converter narrows
its result type on `TQualifierNames`.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `qualifierNameConverter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TQualifierNames`\> |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPromptFileContents`](../interfaces/IPromptFileContents.md)\<`TQualifierNames`\>\>

## Remarks

Keep in sync with `promptFileConverter` above — both flow through
`_buildPromptFileContentsConverter`, so the body validation and the
`outputValidations`-on-free-text rejection cannot drift.
