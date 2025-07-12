# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@fgv/ts-res`, a TypeScript library for multidimensional resource management with internationalization and localization support. It provides a sophisticated system for managing resources with complex conditional logic based on qualifiers like language, territory, and custom dimensions.

## Development Commands

### Build & Test
- `rushx build` - Build the project (uses heft build --clean)
- `rushx test` - Run tests (uses heft test --clean)  
- `rushx build-all` - Build project and generate documentation
- `rushx coverage` - Run tests with coverage reporting
- `rushx clean` - Clean build artifacts

### Linting & Code Quality
- `rushx lint` - Run ESLint on source files
- `rushx fixlint` - Run ESLint with automatic fixes
- Tests must maintain 100% coverage (branches, functions, lines, statements)

### Documentation
- `rushx build-docs` - Generate API documentation using api-documenter
- Documentation is generated in the `docs/` directory
- **IMPORTANT**: Always run `rushx build-docs` before check-in when making public API changes to regenerate API documentation

### Testing
- Uses Jest with ts-jest for TypeScript support
- Run single test: `jest path/to/test.test.ts`
- Run with open handles detection: `rushx test-handles`
- Clear Jest cache: `rushx clean-jest`

## Architecture

The library is organized into "packlets" - cohesive modules that group related functionality:

### Core Components

**Resources** (`src/packlets/resources/`):
- `ResourceManager` - Central orchestrator for all resource operations
- `Resource` - Individual resource with candidates for different contexts
- `ResourceCandidate` - Specific resource variant with conditions and merge method
- `ResourceBuilder` - Builder pattern for constructing resources

**Conditions** (`src/packlets/conditions/`):
- `Condition` - Individual condition with qualifier, operator, and value
- `ConditionSet` - Collection of conditions that must all match
- `ConditionCollector` - Manages and validates condition collections
- `ConditionSetCollector` - Manages condition set collections

**Qualifiers** (`src/packlets/qualifiers/`):
- `Qualifier` - Named dimension for resource qualification (e.g., "language", "territory")
- `QualifierCollector` - Manages qualifier definitions and validation

**Qualifier Types** (`src/packlets/qualifier-types/`):
- `QualifierType` - Defines validation and matching logic for qualifier values
- `LanguageQualifierType` - BCP47 language tag validation
- `TerritoryQualifierType` - Territory/region validation
- `LiteralQualifierType` - Enumerated literal values with optional hierarchy

**Decisions** (`src/packlets/decisions/`):
- `Decision` - Represents a resolved resource choice for a context
- `AbstractDecision` - Template for decisions with condition sets
- `ConcreteDecision` - Fully resolved decision with specific candidates

**Context** (`src/packlets/context/`):
- Defines the context against which resources are matched (e.g., {language: "en-US", territory: "US"})

**Import** (`src/packlets/import/`):
- `ImportManager` - Orchestrates importing resources from various sources
- `FsItemImporter` - Imports from file system items
- `PathImporter` - Imports from file paths
- `JsonImporter` - Imports from JSON structures
- `CollectionImporter` - Imports from resource collections

**Resource JSON** (`src/packlets/resource-json/`):
- JSON serialization and deserialization of resource structures
- Supports both tree and collection formats

### Key Patterns

1. **Result Pattern**: All operations that can fail return `Result<T>` objects from `@fgv/ts-utils`.  Avoid throwing errors directly as much as possible, preferring to return a Result and use .orThrow() on paths that must throw.
2. **Collector Pattern**: Used throughout for managing collections with validation
3. **Builder Pattern**: `ResourceBuilder` for constructing complex resources
4. **Converter Pattern**: Each major type has convert functions for declaration-to-object transformation
5. **Type-Safe Validation Pattern**: Always use proper Converter and Validator objects for type validation instead of manual checks and unsafe casts

### Type-Safe Validation Guidelines

**Converters vs Validators**
- **Converters**: Transform and construct new objects from input data (use for simple types, primitives, plain objects)
- **Validators**: Validate existing objects in-place without construction (use for complex objects with non-default constructors, class instances)

**Avoid Manual Type Checking and Unsafe Casts**
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

**When to Use Each Pattern**
- **Validators**: Objects with class instances, non-default constructors, existing object validation
- **Converters**: Plain data transformation, building new objects from primitives/JSON
- **Both**: Any situation where you would use manual type checking + casting

