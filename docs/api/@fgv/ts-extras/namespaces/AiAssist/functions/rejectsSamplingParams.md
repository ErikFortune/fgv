[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / rejectsSamplingParams

# Function: rejectsSamplingParams()

> **rejectsSamplingParams**(`descriptor`, `modelId`): `boolean`

Whether a concrete (already-resolved) model restricts a caller-supplied `temperature`, per the
descriptor's [IAiProviderDescriptor.samplingParamsRejectedModelPrefixes](../interfaces/IAiProviderDescriptor.md#property-samplingparamsrejectedmodelprefixes)
(exact-or-dash-bounded match).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor supplying the prefix list. |
| `modelId` | `string` | The resolved concrete model id to test. |

## Returns

`boolean`

`true` when `modelId` restricts `temperature`.

## Remarks

A listed model rejects every `temperature` except the descriptor's
[IAiProviderDescriptor.samplingParamsAcceptedTemperature](../interfaces/IAiProviderDescriptor.md#property-samplingparamsacceptedtemperature), when one is declared. The
completion (`callProviderCompletion`), streaming (`callProviderCompletionStream`) and
client-tool (`executeClientToolTurn`) paths refuse any other value before anything is sent,
rather than letting the provider return a 400.
