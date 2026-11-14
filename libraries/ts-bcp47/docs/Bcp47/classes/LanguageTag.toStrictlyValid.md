[Home](../../README.md) > [Bcp47](../README.md) > [LanguageTag](./LanguageTag.md) > toStrictlyValid

## LanguageTag.toStrictlyValid() method

Gets a confirmed strictly valid representation of this language tag.

**Signature:**

```typescript
toStrictlyValid(): Result<LanguageTag>;
```

**Returns:**

Result&lt;[LanguageTag](../../classes/LanguageTag.md)&gt;

`Success` with a strictly valid representation of this Bcp47.LanguageTag | language tag,
or `Failure` with details if the tag cannot be strictly validated.
