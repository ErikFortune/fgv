[Home](../README.md) > [CacheInvalidatingResultMapWrapper](./CacheInvalidatingResultMapWrapper.md) > getOrAdd

## CacheInvalidatingResultMapWrapper.getOrAdd() method

Gets a value from the map, or adds a supplied value if it does not exist.
Invalidates the cache entry for the key if a new value is added.

**Signature:**

```typescript
getOrAdd(key: TK, value: TSRC): DetailedResult<TSRC, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TK</td><td>The key to retrieve or add.</td></tr>
<tr><td>value</td><td>TSRC</td><td>The value to add if the key does not exist.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TSRC, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

The result of the operation.
