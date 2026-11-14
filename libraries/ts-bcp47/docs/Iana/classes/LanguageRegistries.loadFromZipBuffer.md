[Home](../../README.md) > [Iana](../README.md) > [LanguageRegistries](./LanguageRegistries.md) > loadFromZipBuffer

## LanguageRegistries.loadFromZipBuffer() method

Loads language registries from a compressed ZIP buffer (web-compatible).

**Signature:**

```typescript
static loadFromZipBuffer(zipBuffer: ArrayBuffer | Uint8Array<ArrayBufferLike>): Result<LanguageRegistries>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>zipBuffer</td><td>ArrayBuffer | Uint8Array&lt;ArrayBufferLike&gt;</td><td>ArrayBuffer or Uint8Array containing the ZIP file data.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[LanguageRegistries](../../classes/LanguageRegistries.md)&gt;

A Result containing the loaded LanguageRegistries or an error.
