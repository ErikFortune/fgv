[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / DEFAULT\_MODEL\_CAPABILITY\_CONFIG

# Variable: DEFAULT\_MODEL\_CAPABILITY\_CONFIG

> `const` **DEFAULT\_MODEL\_CAPABILITY\_CONFIG**: [`IAiModelCapabilityConfig`](../interfaces/IAiModelCapabilityConfig.md)

Default capability config used by `callProviderListModels` when callers
don't supply their own. Patterns are intentionally narrow — false
positives are worse than missing a model. Caller can override per call
via [IProviderListModelsParams.capabilityConfig](../interfaces/IProviderListModelsParams.md#property-capabilityconfig).
