[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveImageOptions

# Function: resolveImageOptions()

> **resolveImageOptions**(`modelId`, `capability`, `options`): [`IResolvedImageOptions`](../interfaces/IResolvedImageOptions.md)

Resolves the merged image options for a given model and capability.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `modelId` | `string` | The resolved model string |
| `capability` | [`IAiImageModelCapability`](../interfaces/IAiImageModelCapability.md) | The resolved IAiImageModelCapability for this model |
| `options` | [`IAiImageGenerationOptions`](../interfaces/IAiImageGenerationOptions.md) \| `undefined` | Caller-supplied options |

## Returns

[`IResolvedImageOptions`](../interfaces/IResolvedImageOptions.md)

The merged wire parameters

## Remarks

**Merge precedence (later wins):**
1. Generic top-level options (size, count, quality, seed)
2. Family-generic blocks (models field omitted, provider matches)
3. Model-specific blocks (models array includes the resolved model name)
4. Other blocks (provider: 'other', models array includes model name)

Provider-mismatch blocks are silently skipped.

Within each tier, declaration order — later declaration wins.
