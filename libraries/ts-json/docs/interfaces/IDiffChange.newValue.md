[Home](../README.md) > [IDiffChange](./IDiffChange.md) > newValue

## IDiffChange.newValue property

The value in the second object.

- Present for `'added'` and `'modified'` changes
- Present for `'unchanged'` changes when `includeUnchanged` is true
- Undefined for `'removed'` changes

**Signature:**

```typescript
newValue: JsonValue;
```
