[Home](../../README.md) > [CryptoUtils](../README.md) > decryptFile

# Function: decryptFile

Decrypts an CryptoUtils.IEncryptedFile | encrypted file and returns the JSON content.

## Signature

```typescript
function decryptFile(file: IEncryptedFile<unknown>, key: Uint8Array, cryptoProvider: ICryptoProvider, payloadConverter: Converter<TPayload, unknown>): Promise<Result<TPayload>>
```
