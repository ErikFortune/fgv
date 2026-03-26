[Home](../../README.md) > [Collections](../README.md) > [ValidatingResultMap](./ValidatingResultMap.md) > createValidatingResultMap

## ValidatingResultMap.createValidatingResultMap() method

Creates a new Collections.ValidatingResultMap | ValidatingResultMap instance.

**Signature:**

```typescript
static createValidatingResultMap(params: IValidatingResultMapConstructorParams<TK, TV>): Result<ValidatingResultMap<TK, TV>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IValidatingResultMapConstructorParams&lt;TK, TV&gt;</td><td>Required parameters for constructing the map.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;[ValidatingResultMap](../../classes/ValidatingResultMap.md)&lt;TK, TV&gt;&gt;

`Success` with the new map if successful, `Failure` otherwise.
