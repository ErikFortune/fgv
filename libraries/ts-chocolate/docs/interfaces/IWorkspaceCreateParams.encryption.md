[Home](../README.md) > [IWorkspaceCreateParams](./IWorkspaceCreateParams.md) > encryption

## IWorkspaceCreateParams.encryption property

Additional encryption configuration options.
The workspace automatically wires up the key store's secret provider.

**Signature:**

```typescript
readonly encryption: Partial<Omit<IEncryptionConfig, "secretProvider">>;
```
