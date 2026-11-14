[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiToolEnablement

# Interface: IAiToolEnablement

Declares a tool as enabled/disabled in provider settings.
Tools are disabled by default — consuming apps must opt in explicitly.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-config"></a> `config?` | `readonly` | [`IAiWebSearchToolConfig`](IAiWebSearchToolConfig.md) | Optional tool-specific configuration. |
| <a id="property-enabled"></a> `enabled` | `readonly` | `boolean` | Whether this tool is enabled by default for this provider. |
| <a id="property-type"></a> `type` | `readonly` | `"web_search"` | Which tool type. |
