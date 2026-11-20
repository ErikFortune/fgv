[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveStructuredOutputCapability

# Function: resolveStructuredOutputCapability()

> **resolveStructuredOutputCapability**(`descriptor`, `modelId`): [`IAiStructuredOutputCapability`](../interfaces/IAiStructuredOutputCapability.md) \| `undefined`

The structured-output capability for `modelId` under `descriptor`, or
`undefined` when the model can enforce nothing.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor. |
| `modelId` | `string` | A concrete model id or an `@provider:role` alias. |

## Returns

[`IAiStructuredOutputCapability`](../interfaces/IAiStructuredOutputCapability.md) \| `undefined`

## Remarks

Alias-first, exactly like its `imageGeneration` / `embedding` siblings — an
unresolved alias returns `undefined` rather than prefix-matching a catch-all
`modelPrefix: ''`, which is the defect this helper was written to prevent.
