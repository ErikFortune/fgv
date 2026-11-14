[Home](../../README.md) > [FileTree](../README.md) > [IFsFileTreeInitParams](./IFsFileTreeInitParams.md) > absolutePathPolicy

## IFsFileTreeInitParams.absolutePathPolicy property

How a path that resolves outside `prefix` is treated, for every operation —
reads, listings, stats and writes alike. Defaults to `'unconfined'`, which is
the behaviour of accessors created without this option.

**Signature:**

```typescript
absolutePathPolicy: FsAbsolutePathPolicy;
```
