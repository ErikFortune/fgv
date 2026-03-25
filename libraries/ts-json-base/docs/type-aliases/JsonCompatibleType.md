[Home](../README.md) > JsonCompatibleType

# Type Alias: JsonCompatibleType

A constrained type that is compatible with JSON serialization.

This type transforms input types to ensure they can be safely serialized to JSON:
- JSON primitives (string, number, boolean, null) are preserved as-is
- `undefined` is allowed for TypeScript compatibility with optional properties
- Objects are recursively transformed with all properties made JSON-compatible
- Arrays are transformed to contain only JSON-compatible elements
- Functions are transformed to error types
- Other non-JSON types are transformed to error types

Note: While `undefined` is technically not JSON-serializable, it's allowed here
to support TypeScript's optional property patterns. Use `sanitizeJsonObject`
to remove undefined properties before actual JSON serialization.

## Type

```typescript
type JsonCompatibleType = IsUnknown<T> extends true ? JsonValue : T extends JsonPrimitive | undefined ? T : T extends unknown[] ? JsonCompatibleArray<T[number]> : T extends Function ? ["Error: Function is not JSON-compatible"] : T extends object ? { [K in keyof T]: JsonCompatibleType<T[K]> } : ["Error: Non-JSON type"]
```
