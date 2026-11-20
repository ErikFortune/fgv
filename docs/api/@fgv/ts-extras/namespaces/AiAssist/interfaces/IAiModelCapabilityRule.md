[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiModelCapabilityRule

# Interface: IAiModelCapabilityRule

One rule in an [IAiModelCapabilityConfig](IAiModelCapabilityConfig.md). Multiple rules can match
a single model — their capability arrays are unioned.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities` | `readonly` | readonly [`AiModelCapability`](../type-aliases/AiModelCapability.md)[] | Capabilities this rule attributes to matching models. |
| <a id="property-displayname"></a> `displayName?` | `readonly` | `string` \| ((`id`) => `string`) | Friendly display-name override for matching models. The function form lets one rule format many ids (e.g. `(id) => id.toUpperCase()`). If multiple matching rules supply `displayName`, the first match wins. |
| <a id="property-idpattern"></a> `idPattern` | `readonly` | `RegExp` | RegExp tested against the model id (using `.test`). |
