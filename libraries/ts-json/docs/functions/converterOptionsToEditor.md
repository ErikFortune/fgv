[Home](../README.md) > converterOptionsToEditor

# Function: converterOptionsToEditor

Creates a new JsonEditor | JsonEditor from an optionally supplied partial
IJsonConverterOptions | JSON converter options.
Expands supplied options with default values and constructs an editor with
matching configuration and defined rules.

## Signature

```typescript
function converterOptionsToEditor(partial: Partial<IJsonConverterOptions>): Result<JsonEditor>
```
