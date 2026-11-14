[Home](../README.md) > [CacheInvalidatingResultMapWrapper](./CacheInvalidatingResultMapWrapper.md) > set

## CacheInvalidatingResultMapWrapper.set() method

Sets a key/value pair in the map.
Invalidates the cache entry for the key.

**Signature:**

```typescript
set(key: TK, value: TSRC): DetailedResult<TSRC, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TK</td><td>The key to set.</td></tr>
<tr><td>value</td><td>TSRC</td><td>The value to set.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TSRC, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

The result of the set operation.
