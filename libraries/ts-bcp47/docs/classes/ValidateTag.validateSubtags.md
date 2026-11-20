[Home](../README.md) > [ValidateTag](./ValidateTag.md) > validateSubtags

## ValidateTag.validateSubtags() method

Validates supplied Bcp47.Subtags | subtags to a requested
Bcp47.TagValidity | validity level, if necessary.

**Signature:**

```typescript
static validateSubtags(subtags: ISubtags, wantValidity: TagValidity, haveValidity?: TagValidity): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtags</td><td>ISubtags</td><td>The Bcp47.Subtags | subtags to be validated.</td></tr>
<tr><td>wantValidity</td><td>TagValidity</td><td>The desired Bcp47.TagValidity | validity level.</td></tr>
<tr><td>haveValidity</td><td>TagValidity</td><td>(optional) The current Bcp47.TagValidity | validity level.</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;

`Success` with the validated Bcp47.Subtags | subtags, or
`Failure` with details if an error occurs.
