[@fgv/ts-utils](../../../README.md) &rsaquo; **conversion**

# Type-Safe Conversion

The `conversion` packlet provides a composable framework for converting `unknown` values into strongly-typed TypeScript objects, returning `Result<T>` on success or failure.

## Table of Contents
- [Overview](#overview)
- [Key Exports](#key-exports)
- [Built-in Converters](#built-in-converters)
- [Object Conversion](#object-conversion)
- [Array and Collection Conversion](#array-and-collection-conversion)
- [Converter Modifiers](#converter-modifiers)
- [String Matching](#string-matching)
- [Advanced Converters](#advanced-converters)
- [Type Inference](#type-inference)

## Overview

A `Converter<T, TC>` converts an `unknown` value to `T`, returning `Result<T>`. Converters compose to build type-safe pipelines — from primitive validation to complex object transformations — all with explicit error handling via the [Result pattern](../base/README.md).

```typescript
import { Converters } from '@fgv/ts-utils';

const result = Converters.string.convert(input); // Result<string>
```

## Key Exports

| Export | Description |
|--------|-------------|
| `Converter<T, TC>` | Core interface — converts `unknown` to `Result<T>` |
| `BaseConverter<T, TC>` | Standard implementation with fluent modifier API |
| `ObjectConverter<T, TC>` | Specialized converter for typed objects |
| `StringConverter<T, TC>` | String converter with `.matching()` methods |
| `DefaultingConverter<T, TD, TC>` | Wraps a converter with a fallback default value |
| `Converters` | Namespace containing all built-in converters and helpers |

Type parameters: `T` = output type, `TC` = optional conversion context.

## Built-in Converters

### Primitives

| Converter | Type | Description |
|-----------|------|-------------|
| `Converters.string` | `StringConverter<string>` | Accepts string values |
| `Converters.number` | `Converter<number>` | Accepts numbers or numeric strings |
| `Converters.boolean` | `Converter<boolean>` | Accepts booleans or `'true'`/`'false'` strings |
| `Converters.optionalString` | `Converter<string \| undefined>` | String or undefined |
| `Converters.optionalNumber` | `Converter<number \| undefined>` | Number or undefined |
| `Converters.optionalBoolean` | `Converter<boolean \| undefined>` | Boolean or undefined |
| `Converters.stringArray` | `Converter<string[]>` | Array of strings |
| `Converters.numberArray` | `Converter<number[]>` | Array of numbers |

### Value Converters

| Factory | Description |
|---------|-------------|
| `Converters.enumeratedValue(values)` | Validates value is in an allowed set |
| `Converters.literal(value)` | Validates exact match (`===`) |
| `Converters.delimitedString(delimiter, options?)` | Splits string by delimiter |
| `Converters.oneOf(converters)` | Tries converters in sequence, returns first success |
| `Converters.isA(description, guard)` | Creates converter from a type guard function |
| `Converters.validateWith(guard, description?)` | Creates converter from a type guard |
| `Converters.generic(fn)` | Wraps a raw converter function |

## Object Conversion

Use `Converters.object<T>()` for type-safe object conversion:

```typescript
interface IConfig {
  host: string;
  port: number;
  debug: boolean;
  tags: string[];
}

const configConverter = Converters.object<IConfig>({
  host: Converters.string,
  port: Converters.number,
  debug: Converters.boolean,
  tags: Converters.arrayOf(Converters.string),
});

const result = configConverter.convert(json); // Result<IConfig>
```

Everything is strongly-typed — Intellisense autocompletes property names and reports type mismatches in the field converters.

### Optional Fields

```typescript
const converter = Converters.object<IConfig>(
  {
    host: Converters.string,
    port: Converters.number,
    debug: Converters.boolean,
    tags: Converters.arrayOf(Converters.string),
  },
  { optionalFields: ['debug', 'tags'] }
);
```

### Strict Mode

Fails on unrecognized properties:

```typescript
const converter = Converters.strictObject<IConfig>({
  host: Converters.string,
  port: Converters.number,
});
```

### Partial and Required

```typescript
// Derive a partial converter (all fields optional)
const partialConverter = configConverter.partial();

// Derive a required converter (all fields required)
const requiredConverter = configConverter.required();

// Convert as partial in one call
const partial = configConverter.convertPartial(input);
```

### Discriminated Objects

For polymorphic types with a discriminator property:

```typescript
type Animal = ICat | IDog;

const animalConverter = Converters.discriminatedObject<Animal>('type', {
  cat: catConverter,
  dog: dogConverter,
});
```

## Array and Collection Conversion

| Factory | Description |
|---------|-------------|
| `Converters.arrayOf(converter, onError?)` | Convert array elements |
| `Converters.recordOf(converter, options?)` | Convert to `Record<K, V>` |
| `Converters.mapOf(converter, options?)` | Convert to `Map<K, V>` |
| `Converters.tuple(converters)` | Convert to strongly-typed tuple |
| `Converters.field(name, converter)` | Extract and convert a named property |
| `Converters.optionalField(name, converter)` | Extract optional property (succeeds with `undefined` if missing) |
| `Converters.element(index, converter)` | Extract and convert an array element |
| `Converters.optionalElement(index, converter)` | Extract optional array element |

### Error Handling in Arrays

```typescript
// Fail on first error (default)
Converters.arrayOf(Converters.number, 'failOnError');

// Silently skip failed elements
Converters.arrayOf(Converters.number, 'ignoreErrors');
```

### Tuple Conversion

```typescript
const pointConverter = Converters.tuple([
  Converters.number,
  Converters.number,
  Converters.number,
]);
// Result type: Result<[number, number, number]>
```

## Converter Modifiers

All converters support a fluent modifier API — each modifier returns a new converter:

### Optional and Defaults

```typescript
// Accept undefined input
Converters.number.optional();

// Always succeed with a default on failure
Converters.number.withDefault(0);
```

### Transformation

```typescript
// Transform the converted value
Converters.string.map((s) => succeed(s.toUpperCase()));

// Chain another converter after this one
Converters.string.mapConvert(dateConverter);
```

### Constraints

```typescript
// Add a validation constraint
Converters.number.withConstraint(
  (n) => n > 0 && n < 100,
  { description: 'must be between 1 and 99' }
);

// Apply a type guard
Converters.string.withTypeGuard(
  (s): s is NonEmptyString => s.length > 0,
  'must be non-empty'
);
```

### Branding

```typescript
// Create a branded type converter
type UserId = Brand<string, 'UserId'>;
const userIdConverter = Converters.string.withBrand<'UserId'>('UserId');
// Result type: Result<Brand<string, 'UserId'>>
```

### Error Formatting

```typescript
// Custom error messages
Converters.number.withFormattedError(
  (value, message) => `Invalid port "${value}": ${message}`
);
```

### Fallback

```typescript
// Try alternative converter on failure
Converters.number.or(Converters.string.map((s) => succeed(parseInt(s, 10))));
```

## String Matching

`StringConverter` adds a `.matching()` method for constraining string values:

```typescript
// Exact match
Converters.string.matching('expected');

// Match one of several values
Converters.string.matching(['red', 'green', 'blue']);

// Match a Set
Converters.string.matching(new Set(['admin', 'user']));

// Match a regex
Converters.string.matching(/^[a-z][a-z0-9-]*$/);

// Custom error message
Converters.string.matching(/^\d{3}$/, { message: 'must be a 3-digit code' });
```

## Advanced Converters

### Transform Objects

Reshape an object during conversion:

```typescript
const converter = Converters.transform<IOutput>({
  displayName: Converters.field('name', Converters.string),
  age: Converters.field('years', Converters.number),
});
```

For more control over source-to-destination mapping:

```typescript
const converter = Converters.transformObject<ISource, IDest>(
  {
    displayName: { from: 'name', converter: Converters.string },
    age: { from: 'years', converter: Converters.number },
  },
  { strict: true }
);
```

### Composite IDs

Parse and validate composite identifiers:

```typescript
const idConverter = Converters.compositeId(
  collectionIdConverter,
  '.',
  itemIdConverter
);
// Accepts "collection.item" string or { collectionId, itemId } object
```

## Type Inference

Use `Infer<typeof converter>` to extract the output type of a converter:

```typescript
const configConverter = Converters.object({
  host: Converters.string,
  port: Converters.number,
});

type Config = Infer<typeof configConverter>;
// Equivalent to: { host: string; port: number }
```

---

**Packlets:** [base](../base/README.md) | **conversion** | [validation](../validation/README.md) | [collections](../collections/README.md) | [logging](../logging/README.md) | [hash](../hash/README.md)
