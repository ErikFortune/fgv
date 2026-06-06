[Home](../README.md) > mergeDefaultJsonConverterOptions

# Function: mergeDefaultJsonConverterOptions

Merges an optionally supplied partial set of IJsonConverterOptions | options with
the default converter options and taking all dynamic rules into account (e.g. template usage enabled
if variables are supplied and disabled if not),  producing a fully-resolved set of
IJsonConverterOptions | IJsonConverterOptions.

## Signature

```typescript
function mergeDefaultJsonConverterOptions(partial: Partial<IJsonConverterOptions>): IJsonConverterOptions
```
