[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptStoreFixtureSeedRecord

# Interface: IPromptStoreFixtureSeedRecord\<TQualifierNames\>

Fixture-seed-only record shape: descriptor.id is optional and
defaults to the outer record id (per F12). Candidate `conditions`
keys are narrowed by `TQualifierNames` (B-3) so typo'd axis names
fail at compile time when the seed is threaded through a
`TQualifierNames`-typed fixture build; pair with the
`qualifierNameConverter` (below) for convert-time enforcement of
the same narrow on round-tripped YAML. Default
`TQualifierNames = string` keeps unnarrowed seeds compiling
unchanged.

Other fields mirror [IStoredPromptRecord](IStoredPromptRecord.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-candidates"></a> `candidates` | `readonly` | readonly [`IPromptCandidateRecord`](IPromptCandidateRecord.md)\<`TQualifierNames`\>[] |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IPromptStoreFixtureDescriptor`](../type-aliases/IPromptStoreFixtureDescriptor.md) |
| <a id="property-id"></a> `id` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) |
| <a id="property-scope"></a> `scope` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) |
