[Home](../README.md) > [Normalizer](./Normalizer.md) > canonicalize

## Normalizer.canonicalize() method

Produces a stable, byte-identical JSON string following RFC 8785
(JSON Canonicalization Scheme) key-ordering rules.

Builds the output string directly rather than constructing an intermediate
JS object, so integer-string keys (`"10"`, `"2"`) retain lexicographic
order instead of being reordered numerically by the JS engine during
`JSON.stringify`.

**Signature:**

```typescript
canonicalize(from: unknown): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>Any JSON-compatible value (string, number, boolean, null,
  plain object, or array). Fails for non-JSON types (Map, Set, Date,
  RegExp, function, symbol, bigint, undefined).</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;string&gt;

`Result<string>` — the canonical JSON string, or a failure if
  `from` contains non-serializable types.
