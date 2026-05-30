# Testing Guidelines

This document defines testing standards for this repository. All code must have 100% test coverage.

## Table of Contents
- [Testing Philosophy](#testing-philosophy)
- [Result Pattern Matchers](#result-pattern-matchers)
- [Test Structure](#test-structure)
- [Coverage Requirements](#coverage-requirements)
- [Coverage Gap Resolution](#coverage-gap-resolution)

---

## Testing Philosophy

### Function-First, Coverage-Second

**Primary**: Write tests that make sense functionally, based on the component's intended behavior:

1. **Success Cases**: Test main functionality with valid inputs
2. **Error Cases**: Test expected error conditions and validation failures
3. **Edge Cases**: Test boundary conditions, empty inputs, corner cases
4. **Integration**: Test component interactions

**Secondary**: Use coverage analysis to identify missed paths only after functional tests are complete.

### Never Paper Over Failures

**CRITICAL**: If tests fail because functionality is broken, DO NOT work around it.

```typescript
// ❌ NEVER hide broken functionality
// TODO: Add test when method is fixed
expect(typeof brokenMethod.convert).toBe('function');

// ❌ NEVER mock to hide real failures
jest.mock('./brokenModule', () => ({
  brokenMethod: jest.fn().mockReturnValue(mockResult)
}));

// ✅ CORRECT: Report the failure to the user
// "The parse() method throws an error when it should return a Result.
//  This appears to be a bug in the implementation."
```

When tests reveal bugs:
1. Analyze the failure - is it a real bug?
2. Report legitimate bugs immediately with exact error messages
3. Fix the underlying issue before proceeding
4. Never use mocking or workarounds to bypass legitimate failures

---

## Result Pattern Matchers

Use custom Jest matchers from `@fgv/ts-utils-jest`:

### Basic Matchers

```typescript
import '@fgv/ts-utils-jest';

// Simple success/failure checks
expect(operation()).toSucceed();
expect(operation()).toFail();

// Value matching
expect(converter.convert('input')).toSucceedWith('expected');
expect(operation()).toFailWith(/error pattern/i);
```

### Complex Assertions

```typescript
// Use toSucceedAndSatisfy for complex objects
expect(SomeClass.create(params)).toSucceedAndSatisfy((instance) => {
  expect(instance.property).toBe(expectedValue);
  expect(instance.method()).toSucceed();

  // Nested result testing
  expect(instance.getChild('id')).toSucceedAndSatisfy((child) => {
    expect(child.value).toBe(42);
  });
});
```

### When to Use Each Matcher

| Matcher | Use When |
|---------|----------|
| `toSucceed()` | Only care that operation succeeded |
| `toFail()` | Only care that operation failed |
| `toSucceedWith(value)` | Testing simple value equality |
| `toFailWith(pattern)` | Testing error messages (use regex) |
| `toSucceedAndSatisfy(fn)` | Testing complex objects or multiple properties |

---

## Test Structure

### Setup vs Test Assertions

```typescript
describe('MyClass', () => {
  let instance: MyClass;

  // ✅ GOOD - Use orThrow() in setup
  beforeEach(() => {
    instance = MyClass.create(testParams).orThrow();

    // Chain setup operations
    instance = MyClass.create(testParams)
      .onSuccess((inst) => {
        inst.initialize(config).orThrow();
        return inst;
      })
      .orThrow();
  });

  // ✅ GOOD - Use matchers in actual tests
  test('should handle operations', () => {
    expect(instance.operation()).toSucceedAndSatisfy((result) => {
      expect(result.value).toBe(expected);
    });
    expect(instance.failingOp()).toFailWith(/expected error/i);
  });
});

// ❌ BAD - Don't use matchers in setup
beforeEach(() => {
  expect(MyClass.create(params)).toSucceedAndSatisfy((instance) => {
    testInstance = instance; // Wrong place for matchers
  });
});
```

### Error Testing

```typescript
// ✅ GOOD - Use regex for flexible matching
expect(operation()).toFailWith(/invalid.*parameter/i);

// ✅ GOOD - Test specific error conditions
expect(parser.parse('')).toFailWith(/empty input/i);
expect(parser.parse('{')).toFailWith(/syntax error/i);

// ❌ AVOID - Brittle exact string matching
expect(operation()).toFailWith('Invalid parameter: expected string');
```

### TypeScript in Tests

Never use `any` type, even in tests:

```typescript
// ✅ GOOD - Proper type assertion for test data
const corruptedData = {
  id: 'invalid' as unknown as SomeId,
  type: 999 as unknown as SomeTypeIndex
};

// ❌ BAD - Will fail linting
const corruptedData = {
  id: 'invalid' as any,
  type: 999 as any
};
```

---

## Coverage Requirements

**100% coverage is required** for all metrics:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

### Running Coverage

```bash
# Single project
cd libraries/project-name && rushx coverage

# Check specific file
rushx test --test-path-pattern=filename.test
```

---

## Coverage Gap Resolution

### Systematic Process

1. **Analyze**: Run `rushx coverage` to identify uncovered lines
2. **Categorize** each gap:
   - **Business Logic** (HIGH): Core functionality - must test
   - **Validation Logic** (MEDIUM): Input validation - usually testable
   - **Defensive Coding** (LOW): Internal consistency checks - may need directive
3. **Resolve** in priority order:
   - Test business logic gaps first
   - Test validation logic gaps second
   - Add `c8 ignore` for truly unreachable defensive code

### Coverage Directive Detection

Before adding directives, verify they're needed:

```bash
# 1. Test the specific file in isolation
rushx test --test-path-pattern=filename.test

# 2. If individual file shows 100% but full suite shows gaps:
#    - Code is functionally tested
#    - Coverage tool has timing issues
#    - Directives are appropriate
```

### Using Coverage Directives

```typescript
// Format: /* c8 ignore next <n> - <reason> */

/* c8 ignore next 2 - defensive coding: internal consistency check */
if (this.internalState.isCorrupted()) {
  throw new Error('Internal state corrupted');
}

/* c8 ignore next 1 - coverage intermittently missed in full suite */
} catch (error) {
  return fail(error);
}
```

**Always get approval before adding coverage directives.**

### Examples of Defensive Code (Candidates for Ignore)

- Internal collector creation failures (would indicate library bugs)
- Index validation for internally managed collections
- Consistency checks between related data structures
- Error paths in well-tested internal operations
- Unreachable code due to TypeScript type guarantees

---

## Testing Principles

### Core Guidelines

1. **Don't change production code for tests** - Test code should not drive API changes
2. **Test via exported functionality** - Use public APIs, not internal modules
3. **Test interfaces via implementations** - Use real classes to test interface contracts
4. **Don't add exports for testing** - Import internal modules directly when needed

### Testing Internal Code

```typescript
// ✅ GOOD - Test through public APIs
expect(SomeLibrary.Runtime.validator.validate(data)).toSucceed();

// ✅ GOOD - Import internal module when necessary
// eslint-disable-next-line import/no-internal-modules
import { InternalClass } from '../../../packlets/internal/module';

// ❌ AVOID - Adding exports just for testing
export { InternalValidator }; // Don't add this

// ❌ AVOID - Excessive mocking
const mockValidator = jest.fn(); // Use real validator when possible
```

### Test Organization

Tests mirror source structure:
```
src/
├── packlets/
│   └── feature/
│       └── component.ts
└── test/
    └── unit/
        └── packlets/
            └── feature/
                └── component.test.ts
```
