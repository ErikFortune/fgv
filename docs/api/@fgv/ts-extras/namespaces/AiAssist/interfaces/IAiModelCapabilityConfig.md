[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiModelCapabilityConfig

# Interface: IAiModelCapabilityConfig

Configuration that maps model id patterns to capabilities. Used to
augment (or, where the provider supplies no capability info, fully
derive) the capability set for each listed model.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-global"></a> `global?` | `readonly` | readonly [`IAiModelCapabilityRule`](IAiModelCapabilityRule.md)[] | Cross-provider fallback rules. |
| <a id="property-perprovider"></a> `perProvider?` | `readonly` | `object` | Per-provider rules. Tried before [AiAssist.IAiModelCapabilityConfig.global](#property-global). |
| `perProvider.anthropic?` | `public` | readonly [`IAiModelCapabilityRule`](IAiModelCapabilityRule.md)[] | - |
| `perProvider.copy-paste?` | `public` | readonly [`IAiModelCapabilityRule`](IAiModelCapabilityRule.md)[] | - |
| `perProvider.google-gemini?` | `public` | readonly [`IAiModelCapabilityRule`](IAiModelCapabilityRule.md)[] | - |
| `perProvider.groq?` | `public` | readonly [`IAiModelCapabilityRule`](IAiModelCapabilityRule.md)[] | - |
| `perProvider.mistral?` | `public` | readonly [`IAiModelCapabilityRule`](IAiModelCapabilityRule.md)[] | - |
| `perProvider.ollama?` | `public` | readonly [`IAiModelCapabilityRule`](IAiModelCapabilityRule.md)[] | - |
| `perProvider.openai?` | `public` | readonly [`IAiModelCapabilityRule`](IAiModelCapabilityRule.md)[] | - |
| `perProvider.openai-compat?` | `public` | readonly [`IAiModelCapabilityRule`](IAiModelCapabilityRule.md)[] | - |
| `perProvider.xai-grok?` | `public` | readonly [`IAiModelCapabilityRule`](IAiModelCapabilityRule.md)[] | - |
