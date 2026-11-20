[Home](../../README.md) > [Bcp47](../README.md) > [ValidateTag](./ValidateTag.md) > isWellFormed

## ValidateTag.isWellFormed() method

Determines if supplied Bcp47.Subtags | subtags are
well-formed as specified by https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | RFC 5646,
meaning that all subtags meet the grammar defined in the specification.

**Signature:**

```typescript
static isWellFormed(subtags: ISubtags): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtags</td><td>ISubtags</td><td>The Bcp47.Subtags | subtags to test.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the Bcp47.Subtags | subtags represent
a well-formed language tag, false otherwise.
