[Home](../README.md) > [IFormatValueForMessageOptions](./IFormatValueForMessageOptions.md) > style

## IFormatValueForMessageOptions.style property

How to render the value:
- `'json'` (default): the `JSON.stringify` rendering described at formatValueForMessage.
- `'string'`: `String(value)`, which is what interpolating the value into a template literal
  produces, except for a symbol, where a template literal throws and `String()` does not. Falls
  back to the `'json'` rendering when `String()` throws (a null-prototype object, a Proxy whose
  traps throw, a throwing `toString`). For messages that have always interpolated the value
  directly and whose text must not change. It invokes the value's own `toString` /
  `Symbol.toPrimitive`. Its default bound is the larger
  DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH: the text of such a message was never bounded,
  and is unchanged up to that length, but `String()` of a large array runs to megabytes.

**Signature:**

```typescript
readonly style: "string" | "json";
```
