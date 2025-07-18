# CLI Filtering Implementation Plan

## Overview

This plan outlines the implementation of enhanced filtering functionality for the ts-res-cli tool. The implementation will consist of two main phases:

1. **Phase 1: Context Token Support** - Add ContextToken support to the ts-res library (common module)
2. **Phase 2: CLI Filtering Enhancements** - Extend CLI with advanced filtering options

## Phase 1: Context Token Support (ts-res library)

### Background

The ts-res library already has `ConditionToken` and `ConditionSetToken` support for parsing condition strings like:
- ConditionToken: `"language=en-US"` or `"value"`
- ConditionSetToken: `"language=en-US,territory=US"` (comma-separated)

We need similar support for **context** filtering, but with different syntax to handle comma-separated values within context values (e.g., language lists like `"en-US, de-DE"`).

### Proposed ContextToken Syntax

**ContextToken**: `"qualifier=value"` or `"value"`
- Examples: `"language=en-US"`, `"territory=US"`, `"role"`

**ContextSetToken**: Uses `"|"` as separator instead of `,` to avoid conflicts with comma-separated context values
- Examples: `"language=en-US,de-DE|territory=US|role=admin"`
- Allows: `"language=en-US,de-DE"` (comma-separated language list)
- Separates multiple context conditions with: `"|"`

### Implementation Steps

#### 1.1 Define Context Token Types

**File: `libraries/ts-res/src/packlets/common/conditions.ts`**

Add after existing ConditionToken definitions:

```typescript
/**
 * A string representing a validated context token. Context tokens are used
 * for filtering resources by context criteria. A context token has the form
 * `<qualifierName>=<value>` or `<value>`.
 * @public
 */
export type ContextToken = Brand<string, 'ContextToken'>;

/**
 * A string representing a validated context set token. Context set tokens are
 * pipe-separated lists of one or more context tokens. Uses "|" as separator
 * to avoid conflicts with comma-separated values within context values.
 * Example: "language=en-US,de-DE|territory=US|role=admin"
 * @public
 */
export type ContextSetToken = Brand<string, 'ContextSetToken'>;
```

#### 1.2 Add Context Token Validation

**File: `libraries/ts-res/src/packlets/common/validate/conditions.ts`**

Add validation functions following the same pattern as condition tokens:

```typescript
/**
 * Tests if a string is a valid context token.
 * Context tokens have the form "qualifier=value" or "value".
 * @param token - the string to test
 * @public
 */
export function isValidContextToken(token: string): token is ContextToken {
  // Similar validation to isValidConditionToken but for context
  // Allow broader character set for context values (including commas)
}

/**
 * Tests if a string is a valid context set token.
 * Context set tokens are pipe-separated lists of context tokens.
 * @param token - the string to test
 * @public
 */
export function isValidContextSetToken(token: string): token is ContextSetToken {
  return token.split('|').every(part => isValidContextToken(part.trim()));
}

/**
 * Converts a string to a ContextToken if valid.
 * @param token - the string to convert
 * @public
 */
export function toContextToken(token: string): Result<ContextToken> {
  if (!isValidContextToken(token)) {
    return fail(`${token}: not a valid context token`);
  }
  return succeed(token);
}

/**
 * Converts a string to a ContextSetToken if valid.
 * @param token - the string to convert
 * @public
 */
export function toContextSetToken(token: string): Result<ContextSetToken> {
  if (!isValidContextSetToken(token)) {
    return fail(`${token}: not a valid context set token`);
  }
  return succeed(token);
}
```

#### 1.3 Add Context Token Helpers

**File: `libraries/ts-res/src/packlets/common/helpers/contexts.ts`** (new file)

Mirror the structure of `conditions.ts` helpers:

```typescript
/**
 * The values needed to create a ContextToken.
 * @public
 */
export interface IContextTokenParts {
  qualifier?: string;
  value: string;
}

/**
 * Converts context token parts into a validated ContextToken.
 * @param parts - the parts to convert
 * @public
 */
export function buildContextToken({ qualifier, value }: IContextTokenParts): Result<ContextToken>;

/**
 * Converts an array of context token parts into a ContextSetToken.
 * @param parts - the parts to convert
 * @public
 */
export function buildContextSetToken(parts: ReadonlyArray<IContextTokenParts>): Result<ContextSetToken>;

/**
 * Parses a context token string into its parts.
 * @param token - the token string to parse
 * @public
 */
export function parseContextTokenParts(token: string): Result<IContextTokenParts>;

/**
 * Parses a context set token string into an array of context token parts.
 * @param token - the context set token string to parse
 * @public
 */
export function parseContextSetTokenParts(token: string): Result<IContextTokenParts[]>;
```

