<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-res](./ts-res.md) &gt; [Validate](./ts-res.validate.md) &gt; [toQualifierTypeName](./ts-res.validate.toqualifiertypename.md)

## Validate.toQualifierTypeName() function

Converts a string to a [QualifierTypeName](./ts-res.qualifiertypename.md) if it is a valid qualifier type name.

**Signature:**

```typescript
export declare function toQualifierTypeName(name: string): Result<QualifierTypeName>;
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

name


</td><td>

string


</td><td>

the string to convert


</td></tr>
</tbody></table>
**Returns:**

Result&lt;[QualifierTypeName](./ts-res.qualifiertypename.md)<!-- -->&gt;

`Success` with the converted [QualifierTypeName](./ts-res.qualifiertypename.md) if successful, or `Failure` with an error message if not.
