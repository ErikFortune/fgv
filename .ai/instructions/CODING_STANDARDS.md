# Coding Standards

This document defines the coding standards for this repository. All AI assistants and human developers must follow these guidelines.

## Table of Contents
- [TypeScript Standards](#typescript-standards)
- [Result Pattern](#result-pattern)
- [Type-Safe Validation](#type-safe-validation)
- [Error Handling](#error-handling)
- [Code Style](#code-style)

---

## TypeScript Standards

### Never Use `any` Type

This rule is **absolute and non-negotiable**. The codebase has strict lint rules that will fail CI.

```typescript
// ❌ NEVER - Will fail CI/linting
const data: any = something;
function process(input: any): any { }
const obj = value as any;

// ✅ CORRECT alternatives
const data: unknown = something;
const data = something as unknown as SpecificType;
function process(input: unknown): Result<Output> { }
const obj: Record<string, unknown> = {};
```

### Type Assertions

Use proper type assertion patterns:

```typescript
// ✅ For branded types
const id = 'user-123' as unknown as UserId;

// ✅ For test data with intentionally invalid types
const corrupted = {
  id: 'invalid' as unknown as ValidId,
  type: 999 as unknown as TypeIndex
};

// ❌ NEVER double-cast through Record
const bad = value as Record<string, unknown> as TargetType;
```

### Prefer Strict Types

- Use `unknown` instead of `any` for truly unknown data
- Use `Record<string, unknown>` for dynamic objects that need iteration
- Define interfaces for structured data
- Use branded types for domain identifiers

---

## Result Pattern

All operations that can fail must return `Result<T>` objects from `@fgv/ts-utils`. This makes errors explicit and avoids exceptions.

### Creating Results

```typescript
import { Result, succeed, fail, captureResult } from '@fgv/ts-utils';

// Success case
function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return fail('Division by zero');
  }
  return succeed(a / b);
}

// Wrap throwing code with captureResult
function parseJson(text: string): Result<unknown> {
  return captureResult(() => JSON.parse(text));
}
```

### Extracting Values

```typescript
// ✅ Use orThrow() ONLY in setup/initialization
const config = loadConfig().orThrow(); // OK in constructor/setup

// ✅ Use orDefault() for safe fallbacks
const port = getPort().orDefault(3000);
const name = getName().orDefault(undefined);

// ✅ Use orDefaultLazy() for expensive defaults
const data = loadData().orDefaultLazy(() => computeExpensiveDefault());
```

### Result Chaining

Prefer chaining over intermediate variables when it improves clarity:

```typescript
// ✅ GOOD - Chain operations
function processData(input: string): Result<Output> {
  return parseInput(input)
    .onSuccess((parsed) => validate(parsed))
    .onSuccess((valid) => transform(valid));
}

// ❌ AVOID - Unnecessary intermediate variables
function processData(input: string): Result<Output> {
  const parsed = parseInput(input);
  if (parsed.isFailure()) return parsed;
  const valid = validate(parsed.value);
  if (valid.isFailure()) return valid;
  return transform(valid.value);
}
```

**Exception**: Complex conditional logic may be clearer with intermediate variables. Prioritize readability.

### Converting DetailedResult to Result

When chaining from `MaterializedLibrary.get()` (which returns `DetailedResult`), use `.asResult` to convert:

```typescript
// ✅ CORRECT - Use .asResult to strip detail before chaining
function resolveItem(id: ItemId): Result<ResolvedItem> {
  return this._context.items.get(id)
    .asResult
    .withErrorFormat((msg) => `item ${id}: ${msg}`)
    .onSuccess((item) => succeed({ id, item }));
}

// ❌ AVOID - Type errors when chaining DetailedResult
function resolveItem(id: ItemId): Result<ResolvedItem> {
  return this._context.items.get(id)
    .withErrorFormat((msg) => `item ${id}: ${msg}`) // Type error!
    .onSuccess((item) => succeed({ id, item }));
}
```

### Array Processing with Per-Item Helpers

When processing arrays, use `mapResults()` with dedicated per-item helper methods:

```typescript
// ✅ EXCELLENT - mapResults with per-item helper
function getFillings(): Result<ReadonlyArray<IResolvedFillingSlot>> {
  if (this._resolvedFillings === undefined) {
    const slots = this._version.fillings ?? [];
    return mapResults(slots.map((slot) => this._resolveFillingSlot(slot)))
      .onSuccess((slots) => {
        this._resolvedFillings = slots;
        return succeed(slots);
      });
  }
  return succeed(this._resolvedFillings);
}

private _resolveFillingSlot(slot: IFillingSlotEntity): Result<IResolvedFillingSlot> {
  return this._resolveFillingOptions(slot.filling)
    .withErrorFormat((msg) => `slot ${slot.name}: failed to resolve fillings: ${msg}`)
    .onSuccess((filling) => succeed({
      slotId: slot.slotId,
      name: slot.name,
      filling
    }));
}

// ❌ AVOID - Imperative loop with manual error handling
function getFillings(): Result<ReadonlyArray<IResolvedFillingSlot>> {
  if (this._resolvedFillings === undefined) {
    const slots = this._version.fillings ?? [];
    const results: IResolvedFillingSlot[] = [];
    for (const slot of slots) {
      const fillingResult = this._resolveFillingOptions(slot.filling);
      if (fillingResult.isFailure()) {
        return fail(`Failed to resolve fillings for slot '${slot.name}': ${fillingResult.message}`);
      }
      results.push({
        slotId: slot.slotId,
        name: slot.name,
        filling: fillingResult.value
      });
    }
    this._resolvedFillings = results;
  }
  return succeed(this._resolvedFillings);
}
```

**Benefits of per-item helpers:**
- Isolates single-item resolution logic
- Enables better error context with `.withErrorFormat()`
- More testable (can unit test individual item resolution)
- More readable (declarative vs imperative)

### Chaining with Early Returns

For optional fields, handle the undefined case early:

```typescript
// ✅ GOOD - Early return for undefined, then chain
function getEnrobingChocolate(): Result<IResolvedChocolateSpec | undefined> {
  if (this._resolvedEnrobingChocolate === undefined) {
    const spec = this._version.enrobingChocolate;
    if (!spec) {
      this._resolvedEnrobingChocolate = null;
      return succeed(undefined);
    }

    return this._context.ingredients.getWithAlternates(spec)
      .withErrorFormat((msg) => `confection ${this._id}: failed to resolve enrobing chocolate: ${msg}`)
      .onSuccess((resolved) => {
        if (!resolved.primary.isChocolate()) {
          return fail(`confection ${this._id}: primary ingredient is not a chocolate`);
        }
        this._resolvedEnrobingChocolate = {
          chocolate: resolved.primary,
          alternates: resolved.alternates.filter((i) => i.isChocolate()),
          entity: spec
        };
        return succeed(this._resolvedEnrobingChocolate);
      });
  }
  return succeed(this._resolvedEnrobingChocolate ?? undefined);
}

// ❌ AVOID - Nested conditionals with imperative checks
function getEnrobingChocolate(): Result<IResolvedChocolateSpec | undefined> {
  if (this._resolvedEnrobingChocolate === undefined) {
    const spec = this._version.enrobingChocolate;
    if (!spec) {
      this._resolvedEnrobingChocolate = null;
    } else {
      const resolved = this._context.ingredients.getWithAlternates(spec);
      if (resolved.isFailure()) {
        return fail(`Failed to resolve: ${resolved.message}`);
      }
      if (!resolved.value.primary.isChocolate()) {
        return fail('Not a chocolate');
      }
      this._resolvedEnrobingChocolate = { /* ... */ };
    }
  }
  return succeed(this._resolvedEnrobingChocolate ?? undefined);
}
```

### Avoid Result<void>

**Never use `Result<void>`** - it's an anti-pattern. Operations should return meaningful values:

```typescript
// ❌ ANTI-PATTERN - Result<void>
function updateUser(id: string, data: UserData): Result<void> {
  // ...
  return succeed(undefined);
}

// ✅ CORRECT - Return something meaningful
function updateUser(id: string, data: UserData): Result<User> {
  // ...
  return succeed(updatedUser);
}

// ✅ CORRECT - Return computed/achieved value
function scaleToTargetWeight(target: Measurement): Result<Measurement> {
  // Scale ingredients...
  const actualWeight = calculateActualWeight();
  return succeed(actualWeight); // Actual achieved weight may differ from target
}
```

### Error Context

Add context as errors propagate:

```typescript
function loadUserProfile(userId: string): Result<UserProfile> {
  return loadUser(userId)
    .withErrorFormat((e) => `Failed to load user ${userId}: ${e}`)
    .onSuccess((user) => loadProfile(user.profileId)
      .withErrorFormat((e) => `Failed to load profile for user ${userId}: ${e}`)
    );
}
```

### Error Aggregation

Use `MessageAggregator` for collecting multiple errors:

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

Use `mapResults()` for processing arrays:

```typescript
import { mapResults } from '@fgv/ts-utils';

function processItems(items: Item[]): Result<ProcessedItem[]> {
  const results = items.map(item => processItem(item));
  return mapResults(results); // Returns all successes or aggregated errors
}
```

### Factory Pattern

Constructors that might throw should be private/protected with a static `create` method:

```typescript
class ResourceManager {
  private constructor(private config: Config) {
    if (!config.name) {
      throw new Error('Config name is required');
    }
  }

  public static create(params: Params): Result<ResourceManager> {
    return validateParams(params)
      .onSuccess(valid => loadConfig(valid))
      .onSuccess(config => captureResult(() => new ResourceManager(config)));
  }
}

// Usage
const manager = ResourceManager.create(params).orThrow(); // In setup
const result = ResourceManager.create(params); // In application code
```

---

## Type-Safe Validation

### Critical Anti-Patterns (MUST FIX)

These patterns defeat TypeScript's type safety and must be replaced:

```typescript
// ❌ ANTI-PATTERN 1: Manual type checking in Converters.generic
Converters.generic<unknown, MyType>((from: unknown) => {
  if (typeof from !== 'object' || from === null) return fail('...');
  const obj = from as Record<string, unknown>;
  if (typeof obj.field !== 'string') return fail('...');
  return succeed(obj as MyType); // UNSAFE CAST
});

// ❌ ANTI-PATTERN 2: Manual property checking with cast
if ('id' in obj && 'name' in obj) {
  return succeed(obj as IUser); // Properties could have wrong types!
}

// ❌ ANTI-PATTERN 3: Double casting
const value = someValue as Record<string, unknown> as TargetType;
```

### Required Patterns

Use Converters for data transformation:

```typescript
// ✅ CORRECT: Use Converters.object
const converter = Converters.object<IConfig>({
  name: Converters.string,
  port: Converters.number,
  options: Converters.optionalField(Converters.jsonObject)
});
return converter.convert(input);
```

Use Validators for complex objects with class instances:

```typescript
// ✅ CORRECT: Use Validators for objects with constructors
const validator = Validators.object<IResource>({
  id: Convert.resourceId,
  type: Validators.isA((v): v is ResourceType => v instanceof ResourceType),
  items: Validators.arrayOf(itemValidator)
});
return validator.validate(from);
```

### When to Use Each

| Pattern | Use For |
|---------|---------|
| `Converters.object` | Plain data structures, JSON transformation |
| `Validators.object` | Objects with class instances, complex validation |
| `Converters.generic` | Custom conversion logic (but never with manual type checks!) |

---

## Error Handling

### Prefer Results Over Exceptions

```typescript
// ❌ AVOID throwing in business logic
function process(input: string): Output {
  if (!valid) throw new Error('Invalid');
  return output;
}

// ✅ CORRECT - Return Result
function process(input: string): Result<Output> {
  if (!valid) return fail('Invalid');
  return succeed(output);
}
```

### Error Messages

Include context in error messages:

```typescript
// ✅ GOOD - Contextual error messages
return fail(`Index ${index} out of bounds for array of length ${arr.length}`);
return fail(`${resourceId}: Failed to load: ${underlyingError.message}`);

// ❌ AVOID - Generic messages
return fail('Invalid index');
return fail('Load failed');
```

---

## Code Style

### Avoid Over-Engineering

- Only make changes that are directly requested
- Don't add features beyond what was asked
- Don't refactor surrounding code during bug fixes
- Three similar lines is better than a premature abstraction

### Clean Up Unused Code

- Delete unused code completely
- Don't leave `// removed` comments
- Don't rename unused variables to `_var`
- Don't add backwards-compatibility shims

### Null Coalescing

```typescript
// ✅ Use ?? for undefined/null checks
const value = input ?? 'default';

// ❌ Don't use || when ?? is appropriate
const value = input || 'default'; // Wrong if 0 or '' are valid
```

### Prefer Existing Patterns

- Look for similar code in the codebase and follow its patterns
- Use existing helper functions rather than creating new ones
- Check if a Converter, Validator, or type guard already exists
