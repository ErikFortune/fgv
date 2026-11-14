[Home](../../README.md) > [KeyStore](../README.md) > [IKeyStoreOpenParams](./IKeyStoreOpenParams.md) > privateKeyStorage

## IKeyStoreOpenParams.privateKeyStorage property

Optional private-key storage backend. Required to use `addKeyPair` /
`getKeyPair`; absent backends still permit opening, listing, and reading
public-key metadata for asymmetric entries.

**Signature:**

```typescript
readonly privateKeyStorage: IPrivateKeyStorage;
```
