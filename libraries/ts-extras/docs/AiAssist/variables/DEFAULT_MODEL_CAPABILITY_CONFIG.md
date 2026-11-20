[Home](../../README.md) > [AiAssist](../README.md) > DEFAULT_MODEL_CAPABILITY_CONFIG

# Variable: DEFAULT_MODEL_CAPABILITY_CONFIG

Default capability config used by `callProviderListModels` when callers
don't supply their own. Patterns are intentionally narrow — false
positives are worse than missing a model. Caller can override per call
via IProviderListModelsParams.capabilityConfig.

## Type

`IAiModelCapabilityConfig`
