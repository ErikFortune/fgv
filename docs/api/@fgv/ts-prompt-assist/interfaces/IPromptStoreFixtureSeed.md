[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptStoreFixtureSeed

# Interface: IPromptStoreFixtureSeed\<TQualifierNames\>

Seed describing the in-memory FileTree state for a test fixture.

## Remarks

Parameterized on `TQualifierNames extends string` (B-3). When
`PromptStoreFixture.build` infers `TQualifierNames` from a typed
call site (e.g. an `IPromptStoreFixtureSeed<'tone'>` annotation, or
via the inferring `build<TQualifierNames>(seed)` signature), the
candidates' `conditions` keys are narrowed to that union. Pair with
`qualifierNameConverter` for round-trip convert-time enforcement —
the build threads the Converter through to
`FileTreePromptStore.create`, so a YAML round-trip carrying a typo'd
axis name fails at load time. Default `TQualifierNames = string`
keeps existing call sites working unchanged.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-bindings"></a> `bindings?` | `readonly` | readonly [`IScopeSlotBindingsRecord`](IScopeSlotBindingsRecord.md)[] | - |
| <a id="property-qualifiernameconverter"></a> `qualifierNameConverter?` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TQualifierNames`, `unknown`\> | Optional ts-res qualifier-name Converter (B-3). When supplied, the build threads it into `FileTreePromptStore.create` so the YAML loader validates each candidate's `conditions` keys at convert time against the Converter's literal-string union. A YAML record with a typo'd axis name fails at load time with a Converter-level error, mirroring the compile-time discipline the seed type already imposes when `TQualifierNames` is narrowed. When omitted, the loader keeps today's permissive default-string behavior. |
| <a id="property-qualifiers"></a> `qualifiers?` | `readonly` | readonly [`IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)[] | - |
| <a id="property-records"></a> `records?` | `readonly` | readonly [`IPromptStoreFixtureSeedRecord`](IPromptStoreFixtureSeedRecord.md)\<`TQualifierNames`\>[] | - |
| <a id="property-scopedecoding"></a> `scopeDecoding?` | `readonly` | (`encoded`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ScopeKey`](../type-aliases/ScopeKey.md)\> | Optional scope decoder. Defaults to identity (path-safety enforced via [defaultScopeDecoding](../functions/defaultScopeDecoding.md)). When `scopeEncoding` is non- identity, supplying a paired `scopeDecoding` is REQUIRED — otherwise `store.list()` (and any operation that walks directory names back to `ScopeKey`s) will round-trip incorrectly. |
| <a id="property-scopeencoding"></a> `scopeEncoding?` | `readonly` | (`scope`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\> | Optional scope encoder. Defaults to identity (path-safety enforced via [defaultScopeEncoding](../functions/defaultScopeEncoding.md)). |
