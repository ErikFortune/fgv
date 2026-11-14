[Home](../README.md) > [DirectEncryptionProvider](./DirectEncryptionProvider.md) > encryptByName

## DirectEncryptionProvider.encryptByName() method

Encrypts JSON content under a named secret.

**Signature:**

```typescript
encryptByName(secretName: string, content: JsonValue, metadata?: TMetadata): Promise<Result<IEncryptedFile<TMetadata>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>secretName</td><td>string</td><td>Name of the secret to encrypt with</td></tr>
<tr><td>content</td><td>JsonValue</td><td>JSON-safe content to encrypt</td></tr>
<tr><td>metadata</td><td>TMetadata</td><td>Optional unencrypted metadata to include in the encrypted file</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IEncryptedFile](../interfaces/IEncryptedFile.md)&lt;TMetadata&gt;&gt;&gt;

Success with encrypted file structure, or Failure with error context
