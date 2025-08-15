# Coverage Guidelines for FGV Monorepo

This document provides comprehensive guidance for achieving and maintaining 100% test coverage across all libraries in the FGV monorepo.

## Coverage Philosophy: Function-First, Coverage-Second

### Primary: Functional Testing
Start by writing tests that "make sense" functionally, focusing on the component's intended behavior:

1. **Success Cases**: Test all main functionality with valid inputs
2. **Error Cases**: Test expected error conditions and validation failures
3. **Edge Cases**: Test boundary conditions, empty inputs, and reasonable corner cases
4. **Integration**: Test how components interact with their dependencies

Write these tests based on the component's public API and expected behavior, not based on implementation details or coverage reports.

### Secondary: Coverage Gap Analysis
Only after functional tests are complete and correct, use coverage analysis to identify any missed executable paths.

## Coverage Gap Analysis Strategy

### 1. Systematic Analysis Process
When addressing coverage gaps, use this systematic approach:

1. **Analyze Coverage Reports**: Run `rushx coverage` to identify uncovered lines
2. **Categorize Coverage Gaps**:
   - **Business Logic** (HIGH priority): Core functionality that can be reached through normal operation
   - **Validation Logic** (MEDIUM priority): Input validation and error handling that can be tested
   - **Defensive Coding** (LOW priority): Internal consistency checks and error paths that are very difficult to trigger

3. **Prioritized Resolution Strategy**:
   - **Step 1**: Test business logic gaps first - these represent important functionality
   - **Step 2**: Test validation logic gaps - these can usually be tested by providing invalid inputs
   - **Step 3**: Add `c8 ignore` comments for defensive coding paths that are impractical to test

### 2. Coverage Directive Detection Strategy

**Before adding coverage directives, use this test to determine if directives are needed:**

1. **Run Individual File Test**: Test the specific file in isolation
   ```bash
   rushx test --test-path-pattern=filename.test
   ```

2. **Check Individual File Coverage**: If the individual file shows 100% coverage but the full test suite shows gaps, this indicates:
   - The code paths are functionally tested and working
   - Coverage tool is having intermittent issues or timing problems
   - Coverage directives are appropriate for these lines

3. **Apply Coverage Directives**: For lines that are tested individually but missed in full suite, use directives like:
   ```typescript
   /* c8 ignore next 2 - functional code tested but coverage intermittently missed */
   if (someCondition) {
     return someResult;
   }
   ```

### 3. Coverage Directive Usage
For unreachable or impractical-to-test code, use c8 ignore directives:

```typescript
// Format: /* c8 ignore next <n> - <comment> */
// Examples:
/* c8 ignore next 2 - defensive coding: internal consistency check */
if (this.internalState.isCorrupted()) {
  throw new Error('Internal state corrupted');
}

/* c8 ignore next 1 - functional code tested but coverage intermittently missed */
} catch (error) {
  return fail(error);
}
```

**Always ask for approval before adding coverage directives.**

### 4. Examples of Coverage Directive Categories:

#### Defensive Coding (candidates for c8 ignore):
- Internal collector creation failures that would indicate library bugs
- Index validation failures for internally managed collections
- Consistency checks between related data structures
- Error paths in well-tested internal operations
- Unreachable code paths due to TypeScript type system guarantees

#### Intermittent Coverage Issues:
- Functional code paths that test correctly in isolation but are missed in full suite
- Error handling that works in individual tests but coverage tool misses during full runs
- Complex conditional logic that executes correctly but has timing-sensitive coverage detection

## Testing Standards

### Unit Testing Principles

**Core Testing Guidelines:**
1. **Always ask before changing non-test code** - Test code should not drive changes to production exports or APIs
2. **Prefer testing via exported functionality** - Test through public APIs rather than creating mocks when possible
3. **Test interfaces via concrete implementations** - It's perfectly acceptable to test interface contracts using real implementations
4. **Test internal functionality via exported classes** - Use exported classes, interfaces, objects, or functions that utilize internal functionality
5. **Don't change exports to make internal functionality testable** - When it's difficult to test internal functionality via exports, import the specific module directly in the test file and disable lint warnings as needed

