[Home](../../README.md) > [JsonSchema](../README.md) > adaptSchemaKeywords

# Function: adaptSchemaKeywords

Adapts a wire schema's constraint and annotation keywords, and its non-string enums and untyped
nodes, to one provider's documented support, per `capabilities`: each keyword is passed,
translated, folded into the node's description, or (an annotation) dropped; a non-string `enum`
is passed or folded; and a node with no `type` is passed or refused.

## Signature

```typescript
function adaptSchemaKeywords(schema: JsonValue, capabilities: SchemaKeywordCapabilities): Result<JsonValue>
```
