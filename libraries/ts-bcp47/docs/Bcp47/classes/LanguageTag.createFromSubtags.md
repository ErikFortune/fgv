[Home](../../README.md) > [Bcp47](../README.md) > [LanguageTag](./LanguageTag.md) > createFromSubtags

## LanguageTag.createFromSubtags() method

Creates a new Bcp47.LanguageTag | language tag from a supplied
Bcp47.Subtags | subtags using optional configuration,
if supplied.

**Signature:**

```typescript
static createFromSubtags(subtags: ISubtags, options?: ILanguageTagInitOptions): Result<LanguageTag>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtags</td><td>ISubtags</td><td>The Bcp47.Subtags | subtags from which the
Bcp47.LanguageTag | language tag is te be constructed.</td></tr>
<tr><td>options</td><td>ILanguageTagInitOptions</td><td>(optional) set of Bcp47.ILanguageTagInitOptions | init options
to guide the validation and normalization of this tag.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[LanguageTag](../../classes/LanguageTag.md)&gt;

`Success` with the new Bcp47.LanguageTag | language tag or `Failure`
with details if an error occurs.
