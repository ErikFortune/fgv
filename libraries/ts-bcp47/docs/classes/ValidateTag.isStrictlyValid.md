[Home](../README.md) > [ValidateTag](./ValidateTag.md) > isStrictlyValid

## ValidateTag.isStrictlyValid() method

Determines if supplied Bcp47.Subtags | subtags are
strictly valid.  A strictly valid tag is both
https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | valid as defined in the RFC
and meets any other requirements such as
https://www.rfc-editor.org/rfc/rfc5646.html#section-3.1.8 | prefix validity.

**Signature:**

```typescript
static isStrictlyValid(subtags: ISubtags): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtags</td><td>ISubtags</td><td>The Bcp47.Subtags | subtags to test.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the Bcp47.Subtags | subtags represent
a strictly valid language tag, false otherwise.
