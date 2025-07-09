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
All operations that can fail return `Result<T>` objects from `@fgv/ts-utils`. This provides consistent error handling across the codebase.

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

## Testing Standards

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

## Development Workflow

1. **Setup**: Run `rush install` to install all dependencies
2. **Build**: Run `rush build` to build all projects
3. **Test**: Run `rush test` to run all tests
4. **Lint**: Run `rushx lint` in individual projects
5. **API Changes**: Run `rushx build-docs` to regenerate API documentation

## Important Notes

- The ts-res library has its own detailed CLAUDE.md file in `libraries/ts-res/`
- All projects use TypeScript 5.7.3 with strict type checking
- Tests are located in `src/test/unit/` mirroring source structure
- Documentation is auto-generated and should not be manually edited
- Rush enforces consistent dependency versions across the monorepo

## Package Manager

- Uses **pnpm 8.15.9** for fast, efficient package management
- Workspace protocol (`workspace:*`) for inter-project dependencies
- Shared lockfile at `common/temp/pnpm-lock.yaml`