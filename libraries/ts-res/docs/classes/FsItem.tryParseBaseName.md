[Home](../README.md) > [FsItem](./FsItem.md) > tryParseBaseName

## FsItem.tryParseBaseName() method

Tries to parse a base name into a base name and a set of conditions.

**Signature:**

```typescript
static tryParseBaseName(baseName: string, qualifiers: IReadOnlyQualifierCollector): Result<Omit<IFsItemProps, "item">>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseName</td><td>string</td><td>The base name to parse.</td></tr>
<tr><td>qualifiers</td><td>IReadOnlyQualifierCollector</td><td>The Qualifiers.IReadOnlyQualifierCollector | qualifiers used to parse
embedded condition set tokens.</td></tr>
</tbody></table>

**Returns:**

Result&lt;Omit&lt;[IFsItemProps](../interfaces/IFsItemProps.md), "item"&gt;&gt;

`Success` containing the parsed base name and conditions on success, or `Failure` containing
an error message if it is not.
