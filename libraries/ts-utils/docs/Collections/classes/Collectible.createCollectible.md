[Home](../../README.md) > [Collections](../README.md) > [Collectible](./Collectible.md) > createCollectible

## Collectible.createCollectible() method

Creates a new Collections.Collectible | Collectible instance with a defined, strongly-typed index.

**Signature:**

```typescript
static createCollectible(params: ICollectibleConstructorParamsWithIndex<TKEY, TINDEX>): Result<Collectible<TKEY, TINDEX>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ICollectibleConstructorParamsWithIndex&lt;TKEY, TINDEX&gt;</td><td>Collections.ICollectibleConstructorParamsWithIndex | Parameters for constructing
the collectible.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;[Collectible](../../classes/Collectible.md)&lt;TKEY, TINDEX&gt;&gt;

Success with the new collectible if successful, Failure otherwise.