#### 1.4 Update Module Exports

Update relevant index files to export the new context token functionality.

#### 1.5 Add Tests

**Files: `test/unit/common/` (various test files)**

- Test context token validation (valid/invalid formats)
- Test context set token parsing (pipe-separated)
- Test helper functions (build/parse)
- Test edge cases (empty values, special characters, comma-separated values within tokens)

## Phase 2: CLI Filtering Enhancements

### Current CLI Filtering State

The CLI already has some filtering options:
- `--context <json>` - JSON context filter
- `--resource-types <types>` - Resource type filter (comma-separated)

### Proposed CLI Filtering Enhancements

#### 2.1 Context Token CLI Option

Add support for the new ContextSetToken syntax:

```bash
# Current JSON syntax (keep for backwards compatibility)
ts-res-compile --context '{"language": "en-US", "territory": "US"}'

# New token syntax (more CLI-friendly)
ts-res-compile --context-filter "language=en-US|territory=US"
ts-res-compile --context-filter "language=en-US,de-DE|territory=US|role=admin"
```

#### 2.2 Resource ID Pattern Filtering

Add resource ID pattern matching:

```bash
# Include only resources matching patterns
ts-res-compile --include-resources "messages.*,buttons.*"
ts-res-compile --include-resources "app.title,*.welcome"

# Exclude resources matching patterns
ts-res-compile --exclude-resources "test.*,*.debug"

# Combined filtering
ts-res-compile --include-resources "messages.*" --exclude-resources "*.internal"
```

#### 2.3 Advanced Filtering Options

Add more sophisticated filtering:

```bash
# Filter by candidate count
ts-res-compile --min-candidates 2 --max-candidates 10

# Filter by condition complexity
ts-res-compile --has-conditions  # Only resources with conditions
ts-res-compile --no-conditions   # Only resources without conditions

# Filter by resource metadata
ts-res-compile --has-metadata
ts-res-compile --resource-keys "title,description"  # Only resources with specific JSON keys
```

### Implementation Steps

#### 2.1 Update CLI Options Interface

**File: `tools/ts-res-cli/src/options.ts`**

```typescript
export interface ICompileCommandOptions {
  // ... existing options ...
  
  // New filtering options
  contextFilter?: string;           // ContextSetToken string
  includeResources?: string;        // Comma-separated patterns
  excludeResources?: string;        // Comma-separated patterns
  minCandidates?: number;          // Minimum candidate count
  maxCandidates?: number;          // Maximum candidate count
  hasConditions?: boolean;         // Filter by condition presence
  noConditions?: boolean;          // Filter by condition absence
  hasMetadata?: boolean;           // Filter by metadata presence
  resourceKeys?: string;           // Required JSON keys
}

export interface ICompileOptions {
  // ... existing options ...
  
  // New filtering options
  contextFilter?: ContextSetToken;
  includeResources?: string[];
  excludeResources?: string[];
  minCandidates?: number;
  maxCandidates?: number;
  hasConditions?: boolean;
  noConditions?: boolean;
  hasMetadata?: boolean;
  resourceKeys?: string[];
}
```

#### 2.2 Update CLI Command Definitions

**File: `tools/ts-res-cli/src/cli.ts`**

Add new options to compile, validate, and info commands:

```typescript
.option('--context-filter <token>', 'Context filter using token syntax (pipe-separated)')
.option('--include-resources <patterns>', 'Include only resources matching patterns (comma-separated)')
.option('--exclude-resources <patterns>', 'Exclude resources matching patterns (comma-separated)')
.option('--min-candidates <number>', 'Minimum number of candidates per resource', parseInt)
.option('--max-candidates <number>', 'Maximum number of candidates per resource', parseInt)
.option('--has-conditions', 'Include only resources with conditions', false)
.option('--no-conditions', 'Include only resources without conditions', false)
.option('--has-metadata', 'Include only resources with metadata', false)
.option('--resource-keys <keys>', 'Include only resources with specified JSON keys (comma-separated)')
```

#### 2.3 Implement Filtering Logic

**File: `tools/ts-res-cli/src/compiler.ts`**

Add filtering methods:

