[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / providerApiKeySecretName

# Function: providerApiKeySecretName()

> **providerApiKeySecretName**(`providerId`): `string`

Returns the canonical `CryptoUtils.KeyStore.KeyStore` secret name for a provider's API key,
of the form `provider:<providerId>`. Apps that store provider API keys in a `KeyStore`
should use this name (rather than inventing their own) so that a single keystore vault
works consistently across every fgv app.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `providerId` | [`AiProviderId`](../type-aliases/AiProviderId.md) | The provider whose API key secret name is requested. |

## Returns

`string`

The canonical keystore secret name, e.g. `'provider:openai'`.
