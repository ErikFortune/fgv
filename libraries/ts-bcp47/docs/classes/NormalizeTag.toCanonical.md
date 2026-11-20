[Home](../README.md) > [NormalizeTag](./NormalizeTag.md) > toCanonical

## NormalizeTag.toCanonical() method

Converts a BCP-47 language tag to canonical form.  Canonical form uses the recommended capitalization rules
specified in https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1.1 | RFC 5646 but are not
otherwise modified.

**Signature:**

```typescript
static toCanonical(subtags: ISubtags): Result<ISubtags>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtags</td><td>ISubtags</td><td>The individual Bcp47.Subtags | subtags to be normalized.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ISubtags](../interfaces/ISubtags.md)&gt;

`Success` with the normalized equivalent Bcp47.Subtags | subtags,
or `Failure` with details if an error occurs.
