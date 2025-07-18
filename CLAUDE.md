# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Rush-based monorepo containing TypeScript libraries and tools for internationalization, localization, and resource management. The main project is `@fgv/ts-res`, a sophisticated library for multidimensional resource management with complex conditional logic.

## Monorepo Structure

The repository is organized using Rush.js with the following structure:

### Libraries (`libraries/`)
- **@fgv/ts-res** - Core multidimensional resource management library
- **@fgv/ts-bcp47** - BCP47 language tag processing
- **@fgv/ts-extras** - Additional TypeScript utilities
- **@fgv/ts-json** - JSON schema validation 
- **@fgv/ts-json-base** - Base JSON validation and processing
- **@fgv/ts-sudoku-lib** - Sudoku puzzle library
- **@fgv/ts-utils** - Core utility functions and Result pattern
- **@fgv/ts-utils-jest** - Jest testing utilities

### Tools (`tools/`)
- **@fgv/ts-res-cli** - Command-line interface for ts-res resource compilation

## Common Development Commands

### Monorepo Management
- `rush install` - Install dependencies across all projects
- `rush build` - Build all projects in dependency order
- `rush test` - Run tests for all projects
- `rush update` - Update dependencies and shrinkwrap file
- `rush prettier` - Run prettier on staged files (used by pre-commit hook)

### Individual Project Commands
Use `rushx` to run commands within individual project folders:
- `rushx build` - Build the current project
- `rushx test` - Run tests for the current project
- `rushx lint` - Run linting
- `rushx fixlint` - Fix linting issues automatically
- `rushx coverage` - Run tests with coverage
- `rushx clean` - Clean build artifacts

### Running Tests
- Single project: `cd libraries/ts-res && rushx test`
- All projects: `rush test`
- With coverage: `rushx coverage`
- Single test file: `jest path/to/test.test.ts`

## Key Architecture Patterns

### Result Pattern
All operations that can fail return `Result<T>` objects from `@fgv/ts-utils`. This provides consistent error handling across the codebase.  Avoid throwing errors as much as possible, preferring to return a Result and use .orThrow() only on paths that must throw.

#### Result Pattern Examples
- Avoid intermediate result variables when possible
- Consider chaining operations with `.onSuccess()` or `.onFailure()`.
  - this is a guideline, not a rule and the priority is understandable and maintainable code.  Chaining with `.onSuccess` is often but not always cleaner, so if it seems more complex to try to chain, it is acceptable to use intermediate result variables.
- If an `undefined` value is an acceptable value in an error condition, use `.orDefault()` instead of an intermediate result variable.
- If some other default value is an acceptable value to use in
an error condition, use `.orDefault(value)` instead of an intermediate result variable.
- Error return is preferred to throwing an error but on paths that must throw (such as constructors), use `.toThrow()`
- use `captureResult` around code that might throw (such as constructors) to convert thrown errors to `Failure` results.
```typescript
// ✅ Good - Setup uses standard Result methods
beforeEach(() => {
  const qualifierTypes = QualifierTypeCollector.create(params).orThrow();  
  // Or use onSuccess for conditional setup
  resourceManager = ResourceManager.create(params).onSuccess((manager) => {
    manager.addResource(testResource).orThrow(); // OK in setup
    return manager;
  }).orThrow();
});

### Collector Pattern
Used throughout for managing collections with validation (QualifierCollector, ConditionCollector, etc.).

### Packlet Organization
Libraries are organized into "packlets" - cohesive modules that group related functionality under `src/packlets/`.

### Workspace Dependencies
Projects use `workspace:*` dependency ranges to reference other projects in the monorepo.

## Build System

- **Rush.js** - Monorepo orchestration with pnpm package manager
- **Heft** - Build toolchain (TypeScript compilation, testing, linting)
- **API Extractor** - Generates API documentation and type definitions
- **Jest** - Testing framework with ts-jest for TypeScript support

## Configuration Files

- `rush.json` - Central Rush configuration defining all projects
- `common/config/rush/` - Rush configuration files
- `common/config/rush/command-line.json` - Custom Rush commands
- Individual project `package.json` files define scripts and dependencies

## Quality Standards

- **100% Test Coverage** - All projects must maintain full test coverage
- **ESLint** - Consistent code style and quality checks
- **Prettier** - Automated code formatting (runs on pre-commit)
- **API Documentation** - Generated from TSDoc comments using API Extractor

## TypeScript Standards

- **NEVER use the `any` type** - This codebase has strict lint rules against `any` that will fail CI/linting
- Use proper TypeScript types, branded types, or `unknown` with type assertions
- For branded types, use `as unknown as BrandedType` pattern instead of `as any`
- Alternative patterns:
  - `unknown` for truly unknown types
  - `Record<string, unknown>` for dynamic objects
  - Proper type assertions with `as unknown as TargetType`
- **Remember**: `any` defeats TypeScript's purpose and will cause build failures

## Type-Safe Validation Guidelines

### Converters vs Validators
- **Converters**: Transform and construct new objects from input data (use for simple types, primitives, plain objects)
- **Validators**: Validate existing objects in-place without construction (use for complex objects with non-default constructors, class instances)

### Avoid Manual Type Checking and Unsafe Casts
```typescript
// ❌ Bad - Manual property checking with unsafe cast
if (
  typeof from === 'object' &&
  from !== null &&
  'id' in from &&
  'resourceType' in from &&
  'decision' in from &&
  'candidates' in from
) {
  return succeed(from as IResource); // Unsafe - properties could have wrong types
}

