<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [IResult](./ts-utils.iresult.md) &gt; [withDetail](./ts-utils.iresult.withdetail.md)

## IResult.withDetail() method

Converts a [IResult&lt;T&gt;](./ts-utils.iresult.md) to a [DetailedResult&lt;T, TD&gt;](./ts-utils.detailedresult.md)<!-- -->, adding supplied details.

**Signature:**

```typescript
withDetail<TD>(detail: TD, successDetail?: TD): DetailedResult<T, TD>;
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

detail


</td><td>

TD


</td><td>

The default detail to be added to the new [DetailedResult](./ts-utils.detailedresult.md)<!-- -->.


</td></tr>
<tr><td>

successDetail


</td><td>

TD


</td><td>

_(Optional)_ An optional detail to be added if this result was successful.


</td></tr>
</tbody></table>
**Returns:**

[DetailedResult](./ts-utils.detailedresult.md)<!-- -->&lt;T, TD&gt;

A new [DetailedResult&lt;T, TD&gt;](./ts-utils.detailedresult.md) with either the success result or the error message from this [IResult](./ts-utils.iresult.md) and the appropriate added detail.

