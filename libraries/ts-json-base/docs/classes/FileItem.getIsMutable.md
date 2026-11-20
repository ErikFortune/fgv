[Home](../README.md) > [FileItem](./FileItem.md) > getIsMutable

## FileItem.getIsMutable() method

Indicates whether this file can be saved.

**Signature:**

```typescript
getIsMutable(): DetailedResult<boolean, SaveDetail>;
```

**Returns:**

DetailedResult&lt;boolean, [SaveDetail](../type-aliases/SaveDetail.md)&gt;

`DetailedSuccess` with FileTree.SaveCapability if the file can be saved,
or `DetailedFailure` with FileTree.SaveFailureReason if it cannot.
