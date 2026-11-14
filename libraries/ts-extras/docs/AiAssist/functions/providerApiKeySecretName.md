[Home](../../README.md) > [AiAssist](../README.md) > providerApiKeySecretName

# Function: providerApiKeySecretName

Returns the canonical `CryptoUtils.KeyStore.KeyStore` secret name for a provider's API key,
of the form `provider:<providerId>`. Apps that store provider API keys in a `KeyStore`
should use this name (rather than inventing their own) so that a single keystore vault
works consistently across every fgv app.

## Signature

```typescript
function providerApiKeySecretName(providerId: AiProviderId): string
```
