[Home](../../README.md) > [Editing](../README.md) > [EditableCollection](./EditableCollection.md) > isDirty

## EditableCollection.isDirty() method

Check if the source file has unsaved changes.
Only applicable if the collection has a persistent FileTree source.
Note: This method is not currently implementable without access to the FileTree instance.
Returns false for now - dirty tracking should be done at a higher level.

**Signature:**

```typescript
isDirty(): boolean;
```

**Returns:**

boolean

False (dirty tracking not available at collection level)
