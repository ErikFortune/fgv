[Home](../../README.md) > [FileTree](../README.md) > [FileItem](./FileItem.md) > getRawBytes

## FileItem.getRawBytes() method

Gets the raw contents of the file as bytes, with no text decoding applied.

**Signature:**

```typescript
getRawBytes(): Result<Uint8Array<ArrayBufferLike>>;
```

**Returns:**

Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;

`Success` with the raw bytes if successful, or `Failure` with an
error message otherwise.
