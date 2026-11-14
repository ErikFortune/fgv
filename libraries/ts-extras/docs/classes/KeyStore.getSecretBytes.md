[Home](../README.md) > [KeyStore](./KeyStore.md) > getSecretBytes

## KeyStore.getSecretBytes() method

Retrieves the raw stored bytes for a symmetric entry, returned verbatim
(never UTF-8 decoded). Intended for `'opaque'` entries but works for any
symmetric type; asymmetric-keypair entries carry no raw key material and
are rejected.

**Signature:**

```typescript
getSecretBytes(name: string): Result<Uint8Array<ArrayBufferLike>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the secret</td></tr>
</tbody></table>

**Returns:**

Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;

Success with a copy of the stored bytes, Failure if not found,
locked, or the entry is asymmetric
