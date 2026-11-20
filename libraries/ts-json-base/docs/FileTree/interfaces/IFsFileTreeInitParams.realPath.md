[Home](../../README.md) > [FileTree](../README.md) > [IFsFileTreeInitParams](./IFsFileTreeInitParams.md) > realPath

## IFsFileTreeInitParams.realPath property

When `true`, every operation also checks the real path of what it touches —
symbolic links followed — and refuses one that leads outside the real path
of the prefix. Defaults to `true` under `'verified'` and `false` otherwise;
requires `'confined'` or `'verified'`.

**Signature:**

```typescript
realPath: boolean;
```
