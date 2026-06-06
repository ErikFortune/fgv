[Home](../../README.md) > [Diff](../README.md) > [IDiffChange](./IDiffChange.md) > oldValue

## IDiffChange.oldValue property

The value in the first object.

- Present for `'removed'` and `'modified'` changes
- Present for `'unchanged'` changes when `includeUnchanged` is true
- Undefined for `'added'` changes

**Signature:**

```typescript
oldValue: JsonValue;
```
