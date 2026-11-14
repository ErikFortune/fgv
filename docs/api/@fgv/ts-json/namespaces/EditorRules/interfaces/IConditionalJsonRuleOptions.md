[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [EditorRules](../README.md) / IConditionalJsonRuleOptions

# Interface: IConditionalJsonRuleOptions

Configuration options for the [ConditionalJsonEditorRule](../classes/ConditionalJsonEditorRule.md).

## Extends

- `Partial`\<[`IJsonEditorOptions`](../../../interfaces/IJsonEditorOptions.md)\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-context"></a> `context?` | [`IJsonContext`](../../../interfaces/IJsonContext.md) | - |
| <a id="property-flattenunconditionalvalues"></a> `flattenUnconditionalValues?` | `boolean` | If true (default) then properties with unconditional names (which start with !) are flattened. |
| <a id="property-merge"></a> `merge?` | [`IJsonEditorMergeOptions`](../../../interfaces/IJsonEditorMergeOptions.md) | - |
| <a id="property-validation"></a> `validation?` | [`IJsonEditorValidationOptions`](../../../interfaces/IJsonEditorValidationOptions.md) | - |
