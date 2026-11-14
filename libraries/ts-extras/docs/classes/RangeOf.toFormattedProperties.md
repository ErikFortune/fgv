[Home](../README.md) > [RangeOf](./RangeOf.md) > toFormattedProperties

## RangeOf.toFormattedProperties() method

Formats the minimum and maximum values of this range.

**Signature:**

```typescript
toFormattedProperties(format: (value: T) => string | undefined): RangeOfProperties<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>format</td><td>(value: T) =&gt; string | undefined</td><td>A format function used to format the values.</td></tr>
</tbody></table>

**Returns:**

[RangeOfProperties](../interfaces/RangeOfProperties.md)&lt;string&gt;

A Experimental.RangeOfProperties | RangeOfProperties<string> containing the
formatted representation of the Experimental.RangeOf.min | minimum and
Experimental.RangeOf.max | maximum
extent of the range, or `undefined` for an extent that is not present.
