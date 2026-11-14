[Home](../../README.md) > [Diff](../README.md) > [IDiffResult](./IDiffResult.md) > changes

## IDiffResult.changes property

Array of all changes detected between the two JSON objects.

Changes are ordered by the path where they occur. For nested structures,
parent changes appear before child changes.

**Signature:**

```typescript
changes: IDiffChange[];
```
