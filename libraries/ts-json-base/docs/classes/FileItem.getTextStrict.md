[Home](../README.md) > [FileItem](./FileItem.md) > getTextStrict

## FileItem.getTextStrict() method

Gets the file's contents with a strict UTF-8 decode, failing on malformed
input rather than substituting U+FFFD.

**Signature:**

```typescript
getTextStrict(): Result<string>;
```

**Returns:**

Result&lt;string&gt;
