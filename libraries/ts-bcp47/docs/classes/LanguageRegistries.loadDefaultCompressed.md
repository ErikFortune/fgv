[Home](../README.md) > [LanguageRegistries](./LanguageRegistries.md) > loadDefaultCompressed

## LanguageRegistries.loadDefaultCompressed() method

Loads language registries from embedded compressed data.
This method uses embedded compressed ZIP data that works in both Node.js and browser environments
without requiring polyfills. This is the preferred loading method for published packages.

**Signature:**

```typescript
static loadDefaultCompressed(): Result<LanguageRegistries>;
```

**Returns:**

Result&lt;[LanguageRegistries](LanguageRegistries.md)&gt;

A Result containing the loaded LanguageRegistries or an error.
