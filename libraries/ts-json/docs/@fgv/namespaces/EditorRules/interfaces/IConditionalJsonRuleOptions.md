[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [EditorRules](../README.md) / IConditionalJsonRuleOptions

# Interface: IConditionalJsonRuleOptions

Configuration options for the [ConditionalJsonEditorRule](../classes/ConditionalJsonEditorRule.md).

## Extends

- `Partial`\<[`IJsonEditorOptions`](../../../../interfaces/IJsonEditorOptions.md)\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="context"></a> `context?` | [`IJsonContext`](../../../../interfaces/IJsonContext.md) | - |
| <a id="flattenunconditionalvalues"></a> `flattenUnconditionalValues?` | `boolean` | If true (default) then properties with unconditional names (which start with !) are flattened. |
| <a id="merge"></a> `merge?` | [`IJsonEditorMergeOptions`](../../../../interfaces/IJsonEditorMergeOptions.md) | - |
| <a id="validation"></a> `validation?` | [`IJsonEditorValidationOptions`](../../../../interfaces/IJsonEditorValidationOptions.md) | - |
