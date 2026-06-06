[**@fgv Monorepo API Documentation**](../../README.md)

***

[@fgv Monorepo API Documentation](../../README.md) / @fgv/ts-utils

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

### Async Chaining

Use `thenOnSuccess()` to chain async operations without breaking the fluent style:

```typescript
import { Result, succeed, captureAsyncResult } from '@fgv/ts-utils';

async function processData(input: string): Promise<Result<SavedData>> {
  return parseInput(input)
    .onSuccess((parsed) => validate(parsed))
    .thenOnSuccess(async (valid) => fetchRelatedData(valid.id))
    .onSuccess((data) => transform(data))
    .thenOnSuccess(async (transformed) => saveData(transformed))
    .withErrorFormat((msg) => `pipeline failed: ${msg}`);
}
```

`AsyncResult<T>` implements `PromiseLike`, so the entire chain can be directly `await`ed. Rejected promises are caught and converted to `Failure`.

[Full async chaining documentation &rarr;](../../_media/README.md#async-result-chaining)

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

[Full Result pattern documentation &rarr;](../../_media/README.md)

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

[Full conversion documentation &rarr;](../../_media/README-1.md)

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

[Full validation documentation &rarr;](../../_media/README-2.md)

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

[Full collections documentation &rarr;](../../_media/README-3.md)

## Additional Utilities

- **[Logging](../../_media/README-4.md)** — Level-based logging with `ConsoleLogger`, `InMemoryLogger` (for testing), and `LogReporter` for Result-aware reporting.
- **[Hashing](../../_media/README-5.md)** — Deterministic hashing of nested objects with `Crc32Normalizer`, producing consistent hashes regardless of property order.

## Packlet Reference

| Packlet | Description | Documentation |
|---------|-------------|---------------|
| `base` | Result pattern, error aggregation, branded types | [README](../../_media/README.md) |
| `conversion` | Type-safe converters (`unknown` &rarr; `T`) | [README](../../_media/README-1.md) |
| `validation` | In-place validators (verify without transforming) | [README](../../_media/README-2.md) |
| `collections` | Result-aware Map/Collection with validation layers | [README](../../_media/README-3.md) |
| `logging` | Level-based logging with Result integration | [README](../../_media/README-4.md) |
| `hash` | Deterministic object hashing | [README](../../_media/README-5.md) |

## API Documentation

Extracted API documentation is [here](./docs/ts-utils.md).

## Namespaces

- [Collections](namespaces/Collections/README.md)
- [Conversion](namespaces/Conversion/README.md)
- [Converters](namespaces/Converters/README.md)
- [Hash](namespaces/Hash/README.md)
- [Logging](namespaces/Logging/README.md)
- [Validation](namespaces/Validation/README.md)
- [Validators](namespaces/Validators/README.md)

## Classes

- [AggregatedResultMap](classes/AggregatedResultMap.md)
- [AsyncResult](classes/AsyncResult.md)
- [DetailedFailure](classes/DetailedFailure.md)
- [DetailedSuccess](classes/DetailedSuccess.md)
- [Failure](classes/Failure.md)
- [MessageAggregator](classes/MessageAggregator.md)
- [Normalizer](classes/Normalizer.md)
- [Success](classes/Success.md)

## Interfaces

- [IMessageAggregator](interfaces/IMessageAggregator.md)
- [IMessageReportDetail](interfaces/IMessageReportDetail.md)
- [IResult](interfaces/IResult.md)
- [IResultLogger](interfaces/IResultLogger.md)
- [IResultReporter](interfaces/IResultReporter.md)
- [IResultReportOptions](interfaces/IResultReportOptions.md)
- [PopulateObjectOptions](interfaces/PopulateObjectOptions.md)

## Type Aliases

- [AsyncFailureContinuation](type-aliases/AsyncFailureContinuation.md)
- [AsyncSuccessContinuation](type-aliases/AsyncSuccessContinuation.md)
- [Brand](type-aliases/Brand.md)
- [DeferredResult](type-aliases/DeferredResult.md)
- [DetailedFailureContinuation](type-aliases/DetailedFailureContinuation.md)
- [DetailedResult](type-aliases/DetailedResult.md)
- [DetailedResultValueType](type-aliases/DetailedResultValueType.md)
- [DetailedSuccessContinuation](type-aliases/DetailedSuccessContinuation.md)
- [EnsureArrayResult](type-aliases/EnsureArrayResult.md)
- [ErrorFormatter](type-aliases/ErrorFormatter.md)
- [FailureContinuation](type-aliases/FailureContinuation.md)
- [FieldInitializers](type-aliases/FieldInitializers.md)
- [IResultValueType](type-aliases/IResultValueType.md)
- [MessageLogLevel](type-aliases/MessageLogLevel.md)
- [Result](type-aliases/Result.md)
- [ResultDetailType](type-aliases/ResultDetailType.md)
- [ResultMapValueType](type-aliases/ResultMapValueType.md)
- [ResultValueType](type-aliases/ResultValueType.md)
- [SuccessContinuation](type-aliases/SuccessContinuation.md)

## Functions

- [\_errorMessage](functions/errorMessage.md)
- [allSucceed](functions/allSucceed.md)
- [captureAsyncResult](functions/captureAsyncResult.md)
- [captureResult](functions/captureResult.md)
- [ensureArray](functions/ensureArray.md)
- [entriesForRecord](functions/entriesForRecord.md)
- [fail](functions/fail.md)
- [fails](functions/fails.md)
- [failsWithDetail](functions/failsWithDetail.md)
- [failWithDetail](functions/failWithDetail.md)
- [firstSuccess](functions/firstSuccess.md)
- [getTypeOfProperty](functions/getTypeOfProperty.md)
- [getValueOfPropertyOrDefault](functions/getValueOfPropertyOrDefault.md)
- [isDeferredResult](functions/isDeferredResult.md)
- [isKeyOf](functions/isKeyOf.md)
- [keysForRecord](functions/keysForRecord.md)
- [mapDetailedResults](functions/mapDetailedResults.md)
- [mapFailures](functions/mapFailures.md)
- [mapResults](functions/mapResults.md)
- [mapSuccess](functions/mapSuccess.md)
- [mapToRecord](functions/mapToRecord.md)
- [omit](functions/omit.md)
- [optionalMapToPossiblyEmptyRecord](functions/optionalMapToPossiblyEmptyRecord.md)
- [optionalMapToRecord](functions/optionalMapToRecord.md)
- [optionalRecordToMap](functions/optionalRecordToMap.md)
- [optionalRecordToPossiblyEmptyMap](functions/optionalRecordToPossiblyEmptyMap.md)
- [pick](functions/pick.md)
- [populateObject](functions/populateObject.md)
- [propagateWithDetail](functions/propagateWithDetail.md)
- [recordFromEntries](functions/recordFromEntries.md)
- [recordToMap](functions/recordToMap.md)
- [succeed](functions/succeed.md)
- [succeeds](functions/succeeds.md)
- [succeedsWithDetail](functions/succeedsWithDetail.md)
- [succeedWithDetail](functions/succeedWithDetail.md)
- [useOrInitialize](functions/useOrInitialize.md)
- [valuesForRecord](functions/valuesForRecord.md)

## References

### Collector

Re-exports [Collector](namespaces/Collections/classes/Collector.md)

***

### Converter

Re-exports [Converter](namespaces/Conversion/interfaces/Converter.md)

***

### ConvertingCollector

Re-exports [ConvertingCollector](namespaces/Collections/classes/ConvertingCollector.md)

***

### ICollectible

Re-exports [ICollectible](namespaces/Collections/interfaces/ICollectible.md)

***

### IReadOnlyResultMap

Re-exports [IReadOnlyResultMap](namespaces/Collections/interfaces/IReadOnlyResultMap.md)

***

### ObjectConverter

Re-exports [ObjectConverter](namespaces/Conversion/classes/ObjectConverter.md)

***

### ResultMap

Re-exports [ResultMap](namespaces/Collections/classes/ResultMap.md)

***

### StringConverter

Re-exports [StringConverter](namespaces/Conversion/classes/StringConverter.md)

***

### ValidatingCollector

Re-exports [ValidatingCollector](namespaces/Collections/classes/ValidatingCollector.md)

***

### ValidatingConvertingCollector

Re-exports [ValidatingConvertingCollector](namespaces/Collections/classes/ValidatingConvertingCollector.md)

***

### ValidatingResultMap

Re-exports [ValidatingResultMap](namespaces/Collections/classes/ValidatingResultMap.md)

***

### Validator

Re-exports [Validator](namespaces/Validation/interfaces/Validator.md)
