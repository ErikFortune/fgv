[Home](../README.md) > [ConvertingCollector](./ConvertingCollector.md) > _buildItem

## ConvertingCollector._buildItem() method

Helper method for derived classes to build an item from a key and a source representation using
a default or supplied factory.

**Signature:**

```typescript
_buildItem(key: CollectibleKey<TITEM>, itemOrCb: TSRC | CollectibleFactoryCallback<TITEM>): Result<TITEM>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>CollectibleKey&lt;TITEM&gt;</td><td>The key of the item to build.</td></tr>
<tr><td>itemOrCb</td><td>TSRC | CollectibleFactoryCallback&lt;TITEM&gt;</td><td>The source representation of the item to build, or a factory callback to create it.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;TITEM&gt;

Returns Success | Success with the item if it is built, or Failure | Failure
with an error if the item cannot be built.
