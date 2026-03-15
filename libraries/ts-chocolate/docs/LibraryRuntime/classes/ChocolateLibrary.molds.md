[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateLibrary](./ChocolateLibrary.md) > molds

## ChocolateLibrary.molds property

A materialized library of all molds, keyed by composite ID.
Molds are resolved lazily on access and cached.

**Signature:**

```typescript
readonly molds: MaterializedLibrary<MoldId, IMoldEntity, Mold, never>;
```
