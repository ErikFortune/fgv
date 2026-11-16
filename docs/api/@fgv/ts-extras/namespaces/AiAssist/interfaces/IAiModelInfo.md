[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiModelInfo

# Interface: IAiModelInfo

Information about a single model returned by a provider's list endpoint,
with capabilities already resolved (native + config rules).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities` | `readonly` | `ReadonlySet`\<[`AiModelCapability`](../type-aliases/AiModelCapability.md)\> | Resolved capability set — union of native declarations and config rules. |
| <a id="property-displayname"></a> `displayName?` | `readonly` | `string` | Friendly name for display, when known. |
| <a id="property-id"></a> `id` | `readonly` | `string` | Provider-native model identifier. |
