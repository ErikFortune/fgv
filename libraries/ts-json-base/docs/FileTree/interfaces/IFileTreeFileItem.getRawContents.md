[Home](../../README.md) > [FileTree](../README.md) > [IFileTreeFileItem](./IFileTreeFileItem.md) > getRawContents

## IFileTreeFileItem.getRawContents() method

Gets the raw contents of the file as a string.

**Signature:**

```typescript
getRawContents(): Result<string>;
```

**Returns:**

Result&lt;string&gt;

`Success` with the raw contents if successful, or
`Failure` with an error message otherwise.
