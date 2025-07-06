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

1. **Result Pattern**: All operations that can fail return `Result<T>` objects from `@fgv/ts-utils`
2. **Collector Pattern**: Used throughout for managing collections with validation
3. **Builder Pattern**: `ResourceBuilder` for constructing complex resources
4. **Converter Pattern**: Each major type has convert functions for declaration-to-object transformation

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