**Benefits**
- Type safety: Each property is validated according to its expected type
- Better error messages: Specific validation failures instead of generic messages
- Maintainability: Changes to type definitions automatically update validation
- Consistency: Same validation patterns used throughout the codebase

### Dependencies

- `@fgv/ts-utils` - Core utilities including Result pattern and collections
- `@fgv/ts-extras` - Additional utility functions
- `@fgv/ts-json-base` - JSON validation and processing
- `@fgv/ts-bcp47` - BCP47 language tag processing
- `@fgv/ts-json` - JSON schema validation
- `luxon` - Date/time handling

## Testing Philosophy

- Comprehensive unit tests for all components
- Tests located in `src/test/unit/` mirroring the source structure
- Uses Jest with custom matchers from `@fgv/ts-utils-jest`
- 100% coverage requirement enforced
- Test files follow `*.test.ts` naming convention
- This repo has strict lint rules against use of 'any' so do not use the any type in tests or code

### Testing Approach: Function-First, Coverage-Second

**Primary: Functional Testing**
Start by writing tests that "make sense" functionally, focusing on the component's intended behavior:

1. **Success Cases**: Test all main functionality with valid inputs
2. **Error Cases**: Test expected error conditions and validation failures
3. **Edge Cases**: Test boundary conditions, empty inputs, and reasonable corner cases
4. **Integration**: Test how components interact with their dependencies

Write these tests based on the component's public API and expected behavior, not based on implementation details or coverage reports.

**Secondary: Coverage Gap Analysis**
Only after functional tests are complete and correct, use coverage analysis to identify any missed executable paths.

### Coverage Gap Analysis and Resolution

When addressing coverage gaps, use this systematic approach:

1. **Analyze Coverage Reports**: Run `rushx test` to identify uncovered lines
2. **Categorize Coverage Gaps**:
   - **Business Logic** (HIGH priority): Core functionality that can be reached through normal operation
   - **Validation Logic** (MEDIUM priority): Input validation and error handling that can be tested
   - **Defensive Coding** (LOW priority): Internal consistency checks and error paths that are very difficult to trigger

3. **Prioritized Resolution Strategy**:
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

## Idiomatic Testing Patterns

### Unit Testing Principles

**Core Testing Guidelines:**
1. **Always ask before changing non-test code** - Test code should not drive changes to production exports or APIs
2. **Prefer testing via exported functionality** - Test through public APIs rather than creating mocks when possible
3. **Test interfaces via concrete implementations** - It's perfectly acceptable to test interface contracts using real implementations
4. **Test internal functionality via exported classes** - Use exported classes, interfaces, objects, or functions that utilize internal functionality
5. **Don't change exports to make internal functionality testable** - When it's difficult to test internal functionality via exports, import the specific module directly in the test file and disable lint warnings as needed

**Testing Through Public APIs:**
```typescript
// ✅ Good - Test internal validator through exported Runtime functions
expect(TsRes.Runtime.resourceCandidate.validate(data)).toSucceed();

// ✅ Good - Test interface through concrete implementation
const leafNode: IReadOnlyResourceTreeLeaf<T> = ResourceTreeLeaf.create(...).orThrow();
expect(leafNode.isLeaf).toBe(true);

// ✅ Good - Import module directly when needed, disable lint warnings
// eslint-disable-next-line import/no-internal-modules
import { InternalClass } from '../../../packlets/internal/internalModule';

// ❌ Avoid - Adding exports just for testing
export { InternalValidator }; // Don't add this just for tests

// ❌ Avoid - Excessive mocking when real implementations work
const mockValidator = jest.fn(); // Use real validator when possible
```

### TypeScript in Tests
- **NEVER use `any` type** - Will cause lint failures even in tests
- For corrupted/invalid test data: Use `as unknown as BrandedType` pattern
- For mock objects: Define proper interfaces or use `Partial<T>`
- Example:
```typescript
// ✅ Good - Proper type assertion for invalid test data
const corruptedData = {
  id: 'invalid' as unknown as TsRes.ResourceId,
  type: 999 as unknown as TsRes.ResourceTypeIndex
};

// ❌ Bad - Using any
const corruptedData = {
  id: 'invalid' as any,
  type: 999 as any
};
```

### Result Pattern Testing
Use the custom Jest matchers for consistent Result<T> testing **in test cases**:

