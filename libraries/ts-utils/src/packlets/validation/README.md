[@fgv/ts-utils](../../../README.md) &rsaquo; **validation**

# In-Place Validation

The `validation` packlet provides type-safe validators that verify values in place, returning `Result<T>` without creating new objects.

## Table of Contents
- [Converter vs. Validator](#converter-vs-validator)
- [Key Exports](#key-exports)
- [Built-in Validators](#built-in-validators)
- [Object Validation](#object-validation)
- [Validator Modifiers](#validator-modifiers)
- [Type Guard Validators](#type-guard-validators)
- [Interop with Converters](#interop-with-converters)
- [When to Use Which](#when-to-use-which)

## Converter vs. Validator

The key distinction:

| Aspect | Converter | Validator |
|--------|-----------|-----------|
| **Purpose** | Transform `unknown` into `T` | Verify `unknown` is already `T` |
| **Output** | New object | Same object reference |
| **Use case** | JSON parsing, data transformation | Type confirmation, runtime checks |
| **Identity** | `result.value !== input` (new object) | `result.value === input` (same object) |

Both return `Result<T>` and share a compatible API surface.

## Key Exports

| Export | Description |
|--------|-------------|
| `Validator<T, TC>` | Core interface — validates `unknown` as `T`, returns `Result<T>` |
| `GenericValidator<T, TC>` | General-purpose implementation |
| `ObjectValidator<T, TC>` | Validates objects have required fields with correct types |
| `Validators` | Namespace containing all built-in validators and helpers |

Type parameters: `T` = validated type, `TC` = optional validation context.

## Built-in Validators

### Primitives

| Validator | Type | Description |
|-----------|------|-------------|
| `Validators.string` | `Validator<string>` | Validates value is a string |
| `Validators.number` | `Validator<number>` | Validates value is a number |
| `Validators.boolean` | `Validator<boolean>` | Validates value is a boolean |

### Structure Validators

| Factory | Description |
|---------|-------------|
| `Validators.object(fields, options?)` | Validate typed objects with per-field validators |
| `Validators.arrayOf(validator)` | Validate arrays where each element passes a validator |
| `Validators.recordOf(validator, options?)` | Validate `Record<K, V>` objects |

### Value Validators

| Factory | Description |
|---------|-------------|
| `Validators.enumeratedValue(values)` | Validate value is in an allowed set |
| `Validators.literal(value)` | Validate exact match (`===`) |
| `Validators.oneOf(validators)` | Try validators in sequence, return first success |
| `Validators.isA(description, guard)` | Validate using a type guard function |
| `Validators.generic(fn)` | Wrap a custom validator function |
| `Validators.compositeId(params)` | Validate composite IDs (`collectionId.itemId`) |

## Object Validation

```typescript
import { Validators } from '@fgv/ts-utils';

interface IUser {
  name: string;
  age: number;
  active: boolean;
}

const userValidator = Validators.object<IUser>({
  name: Validators.string,
  age: Validators.number,
  active: Validators.boolean,
});

const result = userValidator.validate(input); // Result<IUser>
```

### Optional Fields

```typescript
const validator = Validators.object<IUser>(
  {
    name: Validators.string,
    age: Validators.number,
    active: Validators.boolean,
  },
  { optionalFields: ['active'] }
);
```

### Strict Mode

Fails on unrecognized properties:

```typescript
const validator = Validators.object<IUser>(
  {
    name: Validators.string,
    age: Validators.number,
    active: Validators.boolean,
  },
  { strict: true }
);
```

### Partial Validation

```typescript
const partialValidator = userValidator.partial();
// All fields become optional
```

## Validator Modifiers

Validators support a fluent modifier API similar to Converters:

```typescript
// Accept undefined
Validators.number.optional();

// Add constraints
Validators.number.withConstraint((n) => n > 0);

// Brand the result type
Validators.string.withBrand<'UserId'>('UserId');

// Custom error formatting
Validators.string.withFormattedError(
  (value, message) => `Invalid name "${value}": ${message}`
);

// Fallback to another validator
Validators.number.or(alternateValidator);
```

## Type Guard Validators

Wrap existing type guard functions:

```typescript
class MyClass {
  static isMyClass(value: unknown): value is MyClass {
    return value instanceof MyClass;
  }
}

const validator = Validators.isA('MyClass', MyClass.isMyClass);
const result = validator.validate(input); // Result<MyClass>

// Also works as a type guard
if (validator.guard(input)) {
  // input is MyClass
}
```

## Interop with Converters

Converters and Validators are interchangeable in many contexts:

```typescript
import { Converters } from '@fgv/ts-utils';

// Wrap a Validator as a Converter
const converter = Converters.validated(myValidator);

// Wrap a Converter as a Validator
const validator = Converters.asValidator(myConverter);

// Detect which type you have
if (Converters.isValidator(converterOrValidator)) {
  // it's a Validator
}
```

### Mixed Field Definitions

Object converters accept both Converters and Validators as field definitions:

```typescript
const converter = Converters.object<IResource>({
  id: Converters.string,                    // Converter
  type: Validators.isA('Type', isType),      // Validator
  items: Converters.arrayOf(itemConverter),   // Converter
});
```

## When to Use Which

| Scenario | Use |
|----------|-----|
| Parsing JSON or external data | `Converter` — transforms and creates new objects |
| Confirming a value matches a type | `Validator` — checks in place, preserves identity |
| Objects with class instances | `Validator` — preserves prototype chain |
| Plain data structures | `Converter` — ensures clean, validated copy |
| Mixed scenarios | Either — they interop freely |

---

**Packlets:** [base](../base/README.md) | [conversion](../conversion/README.md) | **validation** | [collections](../collections/README.md) | [logging](../logging/README.md) | [hash](../hash/README.md)
