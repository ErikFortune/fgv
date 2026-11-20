[Home](../../README.md) > [Bcp47](../README.md) > [LanguageTag](./LanguageTag.md) > toValid

## LanguageTag.toValid() method

Gets a confirmed valid representation of this language tag.

**Signature:**

```typescript
toValid(): Result<LanguageTag>;
```

**Returns:**

Result&lt;[LanguageTag](../../classes/LanguageTag.md)&gt;

`Success` with a valid representation of this Bcp47.LanguageTag | language tag,
or `Failure` with details if the tag cannot be validated.
