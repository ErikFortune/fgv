[Home](../README.md) > [IFileTreeInitParams](./IFileTreeInitParams.md) > mutable

## IFileTreeInitParams.mutable property

Controls mutability of the file tree.
- `undefined` or `false`: No files are mutable.
- `true`: All files are mutable.
- `IFilterSpec`: Only files matching the filter are mutable.

**Signature:**

```typescript
mutable: boolean | IFilterSpec;
```
