[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProxiedListModels

# Function: callProxiedListModels()

> **callProxiedListModels**(`proxyUrl`, `params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IAiModelInfo`](../interfaces/IAiModelInfo.md)[]\>\>

Calls the model-listing endpoint on a proxy server. Endpoint:
`POST ${proxyUrl}/api/ai/list-models`. Capability config is not forwarded;
`capabilities` is serialized as a string array. Error body `{error: string}`
is surfaced as `proxy: ${error}`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `proxyUrl` | `string` |
| `params` | [`IProviderListModelsParams`](../interfaces/IProviderListModelsParams.md) |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IAiModelInfo`](../interfaces/IAiModelInfo.md)[]\>\>

## Remarks

`capabilityConfig` and `endpoint` are both unusable here, but they are not the
same case and are not treated the same way. `capabilityConfig` overrides how a
model id is classified, and the proxy returns models already classified — so a
caller-supplied override could only ever have arrived too late. Ignoring it
yields the default classification: a degraded answer, disclosed above, and
that is where it stays. `endpoint` names *which server answers at all*, so
ignoring it would list the provider's public catalog in place of the host the
caller pinned; it is **refused**, on the same terms as
`callProxiedCompletion`.
