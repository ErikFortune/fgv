<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-res](./ts-res.md) &gt; [Validate](./ts-res.validate.md) &gt; [toConditionSetIndex](./ts-res.validate.toconditionsetindex.md)

## Validate.toConditionSetIndex() function

Converts a number to a [ConditionSetIndex](./ts-res.conditionsetindex.md) if it is a valid condition set index.

**Signature:**

```typescript
export declare function toConditionSetIndex(index: number): Result<ConditionSetIndex>;
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

index


</td><td>

number


</td><td>

the number to convert


</td></tr>
</tbody></table>
**Returns:**

Result&lt;[ConditionSetIndex](./ts-res.conditionsetindex.md)<!-- -->&gt;

`Success` with the converted [ConditionSetIndex](./ts-res.conditionsetindex.md) if successful, or `Failure` with an error message if not.
