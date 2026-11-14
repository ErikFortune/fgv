[Home](../README.md) > [IIdbPrivateKeyStorageCreateParams](./IIdbPrivateKeyStorageCreateParams.md) > indexedDB

## IIdbPrivateKeyStorageCreateParams.indexedDB property

IndexedDB factory to use. Defaults to `globalThis.indexedDB`. Supplied
explicitly in tests (e.g. a `fake-indexeddb` factory) or to target a
non-default factory.

**Signature:**

```typescript
readonly indexedDB: IDBFactory;
```
