[Home](../README.md) > [CollectionFilter](./CollectionFilter.md) > filterItems

## CollectionFilter.filterItems() method

Filters items of an arbitrary type based on their extracted names.

**Signature:**

```typescript
filterItems(items: readonly TITEM[], extractName: (item: TITEM) => Result<string>): Result<readonly IFilteredItem<TITEM, T>[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>items</td><td>readonly TITEM[]</td><td>Items to filter.</td></tr>
<tr><td>extractName</td><td>(item: TITEM) =&gt; Result&lt;string&gt;</td><td>Function to extract the name from an item.</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [IFilteredItem](../interfaces/IFilteredItem.md)&lt;TITEM, T&gt;[]&gt;

`Success` with the LibraryData.IFilteredItem | filtered items or `Failure` with error messages.
