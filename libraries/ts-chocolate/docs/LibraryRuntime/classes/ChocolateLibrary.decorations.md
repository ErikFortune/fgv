[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateLibrary](./ChocolateLibrary.md) > decorations

## ChocolateLibrary.decorations property

A materialized library of all decorations, keyed by composite ID.
Decorations are resolved lazily on access and cached.

**Signature:**

```typescript
readonly decorations: MaterializedLibrary<DecorationId, IDecorationEntity, Decoration, never>;
```
