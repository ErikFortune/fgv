[Home](../../README.md) > [AiAssist](../README.md) > structuredOutputSchemaKeywords

# Function: structuredOutputSchemaKeywords

The keyword-capability table a structured-output schema is adapted with when it is sent to
`descriptor` for `model` — the structured-output sibling of `clientToolSchemaKeywords`.

## Signature

```typescript
function structuredOutputSchemaKeywords(descriptor: IAiProviderDescriptor, options: { model: string; endpoint?: string; verifiedEndpoint?: IAiVerifiedEndpoint }): SchemaKeywordCapabilities | undefined
```
