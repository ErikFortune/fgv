[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IStoredPromptRecord

# Interface: IStoredPromptRecord\<TQualifierNames\>

Stored prompt record returned by the store.

## Remarks

Parameterized on `TQualifierNames extends string = string` (B-3); the
parameter threads through `candidates` so a typed store produces
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
| <a id="property-id"></a> `id` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) |
| <a id="property-scope"></a> `scope` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) |
