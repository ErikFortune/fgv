[Home](../README.md) > [ValidateTag](./ValidateTag.md) > isValid

## ValidateTag.isValid() method

Determines if supplied Bcp47.Subtags | subtags are
valid as specified by https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | RFC 5646,
meaning that all subtags, or the tag itself for grandfathered tags, are defined in the
https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry | IANA language subtag registry.

**Signature:**

```typescript
static isValid(subtags: ISubtags): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtags</td><td>ISubtags</td><td>The Bcp47.Subtags | subtags to test.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the Bcp47.Subtags | subtags represent
a valid language tag, false otherwise.
