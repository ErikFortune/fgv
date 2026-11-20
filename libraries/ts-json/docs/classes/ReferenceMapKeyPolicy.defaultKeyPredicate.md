[Home](../README.md) > [ReferenceMapKeyPolicy](./ReferenceMapKeyPolicy.md) > defaultKeyPredicate

## ReferenceMapKeyPolicy.defaultKeyPredicate() method

The static default key name validation predicate rejects keys that contain
mustache templates or which start with the default conditional prefix
`'?'`.

**Signature:**

```typescript
static defaultKeyPredicate(key: string): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key to test.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the key is valid, `false` otherwise.
