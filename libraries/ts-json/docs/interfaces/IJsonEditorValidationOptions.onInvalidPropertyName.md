[Home](../README.md) > [IJsonEditorValidationOptions](./IJsonEditorValidationOptions.md) > onInvalidPropertyName

## IJsonEditorValidationOptions.onInvalidPropertyName property

If `onInvalidPropertyName` is `'error'` (default) then any property name
that is invalid after template rendering causes an error and stops
conversion.  If `onInvalidPropertyName` is `'ignore'`, then names which
are invalid after template rendering are passed through unchanged.

**Signature:**

```typescript
onInvalidPropertyName: "error" | "ignore";
```
