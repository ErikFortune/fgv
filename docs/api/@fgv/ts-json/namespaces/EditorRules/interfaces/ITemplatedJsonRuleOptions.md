[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [EditorRules](../README.md) / ITemplatedJsonRuleOptions

# Interface: ITemplatedJsonRuleOptions

Configuration options for the [Templated JSON editor rule](../classes/TemplatedJsonEditorRule.md).

## Extends

- `Partial`\<[`IJsonEditorOptions`](../../../interfaces/IJsonEditorOptions.md)\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="context"></a> `context?` | [`IJsonContext`](../../../interfaces/IJsonContext.md) | - |
| <a id="merge"></a> `merge?` | [`IJsonEditorMergeOptions`](../../../interfaces/IJsonEditorMergeOptions.md) | - |
| <a id="usenametemplates"></a> `useNameTemplates?` | `boolean` | If `true` (default) then templates in property names are rendered |
| <a id="usevaluetemplates"></a> `useValueTemplates?` | `boolean` | If `true` (default) then templates in property values are rendered |
| <a id="validation"></a> `validation?` | [`IJsonEditorValidationOptions`](../../../interfaces/IJsonEditorValidationOptions.md) | - |
