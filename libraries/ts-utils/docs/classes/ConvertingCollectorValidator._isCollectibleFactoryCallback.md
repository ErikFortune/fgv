[Home](../README.md) > [ConvertingCollectorValidator](./ConvertingCollectorValidator.md) > _isCollectibleFactoryCallback

## ConvertingCollectorValidator._isCollectibleFactoryCallback() method

Determines if a value is a Collections.CollectibleFactoryCallback | CollectibleFactoryCallback.

**Signature:**

```typescript
_isCollectibleFactoryCallback(value: unknown): value is CollectibleFactoryCallback<TITEM>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>unknown</td><td>The value to check.</td></tr>
</tbody></table>

**Returns:**

value is [CollectibleFactoryCallback](../type-aliases/CollectibleFactoryCallback.md)&lt;TITEM&gt;

`true` if the value is a Collections.CollectibleFactoryCallback | CollectibleFactoryCallback,
`false` otherwise.