```typescript
private _applyResourceFilters(resources: IResourceCollection): Result<IResourceCollection> {
  // Apply include/exclude patterns
  // Apply candidate count filters
  // Apply condition presence filters
  // Apply metadata filters
  // Apply resource key filters
}

private _matchesResourcePattern(resourceId: string, patterns: string[]): boolean {
  // Implement glob-style pattern matching
  // Support wildcards: *, ?
  // Support prefix/suffix matching
}

private _parseContextFilter(): Result<JsonObject | undefined> {
  // Parse ContextSetToken into JsonObject
  // Convert to context format expected by ResourceManager
}
```

#### 2.4 Update Option Parsing

**File: `tools/ts-res-cli/src/cli.ts`**

Update `_parseCompileOptions` to handle new filtering options:

```typescript
private _parseCompileOptions(options: ICompileCommandOptions): Result<ICompileOptions> {
  // ... existing parsing ...
  
  // Parse context filter token
  let contextFilterObj: JsonObject | undefined;
  if (options.contextFilter) {
    const parseResult = this._parseContextFilter(options.contextFilter);
    if (parseResult.isFailure()) return parseResult;
    contextFilterObj = parseResult.value;
  }
  
  // Parse resource patterns
  const includeResources = options.includeResources?.split(',').map(s => s.trim());
  const excludeResources = options.excludeResources?.split(',').map(s => s.trim());
  const resourceKeys = options.resourceKeys?.split(',').map(s => s.trim());
  
  // Validate numerical options
  if (options.minCandidates !== undefined && options.minCandidates < 0) {
    return fail('minCandidates must be non-negative');
  }
  
  const compileOptions: ICompileOptions = {
    // ... existing options ...
    contextFilter: contextFilterObj,
    includeResources,
    excludeResources,
    minCandidates: options.minCandidates,
    maxCandidates: options.maxCandidates,
    hasConditions: options.hasConditions,
    noConditions: options.noConditions,
    hasMetadata: options.hasMetadata,
    resourceKeys
  };
  
  return succeed(compileOptions);
}
```

#### 2.5 Add Comprehensive Tests

**Files: `tools/ts-res-cli/test/` (various test files)**

Test scenarios:
- Context token parsing and conversion
- Resource pattern matching (include/exclude)
- Candidate count filtering
- Condition presence filtering
- Metadata filtering
- Combined filter scenarios
- Error handling (invalid patterns, conflicts)
- Integration with existing filtering (context, resource-types)

#### 2.6 Update Documentation

- CLI help text
- README examples
- API documentation for new interfaces

### Test Strategy

#### Unit Tests
- Context token validation and parsing
- Resource pattern matching logic
- Filter combination logic
- Option parsing and validation

#### Integration Tests
- End-to-end CLI filtering scenarios
- Filter interaction with existing options
- Performance with large resource collections

#### Edge Cases
- Empty filter results
- Conflicting filters (include/exclude)
- Invalid pattern syntax
- Context token parsing errors

## Success Criteria

### Phase 1 Complete When:
- ✅ ContextToken and ContextSetToken types defined
- ✅ Validation functions implemented and tested
- ✅ Helper functions for building/parsing context tokens
- ✅ 100% test coverage for new functionality
- ✅ API documentation updated

### Phase 2 Complete When:
- ✅ All new CLI filtering options implemented
- ✅ Context token CLI integration working
- ✅ Resource pattern matching functional
- ✅ Advanced filtering options operational
- ✅ Comprehensive test coverage (unit + integration)
- ✅ All existing tests still pass
- ✅ Documentation updated with examples

## Implementation Timeline

1. **Phase 1: Context Tokens** (libraries/ts-res)
   - Define types and validation (1-2 hours)
   - Implement helper functions (1-2 hours)
   - Write comprehensive tests (2-3 hours)
   - Update exports and documentation (1 hour)

2. **Phase 2: CLI Enhancements** (tools/ts-res-cli)
   - Update interfaces and option definitions (1 hour)
   - Implement filtering logic (3-4 hours)
   - Add CLI option parsing (2 hours)
   - Write comprehensive tests (3-4 hours)
   - Update documentation (1 hour)

**Total Estimated Time: 14-19 hours**

## Risk Mitigation

- **Breaking Changes**: Maintain backwards compatibility with existing `--context` JSON syntax
- **Performance**: Test filtering performance with large resource sets
- **Pattern Complexity**: Start with simple glob patterns, add complexity incrementally
- **Test Coverage**: Maintain 100% test coverage requirement
- **Documentation**: Keep examples up-to-date with new functionality

## Future Enhancements

Potential future additions (not in scope for this implementation):
- Regular expression pattern support
- Advanced boolean logic for filters (AND/OR/NOT)
- Filter result statistics and reporting
- Filter validation and suggestions
- Saved filter configurations