[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptCandidateRecord

# Interface: IPromptCandidateRecord\<TQualifierNames\>

A stored candidate within an [IStoredPromptRecord](IStoredPromptRecord.md).

## Remarks

Parameterized on `TQualifierNames extends string = string` (B-3). The
`conditions` field threads the type parameter into ts-res's
parameterized `ResourceJson.Json.ConditionSetDecl<TQualifierNames>`, so
a consumer who threads a literal-string union (via the optional
`qualifierNameConverter` on `FileTreePromptStore.create` /
`PromptStoreFixture.build`) gets compile-time rejection of typo'd axis
names on the record form AND convert-time rejection in the YAML loader.
Default `TQualifierNames = string` keeps untyped callers compiling
unchanged.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-body"></a> `body` | `readonly` | `string` | - |
| <a id="property-conditions"></a> `conditions` | `readonly` | [`ConditionSetDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<`TQualifierNames`\> | Full ts-res `ConditionSetDecl` (record-sugar, record-with-details, or array form). Empty `\{\}` represents the unconditional base candidate. Parameterized on `TQualifierNames` so a narrowed call site gets compile-time discipline on the key set. |
| <a id="property-ispartial"></a> `isPartial?` | `readonly` | `boolean` | Aligned with ts-res's `resolveComposedResourceValue` semantic (design §10.2): `isPartial: true` marks a more-specific override that layers ONTO the full base; `isPartial: false` (or omitted) marks the full base body. The walk consumes ts-res's priority- descending order, collects partials until the first non-partial (full → stop), then reverses for the join so the base appears first and the most-specific override appears last. |
