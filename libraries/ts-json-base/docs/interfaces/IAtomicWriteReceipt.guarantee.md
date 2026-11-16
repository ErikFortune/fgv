[Home](../README.md) > [IAtomicWriteReceipt](./IAtomicWriteReceipt.md) > guarantee

## IAtomicWriteReceipt.guarantee property

The guarantee actually honored. Always equal to the guarantee requested
in FileTree.IAtomicWriteOptions.guarantee — a weaker receipt is
never substituted for a stronger request.

**Signature:**

```typescript
readonly guarantee: "session" | "process-crash" | "os-crash" | "power-loss";
```
