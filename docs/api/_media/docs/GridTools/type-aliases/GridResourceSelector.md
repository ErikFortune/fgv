[Home](../../README.md) > [GridTools](../README.md) > GridResourceSelector

# Type Alias: GridResourceSelector

Resource selection configuration for grid views.
Supports simple built-in selectors and custom selection logic.

## Type

```typescript
type GridResourceSelector = { type: "ids"; resourceIds: string[] } | { type: "prefix"; prefix: string } | { type: "suffix"; suffix: string } | { type: "resourceTypes"; types: string[] } | { type: "pattern"; pattern: string } | { type: "all" } | { type: "custom"; selector: ICustomResourceSelector }
```
