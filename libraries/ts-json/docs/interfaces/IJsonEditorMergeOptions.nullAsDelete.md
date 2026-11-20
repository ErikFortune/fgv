[Home](../README.md) > [IJsonEditorMergeOptions](./IJsonEditorMergeOptions.md) > nullAsDelete

## IJsonEditorMergeOptions.nullAsDelete property

Controls whether null values should be treated as property deletion during merge operations.
- `false` (default): Null values are merged normally, setting the property to null
- `true`: Null values delete the property from the target object during merge

**Signature:**

```typescript
nullAsDelete: boolean;
```
