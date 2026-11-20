[Home](../../README.md) > [AiAssist](../README.md) > clientToolSchemaKeywords

# Function: clientToolSchemaKeywords

The keyword-capability table a client tool's parameter schema is adapted with when it is sent to
`descriptor` — the table to hand to `@fgv/ts-extras-mcp`'s `adaptMcpTools` (its
`schemaKeywords` option) so it admits exactly the MCP tools that wire can carry.

## Signature

```typescript
function clientToolSchemaKeywords(descriptor: IAiProviderDescriptor, options: { model?: string; endpoint?: string; verifiedEndpoint?: IAiVerifiedEndpoint }): SchemaKeywordCapabilities
```
