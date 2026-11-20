[Home](../../README.md) > [Bcp47](../README.md) > [NormalizeTag](./NormalizeTag.md) > normalizeSubtags

## NormalizeTag.normalizeSubtags() method

Normalizes supplied Bcp47.Subtags | subtags to a requested
Bcp47.TagNormalization | normalization level, if necessary.  If
no normalization is necessary, returns the supplied subtags.

**Signature:**

```typescript
static normalizeSubtags(subtags: ISubtags, wantNormalization: TagNormalization, haveNormalization?: TagNormalization): Result<ISubtags>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtags</td><td>ISubtags</td><td>The Bcp47.Subtags | subtags to be normalized.</td></tr>
<tr><td>wantNormalization</td><td>TagNormalization</td><td>The desired Bcp47.TagNormalization | normalization level.</td></tr>
<tr><td>haveNormalization</td><td>TagNormalization</td><td>(optional) The current Bcp47.TagNormalization | normalization level.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ISubtags](../../interfaces/ISubtags.md)&gt;

`Success` with the normalized Bcp47.Subtags | subtags, or
`Failure` with details if an error occurs.
