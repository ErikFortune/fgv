[Home](../README.md) > [IAtomicWriteCapabilities](./IAtomicWriteCapabilities.md) > guarantees

## IAtomicWriteCapabilities.guarantees property

The durability guarantees this store can honor for an atomic write,
weakest to strongest. Empty when `atomicReplace` is `false`.

**Signature:**

```typescript
readonly guarantees: readonly ("session" | "process-crash" | "os-crash" | "power-loss")[];
```
