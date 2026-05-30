[Home](../../README.md) > [Bcp47](../README.md) > [ValidateTag](./ValidateTag.md) > isCanonical

## ValidateTag.isCanonical() method

Determines if supplied Bcp47.Subtags | subtags are in canonical form,
meaning that they are at least well-formed as specified by
https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | RFC 5646, and
all subtags are also
https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1.1 | capitalized as recommended.

**Signature:**

```typescript
static isCanonical(subtags: ISubtags): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtags</td><td>ISubtags</td><td>The Bcp47.Subtags | subtags to test.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the Bcp47.Subtags | subtags represent
a language tag in canonical, false otherwise.
