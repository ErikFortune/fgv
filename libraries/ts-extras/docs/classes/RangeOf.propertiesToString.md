[Home](../README.md) > [RangeOf](./RangeOf.md) > propertiesToString

## RangeOf.propertiesToString() method

Gets a formatted description of a Experimental.RangeOfProperties | RangeOfProperties<T> given an
optional set of formats and 'empty' value to use.

**Signature:**

```typescript
static propertiesToString(range: RangeOfProperties<T>, formats?: RangeOfFormats, emptyValue?: T): string | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>range</td><td>RangeOfProperties&lt;T&gt;</td><td>The Experimental.RangeOfProperties | RangeOfProperties<T> to be formatted.</td></tr>
<tr><td>formats</td><td>RangeOfFormats</td><td>Optional Experimental.RangeOfFormats | formats to use. Default is
Experimental.DEFAULT_RANGEOF_FORMATS | DEFAULT_RANGEOF_FORMATS.</td></tr>
<tr><td>emptyValue</td><td>T</td><td>Value which represents unbounded minimum or maximum for this range. Default is `undefined`.</td></tr>
</tbody></table>

**Returns:**

string | undefined

A string representation of the range.
