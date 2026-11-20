[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptFileContents

# Interface: IPromptFileContents\<TQualifierNames\>

Shape of a `<prompt-id>.yaml` file body: the descriptor metadata plus the
candidates array (scope is reconstructed by the store from the directory
path).

## Remarks

Parameterized on `TQualifierNames extends string = string` (B-3); the
parameter threads through `candidates` so a typed loader produces
narrowed records. Default `TQualifierNames = string` keeps untyped
callers compiling unchanged.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-candidates"></a> `candidates` | `readonly` | readonly [`IPromptCandidateRecord`](IPromptCandidateRecord.md)\<`TQualifierNames`\>[] |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IPromptDescriptor`](IPromptDescriptor.md) |
