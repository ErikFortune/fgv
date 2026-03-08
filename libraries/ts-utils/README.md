# @fgv/ts-utils

Type-safe utilities for TypeScript — Result pattern, composable converters and validators, and Result-aware collections.

## Installation

```sh
npm install @fgv/ts-utils
```

## Overview

`@fgv/ts-utils` provides a cohesive set of utilities built around the Result pattern. Instead of throwing exceptions for expected error conditions, all fallible operations return `Result<T>` — making errors explicit in the type system and enabling safe, composable error handling.

The library is organized into six packlets, each with its own detailed documentation.

## The Result Pattern

A `Result<T>` is either a `Success<T>` containing a value, or a `Failure<T>` containing an error message. This replaces exception-based error handling with explicit, chainable results.

### Creating Results

```typescript
import { Result, succeed, fail, captureResult } from '@fgv/ts-utils';

function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return fail('Division by zero');
  }
  return succeed(a / b);
}

// Wrap throwing code
function parseJson(text: string): Result<unknown> {
  return captureResult(() => JSON.parse(text));
}
```

### Extracting Values

```typescript
// In setup/initialization — converts failure to exception
const config = loadConfig().orThrow();

// Safe fallback
const port = getPort().orDefault(3000);
```

### Chaining Operations

```typescript
function processData(input: string): Result<ProcessedData> {
  return parseInput(input)
    .onSuccess((parsed) => validate(parsed))
    .onSuccess((valid) => transform(valid));
}
```

### Error Context

```typescript
function loadUser(id: string): Result<User> {
  return fetchUser(id)
    .withErrorFormat((msg) => `Failed to load user ${id}: ${msg}`);
}
```

### Error Aggregation

```typescript
import { mapResults, MessageAggregator } from '@fgv/ts-utils';

// Aggregate array of results
const results = items.map((item) => processItem(item));
return mapResults(results); // All must succeed, or errors are aggregated

// Collect errors manually
const aggregator = new MessageAggregator();
validateA(data).aggregateError(aggregator);
validateB(data).aggregateError(aggregator);
if (aggregator.hasMessages) {
  return fail(aggregator.toString('; '));
}
```

### Factory Pattern

```typescript
class ResourceManager {
  private constructor(private config: Config) { /* may throw */ }

  public static create(params: Params): Result<ResourceManager> {
    return validateParams(params)
      .onSuccess((valid) => loadConfig(valid))
      .onSuccess((config) => captureResult(() => new ResourceManager(config)));
  }
}
```

### Best Practices

- Return `Result<T>` from fallible operations — never throw in business logic
- Use `orThrow()` only in setup/initialization
- Prefer chaining over intermediate variables
- Add context with `withErrorFormat()` as errors propagate
- Use `MessageAggregator` for collecting multiple errors

[Full Result pattern documentation &rarr;](./src/packlets/base/README.md)

## Type-Safe Conversion

`Converter<T>` converts `unknown` to `T`, returning `Result<T>`. Converters compose to build type-safe pipelines for JSON parsing and data transformation.

```typescript
import { Converters } from '@fgv/ts-utils';

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

const config = configConverter.convert(json).orThrow();
```

Converters support a fluent modifier API:

```typescript
Converters.number
  .withConstraint((n) => n > 0 && n < 65536, { description: 'valid port' })
  .withBrand<'Port'>('Port');
```

[Full conversion documentation &rarr;](./src/packlets/conversion/README.md)

## In-Place Validation

`Validator<T>` verifies a value is of type `T` without creating a new object — preserving object identity and prototype chains.

```typescript
import { Validators } from '@fgv/ts-utils';

const userValidator = Validators.object<IUser>({
  name: Validators.string,
  age: Validators.number,
  active: Validators.boolean,
});

const result = userValidator.validate(input); // Result<IUser>
```

Converters and Validators interoperate — use either as field definitions in object converters.

[Full validation documentation &rarr;](./src/packlets/validation/README.md)

## Type-Safe Collections

`ResultMap` provides a `Map`-like API where all operations return `DetailedResult` with discriminated details (`'added'`, `'exists'`, `'not-found'`, etc.):

```typescript
import { ResultMap } from '@fgv/ts-utils';

const map = new ResultMap<string, number>();
map.add('key', 42);           // detail: 'added'
map.add('key', 99);           // detail: 'exists' (failure)
map.get('key');                // detail: 'exists', value: 42
map.get('missing');            // detail: 'not-found' (failure)
```

The collections packlet also provides `Collector` (append-only with write-once indexing), `ValidatingResultMap` (weakly-typed access with validation), `ConvertingResultMap` (lazy conversion with caching), and `AggregatedResultMap` (multi-collection composite IDs).

[Full collections documentation &rarr;](./src/packlets/collections/README.md)

## Additional Utilities

- **[Logging](./src/packlets/logging/README.md)** — Level-based logging with `ConsoleLogger`, `InMemoryLogger` (for testing), and `LogReporter` for Result-aware reporting.
- **[Hashing](./src/packlets/hash/README.md)** — Deterministic hashing of nested objects with `Crc32Normalizer`, producing consistent hashes regardless of property order.

## Packlet Reference

| Packlet | Description | Documentation |
|---------|-------------|---------------|
| `base` | Result pattern, error aggregation, branded types | [README](./src/packlets/base/README.md) |
| `conversion` | Type-safe converters (`unknown` &rarr; `T`) | [README](./src/packlets/conversion/README.md) |
| `validation` | In-place validators (verify without transforming) | [README](./src/packlets/validation/README.md) |
| `collections` | Result-aware Map/Collection with validation layers | [README](./src/packlets/collections/README.md) |
| `logging` | Level-based logging with Result integration | [README](./src/packlets/logging/README.md) |
| `hash` | Deterministic object hashing | [README](./src/packlets/hash/README.md) |

## API Documentation

Extracted API documentation is [here](./docs/ts-utils.md).
