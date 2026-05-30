[Home](../README.md) > [LanguageRegistries](./LanguageRegistries.md) > loadFromUrls

## LanguageRegistries.loadFromUrls() method

Loads language registries from custom URLs.

**Signature:**

```typescript
static loadFromUrls(subtagsUrl: string, extensionsUrl: string): Promise<Result<LanguageRegistries>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>subtagsUrl</td><td>string</td><td>URL to the language subtags registry.</td></tr>
<tr><td>extensionsUrl</td><td>string</td><td>URL to the language tag extensions registry.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[LanguageRegistries](LanguageRegistries.md)&gt;&gt;

A Promise with a Result containing the loaded LanguageRegistries or an error.
