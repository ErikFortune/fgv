[Home](../README.md) > [ResultMap](./ResultMap.md) > create

## ResultMap.create() method

Creates a new Collections.ResultMap | ResultMap.

**Signature:**

```typescript
static create(elements: Iterable<KeyValueEntry<TK, TV>>): Result<ResultMap<TK, TV>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>elements</td><td>Iterable&lt;KeyValueEntry&lt;TK, TV&gt;&gt;</td><td>An optional iterable to initialize the map.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;[ResultMap](ResultMap.md)&lt;TK, TV&gt;&gt;

`Success` with the new map, or `Failure` with error details
if an error occurred.
