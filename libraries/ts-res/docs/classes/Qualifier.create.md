[Home](../README.md) > [Qualifier](./Qualifier.md) > create

## Qualifier.create() method

Creates a new instance of a Qualifiers.Qualifier | Qualifier from the
supplied Qualifiers.IValidatedQualifierDecl | validated declaration.

**Signature:**

```typescript
static create(decl: IValidatedQualifierDecl): Result<Qualifier>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>decl</td><td>IValidatedQualifierDecl</td><td>The Qualifiers.IValidatedQualifierDecl | validated declaration
for the new instance.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Qualifier](Qualifier.md)&gt;

`Success` with the new Qualifiers.Qualifier | Qualifier if successful,
`Failure` with an error message otherwise.