// ✅ Good - Use dedicated validator for objects with complex constructors
const validator = Validators.object<IResource>({
  id: Convert.resourceId, // Converter for simple branded type
  resourceType: Validators.isA((v): v is ResourceType => v instanceof ResourceType),
  decision: Validators.isA((v): v is ConcreteDecision => v instanceof ConcreteDecision),
  candidates: Validators.arrayOf(resourceCandidateValidator)
});
return validator.validate(from);

// ✅ Alternative - Use converter for plain objects/data structures
const converter = Converters.object<IResourceData>({
  id: Convert.resourceId,
  name: Converters.string,
  value: Converters.jsonValue
});
return converter.convert(from);
```

### When to Use Each Pattern
- **Validators**: Objects with class instances, non-default constructors, existing object validation
- **Converters**: Plain data transformation, building new objects from primitives/JSON
- **Both**: Any situation where you would use manual type checking + casting

### Benefits
- Type safety: Each property is validated according to its expected type
- Better error messages: Specific validation failures instead of generic messages
- Maintainability: Changes to type definitions automatically update validation
- Consistency: Same validation patterns used throughout the codebase

## Testing Standards

**For comprehensive coverage guidelines, systematic approaches to achieving 100% test coverage, and detailed testing methodologies, see [COVERAGE_GUIDELINES.md](./COVERAGE_GUIDELINES.md).**

### Testing Philosophy: Function-First, Coverage-Second

**Primary: Functional Testing**
Start by writing tests that "make sense" functionally, focusing on the component's intended behavior:

1. **Success Cases**: Test all main functionality with valid inputs
2. **Error Cases**: Test expected error conditions and validation failures
3. **Edge Cases**: Test boundary conditions, empty inputs, and reasonable corner cases
4. **Integration**: Test how components interact with their dependencies

Write these tests based on the component's public API and expected behavior, not based on implementation details or coverage reports.

**Secondary: Coverage Gap Analysis**
Only after functional tests are complete and correct, use coverage analysis to identify any missed executable paths.

### Coverage Directive Detection Strategy

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

### Coverage Gap Analysis and Resolution

When addressing coverage gaps, use this systematic approach:

1. **Analyze Coverage Reports**: Run `rushx coverage` to identify uncovered lines
2. **Test Individual Files**: Run `rushx test --test-path-pattern=filename.test` to check isolated coverage
3. **Categorize Coverage Gaps**:
   - **Business Logic** (HIGH priority): Core functionality that can be reached through normal operation
   - **Validation Logic** (MEDIUM priority): Input validation and error handling that can be tested
   - **Defensive Coding** (LOW priority): Internal consistency checks and error paths that are very difficult to trigger
   - **Intermittent Coverage Issues**: Functional code that tests correctly in isolation but is missed in full suite

4. **Prioritized Resolution Strategy**:
   - **Step 1**: Test business logic gaps first - these represent important functionality
   - **Step 2**: Test validation logic gaps - these can usually be tested by providing invalid inputs
   - **Step 3**: Add `c8 ignore` comments for defensive coding paths that are impractical to test

4. **Documentation**: Create a TODO file to track coverage gaps systematically, including:
   - Current coverage percentage
   - Specific file locations and line numbers
   - Categorization by priority and type
   - Approach for each gap (test vs ignore)
   - Progress tracking as gaps are resolved

5. **Examples of Defensive Coding** (candidates for c8 ignore):
   - Internal collector creation failures that would indicate library bugs
   - Index validation failures for internally managed collections
   - Consistency checks between related data structures
   - Error paths in well-tested internal operations

This approach ensures 100% coverage while maintaining meaningful tests and avoiding brittle tests for defensive code paths.

### Unit Testing Principles

**Core Testing Guidelines:**
1. **Always ask before changing non-test code** - Test code should not drive changes to production exports or APIs
2. **Prefer testing via exported functionality** - Test through public APIs rather than creating mocks when possible
3. **Test interfaces via concrete implementations** - It's perfectly acceptable to test interface contracts using real implementations
4. **Test internal functionality via exported classes** - Use exported classes, interfaces, objects, or functions that utilize internal functionality
5. **Don't change exports to make internal functionality testable** - When it's difficult to test internal functionality via exports, import the specific module directly in the test file and disable lint warnings as needed

**Testing Through Public APIs:**
```typescript
// ✅ Good - Test internal functionality through exported APIs
expect(SomeLibrary.Runtime.validator.validate(data)).toSucceed();

