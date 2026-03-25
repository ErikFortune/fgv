[Home](../README.md) > [IDirectEncryptionProviderParams](./IDirectEncryptionProviderParams.md) > boundSecretName

## IDirectEncryptionProviderParams.boundSecretName property

Optional bound secret name.
When set, `encryptByName` will fail if called with a different name.
When unset, any secret name is accepted.

**Signature:**

```typescript
readonly boundSecretName: string;
```
