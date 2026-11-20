[Home](../../README.md) > [Collections](../README.md) > [CacheInvalidatingResultMapWrapper](./CacheInvalidatingResultMapWrapper.md) > delete

## CacheInvalidatingResultMapWrapper.delete() method

Deletes a key from the map.
Invalidates the cache entry for the key.

**Signature:**

```typescript
delete(key: TK): DetailedResult<TSRC, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TK</td><td>The key to delete.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TSRC, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

The result of the delete operation.
