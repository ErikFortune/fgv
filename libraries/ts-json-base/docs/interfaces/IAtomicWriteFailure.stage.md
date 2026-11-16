[Home](../README.md) > [IAtomicWriteFailure](./IAtomicWriteFailure.md) > stage

## IAtomicWriteFailure.stage property

The protocol stage at which the failure occurred.
- `validate`: destination, guarantee and path checks, before anything is
  touched. Always `visibility: 'unchanged'`.
- `temporary-write`: creating or writing the working file a store commits
  through. The destination has not been opened.
- `file-flush`: flushing or closing that working file. The previous
  destination is still authoritative.
- `replace`: the rename or assignment that makes the new contents visible.
  This is the stage whose `visibility` can be `'unknown'`.
- `directory-flush`: establishing the durability boundary *after* the
  contents are already visible, so `visibility` is `'replaced'`.

**Signature:**

```typescript
readonly stage: "replace" | "validate" | "temporary-write" | "file-flush" | "directory-flush";
```
