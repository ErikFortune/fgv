[Home](../../README.md) > [Collections](../README.md) > [ConvertingCollector](./ConvertingCollector.md) > _overloadIsItem

## ConvertingCollector._overloadIsItem() method

Helper method for derived classes to determine if a supplied
keyOrItem parameter is an item.

**Signature:**

```typescript
_overloadIsItem(keyOrItem: TITEM | CollectibleKey<TITEM>, itemOrCb?: TSRC | CollectibleFactoryCallback<TITEM>): keyOrItem is TITEM;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>keyOrItem</td><td>TITEM | CollectibleKey&lt;TITEM&gt;</td><td>Overloaded parameter is either `CollectibleKey<TITEM>` or `TITEM`.</td></tr>
<tr><td>itemOrCb</td><td>TSRC | CollectibleFactoryCallback&lt;TITEM&gt;</td><td>Overloaded parameter is either `TSRC`, a Collections.CollectibleFactoryCallback | factory callback
or `undefined`.</td></tr>
</tbody></table>

**Returns:**

keyOrItem is TITEM

Returns `true` if the parameter is an item, `false` otherwise.
