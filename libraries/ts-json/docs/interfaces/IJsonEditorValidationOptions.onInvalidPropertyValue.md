[Home](../README.md) > [IJsonEditorValidationOptions](./IJsonEditorValidationOptions.md) > onInvalidPropertyValue

## IJsonEditorValidationOptions.onInvalidPropertyValue property

If `onInvalidPropertyValue` is `'error'` (default) then any illegal
property value other than `undefined` causes an error and stops
conversion.  If `onInvalidPropertyValue` is `'ignore'` then any
invalid property values are silently ignored.

**Signature:**

```typescript
onInvalidPropertyValue: "error" | "ignore";
```
