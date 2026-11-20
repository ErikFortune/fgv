[Home](../../README.md) > [CryptoUtils](../README.md) > [HpkeProvider](./HpkeProvider.md) > create

## HpkeProvider.create() method

Creates an `HpkeProvider` bound to the given `SubtleCrypto` instance.

**Signature:**

```typescript
static create(subtle: SubtleCrypto): Result<HpkeProvider>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtle</td><td>SubtleCrypto</td><td>Web Crypto SubtleCrypto instance.
  Node.js: `(await import('crypto')).webcrypto.subtle`.
  Browser: `globalThis.crypto.subtle`.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[HpkeProvider](../../classes/HpkeProvider.md)&gt;

`Success` with the provider, or `Failure` if construction fails.
