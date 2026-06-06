[Home](../README.md) > classifyJsonValue

# Function: classifyJsonValue

Identifies whether some `unknown` value is a JsonPrimitive | primitive,
JsonObject | object or JsonArray | array. Fails for any value
that cannot be converted to JSON (e.g. a function) _but_ this is a shallow test -
it does not test the properties of an object or elements in an array.

## Signature

```typescript
function classifyJsonValue(from: unknown): Result<JsonValueType>
```
