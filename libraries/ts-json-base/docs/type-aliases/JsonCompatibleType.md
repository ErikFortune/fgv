[**@fgv/ts-json-base**](../README.md)

***

[@fgv/ts-json-base](../README.md) / JsonCompatibleType

# Type Alias: JsonCompatibleType\<T\>

> **JsonCompatibleType**\<`T`\> = [`IsUnknown`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> *extends* `true` ? [`JsonValue`](JsonValue.md) : `T` *extends* [`JsonPrimitive`](JsonPrimitive.md) \| `undefined` ? `T` : `T` *extends* `unknown`[] ? [`JsonCompatibleArray`](JsonCompatibleArray.md)\<`T`\[`number`\]\> : `T` *extends* `Function` ? \[`"Error: Function is not JSON-compatible"`\] : `T` *extends* `object` ? `{ [K in keyof T]: JsonCompatibleType<T[K]> }` : \[`"Error: Non-JSON type"`\]

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

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The type to be constrained |

## Returns

A constrained type that is compatible with JSON serialization.

## Example

```typescript
interface IUser {
  name: string;
  email?: string; // Optional property can be undefined
}

type UserCompatible = JsonCompatibleType<IUser>; // Allows undefined for email

const user: UserCompatible = {
  name: "John",
  email: undefined // This works
};

// Before JSON serialization, sanitize to remove undefined:
const sanitized = sanitizeJsonObject(user); // Removes undefined properties
JSON.stringify(sanitized.value); // Safe to serialize
```
