[Home](../../../README.md) > [Import](../../README.md) > [Importers](../README.md) > [PathImporter](./PathImporter.md) > import

## PathImporter.import() method

Imports an item, extracting any resources or candidates from it and returns an optional
list of additional importable items derived from it.

**Signature:**

```typescript
import(item: IImportable, __manager: ResourceManagerBuilder): DetailedResult<IImportable[], ImporterResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>item</td><td>IImportable</td><td>The Import.IImportable | importable item to import.</td></tr>
<tr><td>__manager</td><td>ResourceManagerBuilder</td><td>The Resources.ResourceManagerBuilder | resource manager builder to use for the import.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[IImportable](../../../interfaces/IImportable.md)[], [ImporterResultDetail](../../../type-aliases/ImporterResultDetail.md)&gt;

`Success` with a list of additional importable items derived from the original, or
`Failure` with an error message and a Import.Importers.ImporterResultDetail | result detail.
