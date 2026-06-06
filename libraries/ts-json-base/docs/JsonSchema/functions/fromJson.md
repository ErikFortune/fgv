[Home](../../README.md) > [JsonSchema](../README.md) > fromJson

# Function: fromJson

Parses a raw JSON Schema object (e.g. one discovered at an MCP tool boundary) into a typed schema
value within the LLM-tool subset.

## Signature

```typescript
function fromJson(json: JsonObject): Result<ISchemaValidator<JsonValue>>
```
