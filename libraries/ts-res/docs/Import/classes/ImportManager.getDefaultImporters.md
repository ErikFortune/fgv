[Home](../../README.md) > [Import](../README.md) > [ImportManager](./ImportManager.md) > getDefaultImporters

## ImportManager.getDefaultImporters() method

Gets the default importers using supplied Qualifiers.IReadOnlyQualifierCollector | qualifiers
and optional `FileTree`.

**Signature:**

```typescript
static getDefaultImporters(qualifiers: IReadOnlyQualifierCollector, tree?: FileTree_2<string>): readonly IImporter[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>qualifiers</td><td>IReadOnlyQualifierCollector</td><td>The Qualifiers.IReadOnlyQualifierCollector | qualifiers to use for the import.</td></tr>
<tr><td>tree</td><td>FileTree_2&lt;string&gt;</td><td>An optional `FileTree` for importing path items.</td></tr>
</tbody></table>

**Returns:**

readonly [IImporter](../../interfaces/IImporter.md)[]

A read-only array of Import.Importers.IImporter | importers.
