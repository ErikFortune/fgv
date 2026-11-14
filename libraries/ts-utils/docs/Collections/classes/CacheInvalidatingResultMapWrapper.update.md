[Home](../../README.md) > [Collections](../README.md) > [CacheInvalidatingResultMapWrapper](./CacheInvalidatingResultMapWrapper.md) > update

## CacheInvalidatingResultMapWrapper.update() method

Updates an existing key in the map.
Invalidates the cache entry for the key.

**Signature:**

```typescript
update(key: TK, value: TSRC): DetailedResult<TSRC, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TK</td><td>The key to update.</td></tr>
<tr><td>value</td><td>TSRC</td><td>The new value.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TSRC, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

The result of the update operation.