// ✅ Good - Test interface through concrete implementation
const instance: IInterface = ConcreteClass.create(...).orThrow();
expect(instance.method()).toSucceed();

// ✅ Good - Import module directly when needed, disable lint warnings
// eslint-disable-next-line import/no-internal-modules
import { InternalClass } from '../../../packlets/internal/internalModule';

// ❌ Avoid - Adding exports just for testing
export { InternalValidator }; // Don't add this just for tests

// ❌ Avoid - Excessive mocking when real implementations work
const mockValidator = jest.fn(); // Use real validator when possible
```

### Result Pattern Test Matchers
All tests use custom Jest matchers from `@fgv/ts-utils-jest` for `Result<T>` objects:

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
  const setupResult = SomeClass.create(params);
  instance = setupResult.orThrow(); // OK in setup
  
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

// ❌ Bad - Don't use Result matchers in setup
beforeEach(() => {
  expect(SomeClass.create(params)).toSucceedAndSatisfy((instance) => {
    testInstance = instance; // Wrong - this is setup, not a test
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

// ❌ Bad - Don't extract with .orThrow() in test cases
const result = SomeClass.create(params);
expect(result).toSucceed();
const instance = result.value; // Use toSucceedAndSatisfy instead
```

#### Nested Result Testing
```typescript
// Test nested Results within toSucceedAndSatisfy
expect(collection.create(params)).toSucceedAndSatisfy((collection) => {
  expect(collection.getItem('id')).toSucceedAndSatisfy((item) => {
    expect(item.property).toBe(expectedValue);
  });
  expect(collection.getItem('missing')).toFailWith(/not found/i);
});
```

#### Error Testing Best Practices
```typescript
// ✅ Good - Use regex patterns for flexible error matching
expect(operation()).toFailWith(/invalid.*parameter/i);

// ✅ Good - Test specific error conditions
expect(parser.parse('')).toFailWith(/empty input/i);
expect(parser.parse('{')).toFailWith(/syntax error/i);

// ❌ Avoid - Brittle exact string matching
expect(operation()).toFailWith('Invalid parameter: expected string');
```

#### When to Use Each Matcher
- **`toSucceed()`** - When you only care that the operation succeeded
- **`toFail()`** - When you only care that the operation failed
- **`toSucceedWith(value)`** - When testing simple value equality
- **`toFailWith(pattern)`** - When testing error messages or types
- **`toSucceedAndSatisfy(callback)`** - When testing complex objects or multiple properties

#### TypeScript in Tests
- **NEVER use `any` type** - Will cause lint failures even in tests
- For corrupted/invalid test data: Use `as unknown as BrandedType` pattern
- For mock objects: Define proper interfaces or use `Partial<T>`
- Example:
```typescript
// ✅ Good - Proper type assertion for invalid test data
const corruptedData = {
  id: 'invalid' as unknown as SomeId,
  type: 999 as unknown as SomeTypeIndex
};

// ❌ Bad - Using any
const corruptedData = {
  id: 'invalid' as any,
  type: 999 as any
};
```

## Development Workflow

1. **Setup**: Run `rush install` to install all dependencies
2. **Build**: Run `rush build` to build all projects
3. **Test**: Run `rush test` to run all tests
4. **Lint**: Run `rushx lint` in individual projects
5. **API Changes**: Run `rushx build-docs` to regenerate API documentation

## Important Notes

- The ts-res library has its own detailed CLAUDE.md file in `libraries/ts-res/` with project-specific architecture details
- All projects use TypeScript 5.7.3 with strict type checking
- Tests are located in `src/test/unit/` mirroring source structure
- Documentation is auto-generated and should not be manually edited
- Rush enforces consistent dependency versions across the monorepo

## Package Manager

- Uses **pnpm 8.15.9** for fast, efficient package management
- Workspace protocol (`workspace:*`) for inter-project dependencies
- Shared lockfile at `common/temp/pnpm-lock.yaml`