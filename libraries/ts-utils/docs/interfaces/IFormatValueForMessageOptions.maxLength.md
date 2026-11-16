[Home](../README.md) > [IFormatValueForMessageOptions](./IFormatValueForMessageOptions.md) > maxLength

## IFormatValueForMessageOptions.maxLength property

Maximum length of the returned text, in UTF-16 code units, including the trailing
ellipsis (`…`) that marks a truncated rendering. Values below 1 or that are not numbers
select the default. Default DEFAULT_FORMAT_VALUE_MAX_LENGTH for the `'json'` style and
DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH for the `'string'` style.

**Signature:**

```typescript
readonly maxLength: number;
```
