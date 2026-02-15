[@fgv/ts-utils](../../../README.md) &rsaquo; **base**

# Result Pattern and Core Utilities

The `base` packlet provides the foundational Result pattern and core utilities used throughout the `@fgv/ts-utils` library and its consumers.

## Table of Contents
- [Overview](#overview)
- [Key Exports](#key-exports)
- [Creating Results](#creating-results)
- [Checking Results](#checking-results)
- [Extracting Values](#extracting-values)
- [Result Chaining](#result-chaining)
- [Error Context](#error-context)
- [DetailedResult](#detailedresult)
- [Error Aggregation](#error-aggregation)
- [populateObject](#populateobject)
- [Branded Types](#branded-types)
- [Factory Pattern](#factory-pattern)
- [Best Practices](#best-practices)
- [Anti-Patterns](#anti-patterns)

## Overview

A `Result<T>` represents the success or failure of an operation. A successful result (`Success<T>`) contains a `value` of type `T`, while a failure result (`Failure<T>`) contains an error `message` of type `string`. This makes error handling explicit and type-safe, avoiding exceptions for expected error conditions.

## Key Exports

| Export | Description |
|--------|-------------|
| `Result<T>` | Union type of `Success<T> \| Failure<T>` |
| `Success<T>` | Successful result containing a value |
| `Failure<T>` | Failed result containing an error message |
| `DetailedResult<T, TD>` | Result with additional detail metadata |
| `succeed(value)` | Create a `Success<T>` |
| `fail(message)` | Create a `Failure<T>` |
| `captureResult(fn)` | Wrap a throwing function into a `Result<T>` |
| `MessageAggregator` | Collect and format multiple error messages |
| `mapResults(results)` | Aggregate array of results (all must succeed) |
| `mapSuccess(results)` | Collect successful results (fails only if all fail) |
| `mapFailures(results)` | Extract error messages from failed results |
| `allSucceed(results, value)` | Ensure all results succeed, returning a value |
| `firstSuccess(results)` | Return the first successful result |
| `populateObject(init)` | Build typed objects from field initializers |
| `Brand<T, B>` | Branded type to prevent accidental type mixing |
| `DeferredResult<T>` | Lazy `() => Result<T>` for deferred evaluation |

## Creating Results

```typescript
import { Result, succeed, fail, captureResult } from '@fgv/ts-utils';

// Explicit success and failure
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

## Checking Results

```typescript
const result = someOperation();

if (result.isSuccess()) {
  console.log(result.value); // TypeScript narrows to Success<T>
} else {
  console.error(result.message); // TypeScript narrows to Failure<T>
}

// Destructuring
const { value, message } = someOperation();
if (value !== undefined) {
  // use value
}
```

## Extracting Values

```typescript
// orThrow() — ONLY in setup/initialization code
const config = loadConfig().orThrow();

// orThrow() with a logger
const config = loadConfig().orThrow(logger);

// orThrow() with error formatting
const config = loadConfig().orThrow((msg) => `Config load failed: ${msg}`);

// orDefault() — safe fallback
const port = getPort().orDefault(3000);
const name = getName().orDefault(undefined);
```

## Result Chaining

Use `onSuccess()` and `onFailure()` to chain operations:

```typescript
// Chain successful operations
function processData(input: string): Result<ProcessedData> {
  return parseInput(input)
    .onSuccess((parsed) => validate(parsed))
    .onSuccess((valid) => transform(valid));
}

// Handle failures
function loadWithFallback(primary: string, fallback: string): Result<Config> {
  return loadConfig(primary)
    .onFailure(() => loadConfig(fallback));
}

// Transform values
function getUserName(id: UserId): Result<string> {
  return getUser(id)
    .onSuccess((user) => succeed(`${user.firstName} ${user.lastName}`));
}
```

## Error Context

Use `withErrorFormat()` to add context as errors propagate:

```typescript
function loadUserProfile(userId: string): Result<UserProfile> {
  return loadUser(userId)
    .withErrorFormat((msg) => `Failed to load user ${userId}: ${msg}`)
    .onSuccess((user) =>
      loadProfile(user.profileId)
        .withErrorFormat((msg) => `Failed to load profile for user ${userId}: ${msg}`)
    );
}
```

## DetailedResult

`DetailedResult<T, TD>` extends `Result<T>` with a `detail` property for discriminated metadata, commonly used by [collections](../collections/README.md).

```typescript
import { succeedWithDetail, failWithDetail } from '@fgv/ts-utils';

// Create detailed results
const added = succeedWithDetail(item, 'added');
const notFound = failWithDetail('Not found', 'not-found');

// Add detail to existing results
const detailed = succeed(value).withDetail('success');
const detailedFail = fail('error').withFailureDetail('validation-error');

// Convert back to plain Result
const plain: Result<T> = detailedResult.asResult;
```

The `asResult` property strips detail, which is useful when chaining from APIs that return `DetailedResult` (like `ResultMap.get()`) into code expecting `Result`:

```typescript
function resolveItem(id: ItemId): Result<ResolvedItem> {
  return this._items.get(id)
    .asResult
    .withErrorFormat((msg) => `item ${id}: ${msg}`)
    .onSuccess((item) => succeed({ id, item }));
}
```

## Error Aggregation

### MessageAggregator

Collect multiple errors before deciding whether to fail:

```typescript
import { MessageAggregator } from '@fgv/ts-utils';

function validateAll(data: Data): Result<ValidatedData> {
  const aggregator = new MessageAggregator();

  validateField1(data.field1).aggregateError(aggregator);
  validateField2(data.field2).aggregateError(aggregator);
  validateField3(data.field3).aggregateError(aggregator);

  if (aggregator.hasMessages) {
    return fail(aggregator.toString('; '));
  }
  return succeed(createValidatedData(data));
}
```

### mapResults

All results must succeed, or all errors are aggregated:

```typescript
import { mapResults } from '@fgv/ts-utils';

function processItems(items: Item[]): Result<ProcessedItem[]> {
  return mapResults(items.map((item) => processItem(item)));
}
```

### mapSuccess

Collect successful results, failing only if every result fails:

```typescript
import { mapSuccess } from '@fgv/ts-utils';

function processBestEffort(items: Item[]): Result<ProcessedItem[]> {
  return mapSuccess(items.map((item) => processItem(item)));
}
```

### allSucceed

Ensure all operations succeed, returning a specified value:

```typescript
import { allSucceed } from '@fgv/ts-utils';

function validateForm(data: FormData): Result<FormData> {
  return allSucceed(
    [validateName(data.name), validateEmail(data.email), validateAge(data.age)],
    data
  );
}
```

### firstSuccess

Return the first successful result from a sequence:

```typescript
import { firstSuccess } from '@fgv/ts-utils';

function loadConfig(): Result<Config> {
  return firstSuccess([
    () => loadFromEnv(),
    () => loadFromFile('.config.json'),
    () => succeed(defaultConfig),
  ]);
}
```

## populateObject

Build a typed object from a set of field initializers that each return `Result<T>`:

```typescript
import { populateObject } from '@fgv/ts-utils';

interface Config {
  host: string;
  port: number;
  debug: boolean;
}

function loadConfig(source: unknown): Result<Config> {
  return populateObject<Config>({
    host: () => Converters.string.convert(getField(source, 'host')),
    port: () => Converters.number.convert(getField(source, 'port')),
    debug: () => Converters.boolean.convert(getField(source, 'debug')),
  });
}
```

Each field initializer is called in turn. If all succeed, the assembled object is returned. If any fail, errors are aggregated.

## Branded Types

Use `Brand<T, B>` to prevent accidental mixing of structurally identical types:

```typescript
import { Brand } from '@fgv/ts-utils';

type UserId = Brand<string, 'UserId'>;
type ProductId = Brand<string, 'ProductId'>;

// These are both strings but cannot be assigned to each other
const userId = 'user-1' as UserId;
const productId = 'prod-1' as ProductId;

// Converter integration
const userIdConverter = Converters.string.withBrand<'UserId'>('UserId');
```

## Factory Pattern

Classes with fallible constructors should use `private`/`protected` constructors with a static `create` method:

```typescript
class ResourceManager {
  private constructor(private config: Config) {
    if (!config.name) {
      throw new Error('Config name is required');
    }
  }

  public static create(params: Params): Result<ResourceManager> {
    return validateParams(params)
      .onSuccess((valid) => loadConfig(valid))
      .onSuccess((config) => captureResult(() => new ResourceManager(config)));
  }
}

// Usage
const manager = ResourceManager.create(params).orThrow(); // setup
const result = ResourceManager.create(params); // application code
```

## Best Practices

- **Return `Result<T>` from fallible operations** — never throw in business logic
- **Use `orThrow()` only in setup/initialization** — never in business logic
- **Prefer chaining** over intermediate variables for straightforward flows
- **Add context with `withErrorFormat()`** as errors propagate
- **Use `MessageAggregator`** for collecting multiple errors, not manual arrays
- **Avoid `Result<void>`** — return a meaningful value instead
- **Include identifiers in error messages** — `fail(\`item \${id}: not found\`)`

## Anti-Patterns

- **Don't throw in Result chains** — use `return fail(...)` instead
- **Don't ignore Results** — always handle or chain the result
- **Don't use unnecessary intermediate variables** for simple chains
- **Don't manually accumulate errors** — use `MessageAggregator` or `mapResults()`
- **Don't use Result matchers in test setup** — use `orThrow()` in `beforeEach`

---

**Packlets:** **base** | [conversion](../conversion/README.md) | [validation](../validation/README.md) | [collections](../collections/README.md) | [logging](../logging/README.md) | [hash](../hash/README.md)
