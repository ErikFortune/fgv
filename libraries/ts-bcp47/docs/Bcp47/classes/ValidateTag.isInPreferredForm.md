[Home](../../README.md) > [Bcp47](../README.md) > [ValidateTag](./ValidateTag.md) > isInPreferredForm

## ValidateTag.isInPreferredForm() method

Determines if supplied Bcp47.Subtags | subtags are
in preferred form. Preferred form is valid as specified by
https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | RFC 5646 and
also meets additional preferences specified in the
https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry | language subtag registry -
extraneous (suppressed) script tags, deprecated language, extlang, script or region tags or
deprecated grandfathered or redundant tags (with a defined preferred-value) are not allowed.

**Signature:**

```typescript
static isInPreferredForm(subtags: ISubtags): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtags</td><td>ISubtags</td><td>The Bcp47.Subtags | subtags to test.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the Bcp47.Subtags | subtags represent
a valid language tag in preferred form, false otherwise.
