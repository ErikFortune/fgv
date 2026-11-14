[Home](../../README.md) > [FileTree](../README.md) > [IAtomicWriteFailure](./IAtomicWriteFailure.md) > code

## IAtomicWriteFailure.code property

- `unsupported`: the store or destination does not support atomic
  writes, or the requested guarantee exceeds what the store can honor.
- `not-writable`: the destination or containing directory is not
  writable, or the requested name/path is not valid.
- `io`: an underlying read/write/flush/rename operation failed.

**Signature:**

```typescript
readonly code: "unsupported" | "not-writable" | "io";
```
