[Home](../README.md) > [UserLibrary](./UserLibrary.md) > isCollectionMutable

## UserLibrary.isCollectionMutable() method

Checks if a collection is mutable.
Required by IVariationContext.

**Signature:**

```typescript
isCollectionMutable(collectionId: CollectionId): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>The collection ID to check</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;

Success with boolean indicating mutability, or Failure if collection not found
