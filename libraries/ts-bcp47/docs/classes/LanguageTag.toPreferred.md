[Home](../README.md) > [LanguageTag](./LanguageTag.md) > toPreferred

## LanguageTag.toPreferred() method

Gets a confirmed preferred representation of this language tag.

**Signature:**

```typescript
toPreferred(): Result<LanguageTag>;
```

**Returns:**

Result&lt;[LanguageTag](LanguageTag.md)&gt;

`Success` with a preferred representation of this Bcp47.LanguageTag | language tag,
or `Failure` with details if the tag cannot be normalized to preferred form.
