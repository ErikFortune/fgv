<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-res](./ts-res.md) &gt; [Validate](./ts-res.validate.md) &gt; [toResourceId](./ts-res.validate.toresourceid.md)

## Validate.toResourceId() function

Converts a string to a [resource ID](./ts-res.resourceid.md)<!-- -->.

**Signature:**

```typescript
export declare function toResourceId(id: string): Result<ResourceId>;
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

id


</td><td>

string


</td><td>

The string to convert.


</td></tr>
</tbody></table>
**Returns:**

Result&lt;[ResourceId](./ts-res.resourceid.md)<!-- -->&gt;

`Success` with the converted ID if valid, or `Failure` with an error message if not.