#### Test Setup vs Test Assertions
```typescript
// ✅ Good - Use standard Result methods in setup (beforeEach, etc.)
beforeEach(() => {
  const qualifierTypesResult = QualifierTypeCollector.create(params);
  qualifierTypes = qualifierTypesResult.orThrow(); // OK in setup
  
  // Or use onSuccess for conditional setup
  resourceManager = ResourceManager.create(params).onSuccess((manager) => {
    manager.addResource(testResource).orThrow(); // OK in setup
    return manager;
  }).orThrow();
});

// ✅ Good - Use Result matchers in test cases
test('should create manager', () => {
  expect(ResourceManager.create(params)).toSucceedAndSatisfy((manager) => {
    expect(manager.qualifiers.size).toBe(2);
  });
});

// ❌ Avoid - Don't use Result matchers in setup
beforeEach(() => {
  expect(ResourceManager.create(params)).toSucceedAndSatisfy((manager) => {
    resourceManager = manager; // Wrong - this is setup, not a test
  });
});
```

#### Basic Success/Failure Testing
```typescript
// Simple success check
expect(qualifierCollector.create(validParams)).toSucceed();

// Simple failure check
expect(qualifierCollector.create(invalidParams)).toFail();
```

#### Value-Specific Testing
```typescript
// Test success with specific value
expect(converter.convert('input')).toSucceedWith(expectedOutput);

// Test failure with specific error message
expect(validator.validate(badInput)).toFailWith(/validation failed/i);
```

#### Complex Assertions
```typescript
// ✅ Preferred - Use toSucceedAndSatisfy for multiple assertions in tests
expect(ResourceManager.create(params)).toSucceedAndSatisfy((manager) => {
  expect(manager.qualifiers.size).toBe(2);
  expect(manager.resourceTypes.size).toBe(1);
  expect(manager.getResource('test')).toSucceed();
});

// ❌ Avoid - Don't extract values with .orThrow() in test cases
const managerResult = ResourceManager.create(params);
expect(managerResult).toSucceed();
const manager = managerResult.value; // Less idiomatic for test assertions
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

### Error Testing Best Practices
```typescript
// ✅ Good - Use regex patterns for flexible error matching
expect(operation()).toFailWith(/invalid.*parameter/i);

// ✅ Good - Test specific error conditions
expect(parser.parse('')).toFailWith(/empty input/i);
expect(parser.parse('{')).toFailWith(/syntax error/i);

// ❌ Avoid - Brittle exact string matching
expect(operation()).toFailWith('Invalid parameter: expected string');
```

### When to Use Each Matcher
- **`toSucceed()`** - When you only care that the operation succeeded
- **`toFail()`** - When you only care that the operation failed
- **`toSucceedWith(value)`** - When testing simple value equality
- **`toFailWith(pattern)`** - When testing error messages or types
- **`toSucceedAndSatisfy(callback)`** - When testing complex objects or multiple properties

### Anti-Patterns to Avoid
```typescript
// ❌ Don't use .orThrow() for test assertions (use Result matchers instead)
test('should work', () => {
  const result = operation();
  expect(result).toSucceed();
  const value = result.value; // Use toSucceedAndSatisfy instead
  expect(value.property).toBe(expected);
});

// ❌ Don't use Result matchers in setup code
beforeEach(() => {
  expect(ResourceManager.create(params)).toSucceedAndSatisfy((manager) => {
    resourceManager = manager; // Wrong - use .orThrow() or .onSuccess() in setup
  });
});

// ❌ Don't use any type even for test data
const testData = someValue as any; // Use proper typing

// ✅ Correct patterns for setup vs test assertions
beforeEach(() => {
  const setup = expensiveOperation().orThrow(); // OK in beforeEach
  resourceManager = ResourceManager.create(params).onSuccess((manager) => {
    manager.addResource(testResource).orThrow(); // OK in setup
    return manager;
  }).orThrow();
});

test('should have correct properties', () => {
  expect(resourceManager.getResource('test')).toSucceedAndSatisfy((resource) => {
    expect(resource.property).toBe(expected); // Use Result matchers in tests
  });
});
```

## Development Workflow

### Before Check-in Checklist
When making changes that affect the public API:
1. Run `rushx test` to ensure all tests pass
2. Run `rushx lint` to ensure code quality
3. **Run `rushx build-docs` to regenerate API documentation**
4. Commit changes including updated documentation files

## Code Organization

- Main entry point: `src/index.ts`
- Packlet-based organization under `src/packlets/`
- Each packlet has its own `index.ts` for exports
- Common utilities in `src/packlets/common/`
- Comprehensive type definitions throughout
- Uses Rush monorepo tooling with workspace dependencies