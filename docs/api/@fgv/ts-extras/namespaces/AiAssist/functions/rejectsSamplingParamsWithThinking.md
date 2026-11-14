[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / rejectsSamplingParamsWithThinking

# Function: rejectsSamplingParamsWithThinking()

> **rejectsSamplingParamsWithThinking**(`descriptor`, `modelId`): `boolean`

Whether a concrete (already-resolved) model restricts a caller-supplied `temperature` only while
reasoning, per the descriptor's
[IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes](../interfaces/IAiProviderDescriptor.md#property-samplingparamsrejectedwiththinkingmodelprefixes)
(exact-or-dash-bounded match).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor supplying the prefix list. |
| `modelId` | `string` | The resolved concrete model id to test. |

## Returns

`boolean`

`true` when `modelId` restricts `temperature` while reasoning.

## Remarks

A listed model reasons by default, and while it reasons rejects every `temperature` except the
descriptor's [IAiProviderDescriptor.samplingParamsAcceptedTemperature](../interfaces/IAiProviderDescriptor.md#property-samplingparamsacceptedtemperature), when one is
declared. A request that turns thinking off on the wire (see
[IAiProviderDescriptor.samplingParamsRejectedWithThinkingModelPrefixes](../interfaces/IAiProviderDescriptor.md#property-samplingparamsrejectedwiththinkingmodelprefixes)) may send any value.
The completion, streaming and client-tool paths refuse a rejected value before anything is sent.
