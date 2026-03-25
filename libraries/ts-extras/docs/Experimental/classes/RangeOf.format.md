[Home](../../README.md) > [Experimental](../README.md) > [RangeOf](./RangeOf.md) > format

## RangeOf.format() method

Formats this range using the supplied format function.

**Signature:**

```typescript
format(format: (value: T) => string | undefined, formats?: RangeOfFormats): string | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>format</td><td>(value: T) =&gt; string | undefined</td><td>Format function used to format minimum and maximum extent values.</td></tr>
<tr><td>formats</td><td>RangeOfFormats</td><td>The Experimental.RangeOfFormats | format strings used to format the range
(default Experimental.DEFAULT_RANGEOF_FORMATS).</td></tr>
</tbody></table>

**Returns:**

string | undefined

Returns a formatted representation of this range.
