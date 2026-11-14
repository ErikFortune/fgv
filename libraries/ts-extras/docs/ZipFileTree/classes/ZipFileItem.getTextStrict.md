[Home](../../README.md) > [ZipFileTree](../README.md) > [ZipFileItem](./ZipFileItem.md) > getTextStrict

## ZipFileItem.getTextStrict() method

Gets the file's contents, decoding UTF-8 strictly.

**Signature:**

```typescript
getTextStrict(): Result<string>;
```

**Returns:**

Result&lt;string&gt;

`Success` with the decoded text; `Failure` if the entry's bytes are
not valid UTF-8, or if this item never held the original bytes.