### Result Pattern Test Matchers
Libraries using the Result pattern should use custom Jest matchers from `@fgv/ts-utils-jest` for `Result<T>` objects:

- **`toSucceed()`** - Assert that a Result is successful
- **`toFail()`** - Assert that a Result is a failure
- **`toSucceedWith(value)`** - Assert success with specific value
- **`toFailWith(pattern)`** - Assert failure with message matching regex/string
- **`toSucceedAndSatisfy(callback)`** - Assert success and run assertions on the value

### Idiomatic Test Patterns

#### Setup vs Test Assertions
```typescript
// ✅ Good - Use standard Result methods in setup (beforeEach, etc.)
beforeEach(() => {
  const instance = SomeClass.create(params).orThrow();  
  // Or use onSuccess for conditional setup
  manager = Manager.create(params).onSuccess((mgr) => {
    mgr.addItem(testItem).orThrow(); // OK in setup
    return mgr;
  }).orThrow();
});

// ✅ Good - Use Result matchers in test cases
test('should work correctly', () => {
  expect(SomeClass.create(params)).toSucceedAndSatisfy((instance) => {
    expect(instance.property).toBe(expectedValue);
    expect(instance.method()).toSucceed();
  });
});
```

#### Test Assertion Patterns
```typescript
// ✅ Good - Use toSucceedAndSatisfy for complex assertions
expect(SomeClass.create(params)).toSucceedAndSatisfy((instance) => {
  expect(instance.property).toBe(expectedValue);
  expect(instance.method()).toSucceed();
});

// ✅ Good - Use toFailWith for error message testing
expect(SomeClass.create(invalidParams)).toFailWith(/expected error pattern/i);

// ✅ Good - Use toSucceedWith for simple value checks
expect(converter.convert('input')).toSucceedWith(expectedOutput);
```

#### When to Use Each Matcher
- **`toSucceed()`** - When you only care that the operation succeeded
- **`toFail()`** - When you only care that the operation failed
- **`toSucceedWith(value)`** - When testing simple value equality
- **`toFailWith(pattern)`** - When testing error messages or types
- **`toSucceedAndSatisfy(callback)`** - When testing complex objects or multiple properties

### TypeScript Standards in Tests

```typescript
// ✅ Good - Proper type assertions for branded types
const corruptedData = {
  id: 'invalid' as unknown as SomeId,
  type: 999 as unknown as SomeTypeIndex
};

// ❌ Bad - Never use any type (will cause lint failures)
const corruptedData = {
  id: 'invalid' as any,
  type: 999 as any
};
```

## Coverage Requirements

- **100% Test Coverage** - All libraries must maintain full test coverage
- **Statements**: 100%
- **Branches**: 100%  
- **Functions**: 100%
- **Lines**: 100%

## Workflow for Coverage Gap Resolution

1. **Run Coverage Analysis**: `rushx coverage`
2. **Identify Gaps**: Focus on specific files and line numbers
3. **Test Individual Files**: Run `rushx test --test-path-pattern=filename.test` to check isolated coverage
4. **Categorize Each Gap**: Business logic, validation logic, defensive coding, or intermittent coverage
5. **Propose Solutions**: For each gap, propose either:
   - New functional tests to cover the gap
   - Coverage directive with justification (especially if individual test shows 100% coverage)
6. **Get Approval**: Always ask before adding coverage directives
7. **Implement**: Add tests or directives as approved
8. **Verify**: Re-run coverage to confirm gaps are resolved

## Project-Specific Considerations

### Libraries vs Tools
- **Libraries**: Should follow all guidelines strictly, including 100% coverage requirement
- **Tools**: May have different requirements based on their specific use cases and deployment models

### Monorepo Commands
- **Individual Project**: `cd libraries/project-name && rushx coverage`
- **All Projects**: `rush test` (from root)
- **Specific Test**: `rushx test --test-path-pattern=filename.test`

## Documentation and Tracking

When working on coverage gaps:
- Document current coverage percentage
- Track specific file locations and line numbers
- Categorize by priority and type
- Record approach for each gap (test vs ignore)
- Track progress as gaps are resolved

This systematic approach ensures 100% coverage while maintaining meaningful tests and avoiding brittle tests for defensive code paths.