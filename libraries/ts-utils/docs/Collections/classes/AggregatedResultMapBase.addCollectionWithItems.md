[Home](../../README.md) > [Collections](../README.md) > [AggregatedResultMapBase](./AggregatedResultMapBase.md) > addCollectionWithItems

## AggregatedResultMapBase.addCollectionWithItems() method

Adds a new collection with the specified ID and optional initial entries.

**Signature:**

```typescript
addCollectionWithItems(collectionId: string, items?: Iterable<KeyValueEntry<string, unknown>, any, any>, options?: IAddCollectionWithItemsOptions<TMETADATA>): Result<TCOLLECTIONID>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>string</td><td>The collection ID as a string (will be validated).</td></tr>
<tr><td>items</td><td>Iterable&lt;KeyValueEntry&lt;string, unknown&gt;, any, any&gt;</td><td>Optional initial entries for the collection.</td></tr>
<tr><td>options</td><td>IAddCollectionWithItemsOptions&lt;TMETADATA&gt;</td><td>Optional settings (isImmutable defaults to false).</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;TCOLLECTIONID&gt;

`Success` with the validated collection ID if added, `Failure` otherwise.
