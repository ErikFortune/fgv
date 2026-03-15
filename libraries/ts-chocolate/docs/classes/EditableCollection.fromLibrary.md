[Home](../README.md) > [EditableCollection](./EditableCollection.md) > fromLibrary

## EditableCollection.fromLibrary() method

Create an editable collection from a SubLibrary collection with persistence enabled.

This convenience method automatically retrieves the sourceItem from the library
to enable direct save() functionality.

**Signature:**

```typescript
static fromLibrary(library: SubLibraryBase<string, TBaseId, TItem>, collectionId: CollectionId, keyConverter: Converter<TBaseId, unknown>, valueConverter: Converter<T, unknown>, encryptionProvider?: IEncryptionProvider): Result<EditableCollection<T, TBaseId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>library</td><td>SubLibraryBase&lt;string, TBaseId, TItem&gt;</td><td>The SubLibrary containing the collection</td></tr>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection to make editable</td></tr>
<tr><td>keyConverter</td><td>Converter&lt;TBaseId, unknown&gt;</td><td>Converter for validating item keys</td></tr>
<tr><td>valueConverter</td><td>Converter&lt;T, unknown&gt;</td><td>Converter for validating item values</td></tr>
<tr><td>encryptionProvider</td><td>IEncryptionProvider</td><td>Optional encryption provider for encrypted save support</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](EditableCollection.md)&lt;T, TBaseId&gt;&gt;

Result containing EditableCollection with persistence, or Failure
