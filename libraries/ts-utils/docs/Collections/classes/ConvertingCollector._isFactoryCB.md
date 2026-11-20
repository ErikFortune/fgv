[Home](../../README.md) > [Collections](../README.md) > [ConvertingCollector](./ConvertingCollector.md) > _isFactoryCB

## ConvertingCollector._isFactoryCB() method

Helper method for derived classes to determine if a supplied
itemOrCb parameter is a factory callback.

**Signature:**

```typescript
_isFactoryCB(itemOrCb: TSRC | CollectibleFactoryCallback<TITEM>): itemOrCb is CollectibleFactoryCallback<TITEM>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>itemOrCb</td><td>TSRC | CollectibleFactoryCallback&lt;TITEM&gt;</td><td>Overloaded parameter is either `CollectibleKey<TITEM>` or
a Collections.CollectibleFactoryCallback | factory callback.</td></tr>
</tbody></table>

**Returns:**

itemOrCb is [CollectibleFactoryCallback](../../type-aliases/CollectibleFactoryCallback.md)&lt;TITEM&gt;

Returns `true` if the parameter is a factory callback, `false` otherwise.
