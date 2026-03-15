[Home](../../README.md) > [Settings](../README.md) > [IExternalLibraryRefConfig](./IExternalLibraryRefConfig.md) > load

## IExternalLibraryRefConfig.load property

Which sublibraries to load from this source.
- true: load all
- false: load none
- object: per-sublibrary control with optional 'default'

**Signature:**

```typescript
readonly load: boolean | Partial<Record<"default" | SubLibraryId, boolean>>;
```
