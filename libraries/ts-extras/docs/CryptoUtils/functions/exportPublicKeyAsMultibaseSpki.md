[Home](../../README.md) > [CryptoUtils](../README.md) > exportPublicKeyAsMultibaseSpki

# Function: exportPublicKeyAsMultibaseSpki

Exports a public `CryptoKey` as a multibase base64url-encoded SPKI blob.

The SPKI (SubjectPublicKeyInfo) format is the standard DER-encoded structure
for public keys defined in RFC 5280, RFC 5480, and RFC 8410. It is
algorithm-agnostic and suitable for storage and transmission.

## Signature

```typescript
function exportPublicKeyAsMultibaseSpki(key: CryptoKey, provider: ICryptoProvider): Promise<Result<string>>
```
