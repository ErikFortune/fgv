[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateLibrary](./ChocolateLibrary.md) > confections

## ChocolateLibrary.confections property

A materialized library of all confections, keyed by composite ID.
Confections are resolved lazily on access and cached.

**Signature:**

```typescript
readonly confections: MaterializedLibrary<ConfectionId, AnyConfectionRecipeEntity, AnyConfection, never>;
```
