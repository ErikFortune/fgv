[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / buildStoredPromptRecord

# Function: buildStoredPromptRecord()

> **buildStoredPromptRecord**\<`TQualifierNames`\>(`scope`, `contents`): [`IStoredPromptRecord`](../interfaces/IStoredPromptRecord.md)\<`TQualifierNames`\>

Builds a fully-typed [IStoredPromptRecord](../interfaces/IStoredPromptRecord.md) from a parsed prompt file
and the scope key derived from the file's directory location.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`ScopeKey`](../type-aliases/ScopeKey.md) |
| `contents` | [`IPromptFileContents`](../interfaces/IPromptFileContents.md)\<`TQualifierNames`\> |

## Returns

[`IStoredPromptRecord`](../interfaces/IStoredPromptRecord.md)\<`TQualifierNames`\>

## Remarks

Parameterized on `TQualifierNames extends string = string` (B-3) so the
narrowed file-contents type threads through to the produced stored
record. Default `TQualifierNames = string` keeps untyped callers
compiling unchanged.
