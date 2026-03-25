[**@fgv/ts-json**](../../../../README.md)

***

[@fgv/ts-json](../../../../README.md) / [Diff](../README.md) / jsonEquals

# Function: jsonEquals()

> **jsonEquals**(`obj1`, `obj2`): `boolean`

A simpler helper function that returns true if two JSON values are deeply equal.

This function provides a fast boolean check for JSON equality without the overhead
of tracking individual changes. It performs the same deep comparison logic as
[Diff.jsonDiff](jsonDiff.md) but returns only a true/false result, making it ideal for
conditional logic and validation scenarios.

**Key Features:**
- Deep recursive comparison of all nested structures
- Handles all JSON types: objects, arrays, primitives, null
- Object property order independence
- Array order significance (index positions matter)
- Performance optimized for equality checking

**Use Cases:**
- Conditional logic based on data equality
- Input validation and testing assertions
- Caching and memoization keys
- Quick checks before expensive diff operations

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `obj1` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The first JSON value to compare |
| `obj2` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The second JSON value to compare |

## Returns

`boolean`

True if the values are deeply equal, false otherwise

## Examples

```typescript
// Objects with same structure and values
const user1 = { name: "John", hobbies: ["reading", "gaming"] };
const user2 = { name: "John", hobbies: ["reading", "gaming"] };
console.log(jsonEquals(user1, user2)); // true

// Different property order (still equal)
const obj1 = { a: 1, b: 2 };
const obj2 = { b: 2, a: 1 };
console.log(jsonEquals(obj1, obj2)); // true

// Different values
const before = { status: "pending" };
const after = { status: "completed" };
console.log(jsonEquals(before, after)); // false
```

```typescript
const config1 = {
  database: { host: "localhost", port: 5432 },
  features: ["auth", "cache"]
};
const config2 = {
  database: { host: "localhost", port: 5432 },
  features: ["auth", "cache"]
};

if (jsonEquals(config1, config2)) {
  console.log("Configurations are identical");
}
```

```typescript
const list1 = [1, 2, 3];
const list2 = [3, 2, 1];
console.log(jsonEquals(list1, list2)); // false - order matters

const list3 = [1, 2, 3];
const list4 = [1, 2, 3];
console.log(jsonEquals(list3, list4)); // true - same order
```

## See

 - [Diff.jsonDiff](jsonDiff.md) for detailed change analysis when equality fails
 - [jsonThreeWayDiff](jsonThreeWayDiff.md) for actionable difference results
