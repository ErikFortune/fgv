[Home](../../README.md) > [FileTree](../README.md) > [IAtomicWriteOptions](./IAtomicWriteOptions.md) > guarantee

## IAtomicWriteOptions.guarantee property

The durability guarantee the caller requires. A guarantee stronger than
the store can honor fails before any mutation — there is no silent
downgrade to a weaker guarantee than requested.

**Signature:**

```typescript
readonly guarantee: "session" | "process-crash" | "os-crash" | "power-loss";
```
