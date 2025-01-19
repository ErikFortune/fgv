<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-res](./ts-res.md) &gt; [Validate](./ts-res.validate.md) &gt; [validateMatchScore](./ts-res.validate.validatematchscore.md)

## Validate.validateMatchScore() function

Converts a number to a [match score](./ts-res.qualifiermatchscore.md) if it is a valid score.

**Signature:**

```typescript
export declare function validateMatchScore(value: number): Result<QualifierMatchScore>;
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

value


</td><td>

number


</td><td>

The number to convert.


</td></tr>
</tbody></table>
**Returns:**

Result&lt;[QualifierMatchScore](./ts-res.qualifiermatchscore.md)<!-- -->&gt;

`Success` with the converted score if successful, or `Failure` with an error message if not.
