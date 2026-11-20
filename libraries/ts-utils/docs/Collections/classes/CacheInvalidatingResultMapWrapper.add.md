[Home](../../README.md) > [Collections](../README.md) > [CacheInvalidatingResultMapWrapper](./CacheInvalidatingResultMapWrapper.md) > add

## CacheInvalidatingResultMapWrapper.add() method

Adds a key/value pair to the map if the key does not already exist.
Invalidates the cache entry for the key.

**Signature:**

```typescript
add(key: TK, value: TSRC): DetailedResult<TSRC, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TK</td><td>The key to add.</td></tr>
<tr><td>value</td><td>TSRC</td><td>The value to add.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TSRC, [ResultMapResultDetail](../../type-aliases/ResultMapResultDetail.md)&gt;

The result of the add operation.
