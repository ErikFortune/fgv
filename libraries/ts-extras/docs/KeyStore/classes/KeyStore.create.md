[Home](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > create

## KeyStore.create() method

Creates a new, empty key store.
Call `initialize(password)` to set the master password.

**Signature:**

```typescript
static create(params: IKeyStoreCreateParams): Result<KeyStore>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IKeyStoreCreateParams</td><td>Creation parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[KeyStore](../../classes/KeyStore.md)&gt;

Success with new KeyStore instance, or Failure if parameters invalid
