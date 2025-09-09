# Observability Cleanup Specialized Agent

## Overview
This agent systematically retrofits the established ObservabilityContext pattern into components that currently use inconsistent observability mechanisms, while also standardizing Result error reporting and message formatting.

## Current State Analysis

### ✅ Established Standard (Target Pattern)
- **ObservabilityContext** with `useObservability()` hook
- **IObservabilityContext** interface with `diag` and `user` loggers  
- **Factories**: Console, NoOp, and test implementations
- **ObservabilityTools** namespace for centralized API
- **Result.report()** method for consistent error reporting

### ❌ Inconsistent Patterns Found
1. **Direct console usage**: `console.log/error/warn` instead of observability context
2. **Custom onMessage callbacks**: Manual `(type, message) => void` patterns
3. **Mixed approaches**: Some files use different patterns within same module
4. **Inline error handling**: Direct error message handling instead of Result.report()
5. **Inconsistent message formatting**: Various error message formats without standard structure

## Agent Capabilities

### Pattern Detection
- Identify files using inconsistent observability mechanisms
- Detect direct console calls, custom callbacks, and inline error handling

### Context Integration
- Replace direct console calls with `useObservability()` hook
- Update component logic to use standard observability pattern

### Result.report() Integration
- Replace inline error handling with Result.report()
- Ensure proper error propagation with context appending

### Message Format Standardization
- Apply `"${key}: explanation"` format for messages
- Standardize error context propagation

### Callback Standardization
- Replace custom `onMessage` props with observability context
- Update prop interfaces and calling components

### Documentation Updates
- Update JSDoc examples to show correct observability usage
- Ensure test updates with appropriate observability mocking

## Cleanup Categories

### Category 1: Direct Console Usage
**Target Files**: ImportView, ConfigurationView, ResolutionView, CompiledView, etc.
- Replace `console.log/error/warn` with observability context
- Add `useObservability()` hook integration
- Update JSDoc examples to use proper patterns

### Category 2: Custom onMessage Patterns
**Target Files**: useResolutionState, multiple view components
- Remove custom `onMessage` callback props
- Replace with observability context usage
- Update prop interfaces and calling components

### Category 3: Result Error Handling
**Target Files**: All files with Result error handling
- Replace inline error handling with `Result.report(observability.diag)` or `Result.report(observability.user)`
- Ensure proper error propagation with context appending

### Category 4: Message Formatting
**Target Files**: All files generating user or diagnostic messages
- Standardize to `"${key}: explanation"` format where key is (name, index, path, id, etc.)
- Example transformations:
  - `"Error in resource ABC123"` → `"ABC123: Resource processing failed"`
  - `"Invalid value at index 5"` → `"5: Invalid value provided"`
  - `"Failed to load /path/to/file"` → `"/path/to/file: Failed to load"`

### Category 5: Error Propagation
**Target Files**: Files that catch and re-throw or propagate errors
- Ensure context is properly appended when propagating errors
- Use `.withErrorFormat()` or similar Result methods
- Example: `fail(\`\${resourceId}: Failed to process: \${originalError}\`)`

## Agent Workflow

### 1. Module Analysis
Analyze target module for observability patterns:
- Scan for console.* calls
- Identify custom onMessage patterns
- Find Result error handling patterns
- Check message formatting consistency

### 2. Pattern Categorization
Identify specific inconsistencies:
- List all direct console usage
- Document custom callback patterns
- Note inline error handling
- Identify message format variations

### 3. Refactoring Plan
Create detailed transformation plan including:
- Console call replacements
- Result.report() integration points
- Message format standardization
- Error propagation improvements

### 4. Implementation
Execute systematic refactoring:
- Add `useObservability()` hook where needed
- Replace console calls with observability context
- Update error handling to use Result.report()
- Standardize message formats
- Update prop interfaces

### 5. Validation
Ensure tests pass and functionality preserved:
- Run existing tests
- Update test mocks for observability
- Verify no functional regressions

### 6. Documentation
Update examples and documentation:
- Update JSDoc examples
- Fix inline code comments
- Update README examples if present

## Success Criteria
- ✅ All console calls replaced with observability context
- ✅ Result.report() used for all Result error handling
- ✅ Consistent `"${key}: explanation"` message format
- ✅ Proper error context propagation
- ✅ Custom message callbacks eliminated
- ✅ Consistent `useObservability()` usage
- ✅ Updated JSDoc examples
- ✅ Passing tests with proper observability mocking
- ✅ No functional regressions

## Implementation Guidelines

### One Module at a Time
- Focus on single module per cleanup action
- Complete all changes in module before moving to next
- Ensure module is fully functional before proceeding

### Preserve Functionality
- Maintain exact same user-visible behavior
- Keep same error handling semantics
- Preserve all existing features

### Update Tests
- Ensure proper observability context in tests
- Update test mocks and wrappers
- Verify coverage remains at 100%

### Documentation Consistency
- Update all examples and comments
- Ensure JSDoc reflects new patterns
- Keep documentation accurate

## Example Transformations

### Direct Console Usage
```typescript
// ❌ Before:
console.error('Failed to load resource');
console.log('Processing started');
console.warn('Deprecated feature used');

// ✅ After:
const observability = useObservability();
observability.diag.error('resource-load: Failed to load resource');
observability.diag.info('processing: Started processing');
observability.diag.warn('deprecation: Deprecated feature used');
```

### Custom onMessage Callback
```typescript
// ❌ Before:
interface IComponentProps {
  onMessage?: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void;
}

function MyComponent({ onMessage }: IComponentProps) {
  onMessage?.('error', 'Invalid configuration');
}

// ✅ After:
interface IComponentProps {
  // onMessage prop removed
}

function MyComponent(props: IComponentProps) {
  const observability = useObservability();
  observability.user.error('configuration: Invalid configuration provided');
}
```

### Result Error Handling
```typescript
// ❌ Before:
const result = someOperation();
if (result.isFailure()) {
  console.log('Operation failed:', result.message);
  onMessage?.('error', result.message);
}

// ✅ After:
const observability = useObservability();
const result = someOperation();
result.report(observability.diag);
```

### Message Formatting
```typescript
// ❌ Before:
return fail('Error processing item at position ' + index);
return fail(`Failed to load resource ${id}`);
return fail('Invalid value: ' + value + ' at path: ' + path);

// ✅ After:
return fail(`${index}: Failed to process item`);
return fail(`${id}: Failed to load resource`);
return fail(`${path}: Invalid value '${value}'`);
```

### Error Propagation
```typescript
// ❌ Before:
someOperation()
  .onFailure((msg) => {
    console.error('Operation failed:', msg);
    return fail('Processing failed');
  });

// ✅ After:
const observability = useObservability();
someOperation()
  .onFailure((msg) => {
    return fail(`processing: ${msg}`);
  })
  .report(observability.diag);
```

## Usage Instructions

To use this agent for cleaning up a module:

1. **Identify the target module** - Specify which module/component to clean up
2. **Run the agent** - The agent will analyze and create a refactoring plan
3. **Review the plan** - Check the proposed changes
4. **Execute the cleanup** - Agent will implement the changes
5. **Validate** - Run tests to ensure everything works
6. **Commit** - Once validated, commit the changes

Example usage:
```
"Clean up observability in the ImportView component"
"Retrofit observability context into useResolutionState hook"
"Standardize error messages in the resolutionUtils module"
```

## Notes

- This agent follows the monorepo guidelines and Result pattern guide
- All changes maintain 100% test coverage requirement
- The agent preserves existing functionality while improving consistency
- Focus is on systematic, incremental improvements
- Each cleanup action is atomic and testable