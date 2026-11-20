[Home](../README.md) > [LanguageTag](./LanguageTag.md) > createFromTag

## LanguageTag.createFromTag() method

Creates a new Bcp47.LanguageTag | language tag from a supplied `string` tag
using optional configuration, if supplied.

**Signature:**

```typescript
static createFromTag(tag: string, options?: ILanguageTagInitOptions): Result<LanguageTag>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>tag</td><td>string</td><td>The `string` tag from which the Bcp47.LanguageTag | language tag
is te be constructed.</td></tr>
<tr><td>options</td><td>ILanguageTagInitOptions</td><td>(optional) set of Bcp47.ILanguageTagInitOptions | init options
to guide the validation and normalization of this tag.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[LanguageTag](LanguageTag.md)&gt;

`Success` with the new Bcp47.LanguageTag | language tag or `Failure`
with details if an error occurs.
