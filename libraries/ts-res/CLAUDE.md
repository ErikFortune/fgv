# CLAUDE.md

This file provides ts-res-specific guidance to Claude Code (claude.ai/code) when working with the `@fgv/ts-res` library.

**For general repository guidelines, testing philosophy, and TypeScript standards, see the root [CLAUDE.md](../../CLAUDE.md).**

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

1. **Result Pattern**: All operations that can fail return `Result<T>` objects from `@fgv/ts-utils`. Avoid throwing errors directly as much as possible, preferring to return a Result and use .orThrow() on paths that must throw.
2. **Collector Pattern**: Used throughout for managing collections with validation
3. **Builder Pattern**: `ResourceBuilder` for constructing complex resources
4. **Converter Pattern**: Each major type has convert functions for declaration-to-object transformation
5. **Type-Safe Validation Pattern**: Always use proper Converter and Validator objects for type validation instead of manual checks and unsafe casts (see [root CLAUDE.md](../../CLAUDE.md) for detailed guidelines)

### Dependencies

- `@fgv/ts-utils` - Core utilities including Result pattern and collections
- `@fgv/ts-extras` - Additional utility functions
- `@fgv/ts-json-base` - JSON validation and processing
- `@fgv/ts-bcp47` - BCP47 language tag processing
- `@fgv/ts-json` - JSON schema validation
- `luxon` - Date/time handling

## Testing Approach

**This library follows the repository-wide testing philosophy outlined in the [root CLAUDE.md](../../CLAUDE.md).**

**For comprehensive coverage guidelines and systematic approaches to achieving 100% test coverage, see [COVERAGE_GUIDELINES.md](../../COVERAGE_GUIDELINES.md).**

### ts-res-Specific Testing Patterns

#### Testing ts-res Components
```typescript
// ✅ Good - Test through ResourceManager public API
expect(ResourceManager.create(params)).toSucceedAndSatisfy((manager) => {
  expect(manager.qualifiers.size).toBe(2);
  expect(manager.resourceTypes.size).toBe(1);
  expect(manager.getResource('test')).toSucceed();
});

// ✅ Good - Test internal validators through Runtime exports
expect(TsRes.Runtime.resourceCandidate.validate(data)).toSucceed();

// ✅ Good - Test interface through concrete implementation
const leafNode: IReadOnlyResourceTreeLeaf<T> = ResourceTreeLeaf.create(...).orThrow();
expect(leafNode.isLeaf).toBe(true);
```

#### ts-res Result Pattern Examples
```typescript
// ✅ Good - Setup uses standard Result methods
beforeEach(() => {
  const qualifierTypesResult = QualifierTypeCollector.create(params);
  qualifierTypes = qualifierTypesResult.orThrow(); // OK in setup
  
  // Or use onSuccess for conditional setup
  resourceManager = ResourceManager.create(params).onSuccess((manager) => {
    manager.addResource(testResource).orThrow(); // OK in setup
    return manager;
  }).orThrow();
});

// ✅ Good - Test cases use Result matchers
test('should create manager', () => {
  expect(ResourceManager.create(params)).toSucceedAndSatisfy((manager) => {
    expect(manager.qualifiers.size).toBe(2);
  });
});
```

#### ts-res Error Testing
```typescript
// ✅ Good - Test ts-res-specific error conditions
expect(qualifierCollector.create(invalidParams)).toFailWith(/invalid qualifier/i);
expect(resourceManager.getResource('missing')).toFailWith(/resource not found/i);
expect(conditionSet.validate(context)).toFailWith(/condition not satisfied/i);
```

#### TypeScript in ts-res Tests
```typescript
// ✅ Good - Proper type assertions for ts-res branded types
const corruptedData = {
  id: 'invalid' as unknown as TsRes.ResourceId,
  type: 999 as unknown as TsRes.ResourceTypeIndex
};

// ❌ Bad - Never use any type
const corruptedData = {
  id: 'invalid' as any,
  type: 999 as any
};
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