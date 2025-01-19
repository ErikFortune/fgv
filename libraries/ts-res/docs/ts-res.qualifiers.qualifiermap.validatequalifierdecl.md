<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-res](./ts-res.md) &gt; [Qualifiers](./ts-res.qualifiers.md) &gt; [QualifierMap](./ts-res.qualifiers.qualifiermap.md) &gt; [validateQualifierDecl](./ts-res.qualifiers.qualifiermap.validatequalifierdecl.md)

## Qualifiers.QualifierMap.validateQualifierDecl() method

Validates the properties of a [qualifier declaration](./ts-res.qualifiers.iqualifierdecl.md) for correctness.

**Signature:**

```typescript
static validateQualifierDecl(decl: IQualifierDecl): Result<IValidatedQualifierDecl>;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

decl


</td><td>

[IQualifierDecl](./ts-res.qualifiers.iqualifierdecl.md)


</td><td>

The [qualifier declaration](./ts-res.qualifiers.iqualifierdecl.md) to validate.


</td></tr>
</tbody></table>
**Returns:**

Result&lt;[IValidatedQualifierDecl](./ts-res.qualifiers.ivalidatedqualifierdecl.md)<!-- -->&gt;

`Success` with the validated [qualifier declaration](./ts-res.qualifiers.ivalidatedqualifierdecl.md) if successful, `Failure` with an error message otherwise.
