[Home](../README.md) > tryDecryptFile

# Function: tryDecryptFile

Attempts to parse and decrypt a JSON object as an CryptoUtils.IEncryptedFile | encrypted file.

## Signature

```typescript
function tryDecryptFile(json: JsonValue, key: Uint8Array, cryptoProvider: ICryptoProvider, payloadConverter: Converter<TPayload, unknown>, metadataConverter: Converter<TMetadata, unknown>): Promise<Result<TPayload>>
```
