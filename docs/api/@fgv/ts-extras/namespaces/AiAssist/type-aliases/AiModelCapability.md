[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / AiModelCapability

# Type Alias: AiModelCapability

> **AiModelCapability** = `"chat"` \| `"tools"` \| `"vision"` \| `"image-generation"` \| `"thinking"` \| `"embedding"`

Capability vocabulary used to describe what a model can do. Used as both
a filter and as a tag in [AiAssist.IAiModelInfo.capabilities](../interfaces/IAiModelInfo.md#property-capabilities).

## Remarks

Adding a new capability is cheap; adding the *first* one after consumers
already exist forces churn. The initial vocabulary is intentionally broad
even though only `image-generation` is fully exercised today.
