[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IFileTreePromptStoreCreateParams

# Interface: IFileTreePromptStoreCreateParams\<TQualifierNames\>

Parameters for [FileTreePromptStore.create](../classes/FileTreePromptStore.md#create).

## Remarks

Parameterized on `TQualifierNames extends string = string` (B-3). The
optional `qualifierNameConverter` threads through to the YAML loader
so candidate `conditions` keys are validated at convert time against
a consumer-supplied literal-string union. When omitted, the loader
uses today's default-string `ResourceJson.Convert.conditionSetDecl`
— existing call sites behave unchanged.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-qualifiernameconverter"></a> `qualifierNameConverter?` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TQualifierNames`, `unknown`\> | Optional ts-res qualifier-name Converter (B-3). When supplied, the YAML loader validates each candidate's `conditions` keys (record form) or `qualifierName` fields (array form) against the Converter's literal-string union via `ResourceJson.Convert.typedConditionSetDecl(qc)`. A typo'd axis name fails at convert time with a Converter-level error. When omitted, the loader keeps today's permissive default-string behavior. |
| <a id="property-root"></a> `root` | `readonly` | [`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Root directory under which scope-encoded sub-trees live. |
| <a id="property-scopedecoding"></a> `scopeDecoding?` | `readonly` | (`encoded`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`ScopeKey`](../type-aliases/ScopeKey.md)\> | Default: identity, validated against the path-safety contract. |
| <a id="property-scopeencoding"></a> `scopeEncoding?` | `readonly` | (`scope`) => [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\> | Default: identity (treat ScopeKey as path-safe). |
