[Home](../README.md) > [IJsonConverterOptions](./IJsonConverterOptions.md) > useReferences

## IJsonConverterOptions.useReferences property

If `true` and if a IJsonReferenceMap | references map is supplied
in IJsonConverterOptions.refs | refs, then references in the source
object will be replaced with the corresponding value from the reference map.

Default is `true` if IJsonConverterOptions.refs | refs are present in options,
`false` otherwise.

**Signature:**

```typescript
useReferences: boolean;
```
