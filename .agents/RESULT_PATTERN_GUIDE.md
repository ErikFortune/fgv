# Result Pattern Comprehensive Guide

This guide provides detailed guidance on using the Result pattern throughout the FGV codebase. The Result pattern is a functional approach to error handling that makes errors explicit in the type system, avoiding exceptions and providing consistent error handling across the codebase.

## Table of Contents
- [Core Concepts](#core-concepts)
- [Basic Usage](#basic-usage)
- [Result Chaining](#result-chaining)
- [Error Aggregation](#error-aggregation)
- [Error Formatting](#error-formatting)
- [Testing with Results](#testing-with-results)
- [Common Patterns](#common-patterns)
- [Anti-Patterns](#anti-patterns)

## Core Concepts

The Result pattern encapsulates either a successful value (`Success<T>`) or an error message (`Failure<T>`). This makes error handling explicit and type-safe.

### Creating Results

```typescript
import { Result, succeed, fail } from '@fgv/ts-utils';

// Success case
function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return fail('Division by zero');
  }
  return succeed(a / b);
}

// Using captureResult for operations that might throw
function parseJsonSafely(text: string): Result<unknown> {
  return captureResult(() => JSON.parse(text));
}
```

## Basic Usage

### Extracting Values

```typescript
// Use orThrow() ONLY in setup/initialization code or when errors must propagate
const config = loadConfig().orThrow(); // OK in constructor or setup

// Use orDefault() for safe defaults
const port = getPort().orDefault(3000);
const name = getName().orDefault(undefined);

// Use orDefaultLazy() for expensive default calculations
const data = loadData().orDefaultLazy(() => computeExpensiveDefault());
```

### Checking Success/Failure

```typescript
const result = someOperation();

if (result.isSuccess()) {
  console.log(result.value); // TypeScript knows value exists
} else {
  console.error(result.message); // TypeScript knows message exists
}
```

## Result Chaining

### Using onSuccess() and onFailure()

The `onSuccess()` and `onFailure()` methods allow chaining operations that depend on the previous result:

```typescript
// Chain successful operations
function processData(input: string): Result<ProcessedData> {
  return parseInput(input)
    .onSuccess((parsed) => validate(parsed))
    .onSuccess((valid) => transform(valid))
    .onSuccess((transformed) => persist(transformed));
}

// Handle failures with onFailure
function loadWithFallback(primary: string, fallback: string): Result<Config> {
  return loadConfig(primary)
    .onFailure(() => loadConfig(fallback))
    .onFailure(() => fail('Both primary and fallback configs failed'));
}

// Transform success values
function getUserDisplayName(id: UserId): Result<string> {
  return getUser(id)
    .onSuccess((user) => succeed(`${user.firstName} ${user.lastName}`));
}
```

### Complex Chaining Examples (from ts-bcp47)

```typescript
// From languageTagParser.ts
public static parse(tag: string, iana?: Iana.LanguageRegistries): Result<ISubtags> {
  const status: IParserState = {
    tag,
    iana: iana ?? Iana.DefaultRegistries.languageRegistries,
    subtags: tag.split('-'),
    parsedSubtags: {}
  };
  
  return allSucceed(
    [
      this._parseGrandfatheredTag(status),
      this._parsePrimaryLanguage(status),
      this._parseExtlang(status),
      this._parseScript(status),
      this._parseRegion(status),
      this._parseVariants(status),
      this._parseExtensions(status),
      this._parsePrivateSubtags(status),
      this._parseTagEnd(status)
    ],
    status
  ).onSuccess(() => {
    return succeed(status.parsedSubtags);
  });
}

// From baseValidator.ts - nested chaining
public validateSubtags(subtags: ISubtags): Result<true> {
  return allSucceed(
    [
      this._checkLanguage(subtags),
      this._checkExtlangs(subtags),
      this._checkScript(subtags),
      this._checkRegion(subtags),
      this._checkVariants(subtags),
      this._checkExtensions(subtags),
      this._checkPrivateUseTags(subtags),
      this._checkGrandfatheredTags(subtags)
    ],
    true
  ).onSuccess(() => {
    return this._postValidate(subtags).onSuccess(() => succeed(true));
  });
}
```

## Error Aggregation

### Using allSucceed()

Ensures all operations succeed or returns the first failure:

```typescript
function validateAllFields(data: FormData): Result<ValidatedData> {
  return allSucceed(
    [
      validateName(data.name),
      validateEmail(data.email),
      validateAge(data.age)
    ],
    data // Pass through value on success
  ).onSuccess((validatedFields) => {
    return createValidatedData(validatedFields);
  });
}
```

### Using mapResults()

Aggregates results from a collection, collecting all errors:

```typescript
import { mapResults } from '@fgv/ts-utils';

function processItems(items: string[]): Result<ProcessedItem[]> {
  const results = items.map(item => processItem(item));
  return mapResults(results); // Returns all successes or aggregated errors
}

// With error aggregation
function processWithAggregation(items: string[]): Result<ProcessedItem[]> {
  const aggregator = new MessageAggregator();
  const results = items.map(item => processItem(item));
  const finalResult = mapResults(results, aggregator);
  
  if (finalResult.isFailure() && aggregator.hasMessages) {
    console.error(`Processing failed with ${aggregator.numMessages} errors`);
    console.error(aggregator.toString());
  }
  
  return finalResult;
}
```

### Using MessageAggregator

The `MessageAggregator` class helps collect and format multiple error messages:

```typescript
import { MessageAggregator, Result, fail } from '@fgv/ts-utils';

function validateComplexData(data: ComplexData): Result<ValidatedData> {
  const aggregator = new MessageAggregator();
  
  // Collect validation errors
  if (!data.name) {
    aggregator.addMessage('Name is required');
  }
  
  if (!isValidEmail(data.email)) {
    aggregator.addMessage('Invalid email format');
  }
  
  if (data.age < 0 || data.age > 150) {
    aggregator.addMessage('Age must be between 0 and 150');
  }
  
  // Check nested validations
  const addressResult = validateAddress(data.address);
  if (addressResult.isFailure()) {
    aggregator.addMessage(addressResult.message);
  }
  
  // Return aggregated result
  if (aggregator.hasMessages) {
    return fail(aggregator.toString('; ')); // Custom separator
  }
  
  return succeed(createValidatedData(data));
}

// Using with mapResults
function processAllOrNothing(items: Item[]): Result<ProcessedItem[]> {
  const aggregator = new MessageAggregator();
  const results = items.map(item => processItem(item));
  
  // mapResults will add errors to aggregator
  const finalResult = mapResults(results, aggregator);
  
  if (finalResult.isFailure()) {
    // aggregator now contains all error messages
    logger.error(`Failed to process ${aggregator.numMessages} items:`);
    logger.error(aggregator.toString());
  }
  
  return finalResult;
}
```

### Using mapSuccess()

Collects successful results even if some fail:

```typescript
import { mapSuccess } from '@fgv/ts-utils';

function processBestEffort(items: string[]): Result<ProcessedItem[]> {
  const results = items.map(item => processItem(item));
  return mapSuccess(results); // Returns successes, fails only if ALL fail
}
```

### Using mapFailures()

Collects only the error messages:

```typescript
import { mapFailures } from '@fgv/ts-utils';

function reportErrors(items: string[]): string[] {
  const results = items.map(item => processItem(item));
  return mapFailures(results); // Returns array of error messages
}
```

## Error Formatting

### Consistent Error Messages

Use template literals for consistent, informative error messages:

```typescript
// Include context in error messages
function getByIndex<T>(items: T[], index: number): Result<T> {
  if (index < 0 || index >= items.length) {
    return fail(`Index ${index} out of bounds for array of length ${items.length}`);
  }
  return succeed(items[index]);
}

// Include identifiers and values
function validateRange(value: number, min: number, max: number, name: string): Result<number> {
  if (value < min || value > max) {
    return fail(`${name}: value ${value} must be between ${min} and ${max}`);
  }
  return succeed(value);
}

// Format complex objects
function validateSubtags(subtags: ISubtags): Result<ISubtags> {
  const tagString = subtagsToString(subtags);
  
  if (!subtags.primaryLanguage) {
    return fail(`${tagString}: missing primary language subtag`);
  }
  
  if (subtags.extlangs && subtags.extlangs.length > 3) {
    return fail(`${tagString}: too many extlang subtags`);
  }
  
  return succeed(subtags);
}
```

### Error Context Pattern

Add context to errors as they propagate:

```typescript
function loadUserProfile(userId: string): Result<UserProfile> {
  return loadUser(userId)
    .onFailure((msg) => fail(`Failed to load user ${userId}: ${msg}`))
    .onSuccess((user) => loadProfile(user.profileId)
      .onFailure((msg) => fail(`Failed to load profile for user ${userId}: ${msg}`))
    );
}
```

### Using withErrorFormat()

The `withErrorFormat()` method allows you to transform error messages while preserving the Result type:

```typescript
// Add context to error messages
function createResourceFromCandidates(
  resourceId: ResourceId,
  candidates: CandidateDecl[]
): Result<ResourceDecl> {
  return ResourceBuilder.createFromCandidates(resourceId, candidates)
    .withErrorFormat((e) => `${resourceId}: Failed to create resource: ${e}`);
}

// Chain multiple operations with formatted errors (from ts-res)
function cloneWithUpdates(resourceId: ResourceId, candidates: Candidate[]): Result<Manager> {
  return createResourceDeclFromCandidates(resourceId, candidates, this._conditions)
    .withErrorFormat((e) => `${resourceId}: Failed to create new resource from candidates: ${e}`)
    .onSuccess((newResourceDecl) => {
      return newManager
        .addResource(newResourceDecl)
        .withErrorFormat((e) => `${resourceId}: Failed to add new resource to cloned manager: ${e}`);
    });
}

// Format errors during normalization
function normalizeCollection(collection: Collection): Result<NormalizedCollection> {
  const normalizer = new Hash.Crc32Normalizer();
  return normalizer
    .normalize(collection)
    .withErrorFormat((e) => `Failed to normalize resource collection: ${e}`);
}
```

## Testing with Results

### Using Result Matchers

```typescript
import '@fgv/ts-utils-jest';

// Basic matchers
expect(someOperation()).toSucceed();
expect(someOperation()).toFail();

// Value matching
expect(converter.convert('test')).toSucceedWith('expected');
expect(operation()).toFailWith(/pattern/i);

// Complex assertions
expect(createObject(params)).toSucceedAndSatisfy((obj) => {
  expect(obj.property).toBe(expected);
  expect(obj.method()).toSucceed();
  
  // Nested result testing
  expect(obj.getChild('id')).toSucceedAndSatisfy((child) => {
    expect(child.value).toBe(42);
  });
});
```

### Setup vs Test Assertions

```typescript
describe('MyClass', () => {
  let instance: MyClass;
  
  beforeEach(() => {
    // Use orThrow() in setup - failures here indicate test setup problems
    instance = MyClass.create(testParams).orThrow();
    
    // Or chain setup operations
    instance = MyClass.create(testParams)
      .onSuccess((inst) => {
        inst.initialize(config).orThrow();
        return inst;
      })
      .orThrow();
  });
  
  test('should handle operations', () => {
    // Use matchers in actual tests
    expect(instance.operation()).toSucceedAndSatisfy((result) => {
      expect(result.value).toBe(expected);
    });
    
    expect(instance.failingOp()).toFailWith(/expected error/i);
  });
});
```

## Common Patterns

### Early Return Pattern

Use early return only when chaining would be complex or unclear:

```typescript
// ✅ Good - Use early return when logic is complex/conditional
function processWithConditions(input: string, options: Options): Result<Output> {
  const parsed = parseInput(input);
  if (parsed.isFailure()) {
    // Special handling for parse errors
    if (options.allowPartial) {
      return processPartial(input);
    }
    logParseError(parsed.message);
    return parsed;
  }
  
  // Complex intermediate processing that doesn't fit well in a chain
  const intermediate = parsed.value;
  const metadata = extractMetadata(intermediate);
  
  if (metadata.requiresAuth && !isAuthenticated()) {
    return fail('Authentication required for this resource type');
  }
  
  if (metadata.deprecated) {
    console.warn(`Processing deprecated format: ${metadata.version}`);
    return transformLegacy(intermediate, metadata);
  }
  
  return transformModern(intermediate, metadata);
}

// ❌ Bad - Don't use early return for simple chains
// This should be chained instead:
function processSimple(input: string): Result<Output> {
  const parsed = parseInput(input);
  if (parsed.isFailure()) {
    return parsed;
  }
  
  const validated = validate(parsed.value);
  if (validated.isFailure()) {
    return validated;
  }
  
  return transform(validated.value);
}

// ✅ Good - Use chaining for straightforward flows
function processSimple(input: string): Result<Output> {
  return parseInput(input)
    .onSuccess(validate)
    .onSuccess(transform);
}
```

### Try-OrDefault Pattern

```typescript
function getConfigValue(key: string, defaultValue: string): string {
  return loadConfig()
    .onSuccess(config => succeed(config[key] ?? defaultValue))
    .orDefault(defaultValue);
}
```

### Validation with MessageAggregator

Use `MessageAggregator` for accumulating validation errors:

```typescript
// ✅ Good - Use MessageAggregator for validation
function validateWithDetails(data: Data): Result<ValidatedData> {
  const aggregator = new MessageAggregator();
  
  // Validate each field and aggregate errors
  validateField1(data.field1).aggregateError(aggregator);
  validateField2(data.field2).aggregateError(aggregator);
  validateField3(data.field3).aggregateError(aggregator);
  
  // Check nested objects
  if (data.nested) {
    validateNested(data.nested).aggregateError(aggregator);
  }
  
  // Return aggregated result
  if (aggregator.hasMessages) {
    return fail(aggregator.toString('; ')); // Custom separator
  }
  
  return succeed(createValidatedData(data));
}

// Alternative: Return early if you want to stop on first error
function validateStopOnFirst(data: Data): Result<ValidatedData> {
  // These will return immediately on first failure
  return validateField1(data.field1)
    .onSuccess(() => validateField2(data.field2))
    .onSuccess(() => validateField3(data.field3))
    .onSuccess(() => succeed(createValidatedData(data)));
}
```

### Factory Pattern with Results

```typescript
class ResourceManager {
  private constructor(private config: Config) {}
  
  public static create(params: Params): Result<ResourceManager> {
    return validateParams(params)
      .onSuccess(valid => loadConfig(valid))
      .onSuccess(config => succeed(new ResourceManager(config)));
  }
}

// Usage
const manager = ResourceManager.create(params).orThrow();
```

## Anti-Patterns

### ❌ Don't use any type

```typescript
// BAD - Will fail linting
const corrupted = { id: 'invalid' as any };

// GOOD - Use proper type assertion
const corrupted = { id: 'invalid' as unknown as ValidId };
```

### ❌ Don't throw in Result chains

```typescript
// BAD - Throwing defeats the purpose
function process(input: string): Result<Output> {
  return parse(input).onSuccess(parsed => {
    if (!isValid(parsed)) {
      throw new Error('Invalid'); // Don't do this!
    }
    return succeed(transform(parsed));
  });
}

// GOOD - Return Result consistently
function process(input: string): Result<Output> {
  return parse(input).onSuccess(parsed => {
    if (!isValid(parsed)) {
      return fail('Invalid parsed data');
    }
    return succeed(transform(parsed));
  });
}
```

### ❌ Don't ignore Results

```typescript
// BAD - Ignoring potential failure
function unsafeProcess(input: string): Output {
  const result = parse(input);
  return transform(result.value); // Might be undefined!
}

// GOOD - Handle the Result
function safeProcess(input: string): Result<Output> {
  return parse(input).onSuccess(transform);
}
```

### ❌ Don't create intermediate variables unnecessarily

```typescript
// BAD - Unnecessary intermediate variables for simple chain
function process(input: string): Result<Output> {
  const step1 = parse(input);
  if (step1.isFailure()) return step1;
  
  const step2 = validate(step1.value);
  if (step2.isFailure()) return step2;
  
  const step3 = transform(step2.value);
  return step3;
}

// GOOD - Use chaining for straightforward flows
function process(input: string): Result<Output> {
  return parse(input)
    .onSuccess(validate)
    .onSuccess(transform);
}
```

### ❌ Don't manually accumulate errors without MessageAggregator

```typescript
// BAD - Manual error accumulation
function validateAll(data: Data): Result<ValidatedData> {
  const errors: string[] = [];
  
  validateField1(data.field1).onFailure(msg => errors.push(msg));
  validateField2(data.field2).onFailure(msg => errors.push(msg));
  
  if (errors.length > 0) {
    return fail(errors.join('; '));
  }
  return succeed(createValidatedData(data));
}

// GOOD - Use MessageAggregator
function validateAll(data: Data): Result<ValidatedData> {
  const aggregator = new MessageAggregator();
  
  validateField1(data.field1).aggregateError(aggregator);
  validateField2(data.field2).aggregateError(aggregator);
  
  if (aggregator.hasMessages) {
    return fail(aggregator.toString('; '));
  }
  return succeed(createValidatedData(data));
}
```

### ❌ Don't use Result matchers in setup

```typescript
// BAD - Using matchers in setup
beforeEach(() => {
  expect(MyClass.create(params)).toSucceedAndSatisfy(inst => {
    instance = inst; // Wrong place for matchers
  });
});

// GOOD - Use orThrow() in setup
beforeEach(() => {
  instance = MyClass.create(params).orThrow();
});
```

## Advanced Patterns

### Conditional Chaining

```typescript
function processConditionally(data: Data, options: Options): Result<Output> {
  return validateData(data)
    .onSuccess(valid => {
      if (options.requiresAuth) {
        return authenticate(valid).onSuccess(processAuthenticated);
      }
      return processUnauthenticated(valid);
    });
}
```

### Parallel Processing with Aggregation

```typescript
async function processParallel(items: Item[]): Promise<Result<ProcessedItem[]>> {
  const promises = items.map(item => processItemAsync(item));
  const results = await Promise.all(promises);
  
  const aggregator = new MessageAggregator();
  const finalResult = mapResults(results, aggregator);
  
  if (finalResult.isFailure()) {
    logger.error(`Parallel processing failed:\n${aggregator.toString()}`);
  }
  
  return finalResult;
}
```

### Result with Resource Cleanup

```typescript
function processWithCleanup(file: string): Result<Data> {
  const handle = openFile(file);
  if (handle.isFailure()) {
    return handle;
  }
  
  try {
    return readData(handle.value)
      .onSuccess(processData)
      .onSuccess(validateData);
  } finally {
    closeFile(handle.value); // Always cleanup
  }
}
```

## Summary

The Result pattern provides:
- **Type Safety**: Errors are explicit in the type system
- **Consistency**: Uniform error handling across the codebase
- **Composability**: Results chain naturally with `onSuccess`/`onFailure`
- **Testability**: Clear test matchers for success/failure cases
- **Error Aggregation**: Tools for collecting and formatting multiple errors

Remember:
- Prefer Result chaining over intermediate variables when it improves clarity
- Use `orThrow()` only in setup/initialization code
- Include context in error messages
- Use MessageAggregator for complex error collection
- Test with Result matchers, not orThrow()