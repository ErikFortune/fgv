[Home](../README.md) > [IJsonEditorValidationOptions](./IJsonEditorValidationOptions.md) > onUndefinedPropertyValue

## IJsonEditorValidationOptions.onUndefinedPropertyValue property

If `onUndefinedPropertyValue` is `'error'`, then any property with
value `undefined` will cause an error and stop conversion.  If
`onUndefinedPropertyValue` is `'ignore'` (default) then any
property with value `undefined` is silently ignored.

**Signature:**

```typescript
onUndefinedPropertyValue: "error" | "ignore";
```
