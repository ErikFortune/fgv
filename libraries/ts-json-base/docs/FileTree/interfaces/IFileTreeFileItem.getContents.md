[Home](../../README.md) > [FileTree](../README.md) > [IFileTreeFileItem](./IFileTreeFileItem.md) > getContents

## IFileTreeFileItem.getContents() method

Gets the contents of the file as parsed JSON.

**Signature:**

```typescript
getContents(): Result<JsonValue>;
```

**Returns:**

Result&lt;[JsonValue](../../type-aliases/JsonValue.md)&gt;

`Success` with the parsed JSON-compatible contents if successful, or
`Failure` with an error message otherwise.
