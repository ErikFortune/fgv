# ts-res-ui-components Refactoring Plan

## Problem Analysis

### Current Issues
The ts-res-ui-components library has accumulated technical debt through attempts to optimize and short-circuit the proper data flow:
- Widespread use of `any` types (30+ instances in production code)
- Unsafe type assertions and casts
- Complex branching logic to handle special cases
- Polymorphic handling where ResourceManager sometimes contains ResourceManagerBuilder and sometimes CompiledResourceCollection
- The orchestrator contains business logic instead of pure coordination

### Root Cause
The bundle import feature created a special case that broke the clean flow. Instead of normalizing bundles into the standard pipeline, the code tried to inject CompiledResourceCollection directly into the middle of the flow, leading to type confusion and complex branching.

## Architecture Overview

### Core Principle: One Clean Flow
All operations must follow the same pipeline, with no shortcuts or special cases:
```
Configuration → ResourceManagerBuilder → [Filter?] → Filtered RMB → CompiledCollection → Resolver
```

### Fundamental Entities

1. **Configuration** (`ISystemConfiguration`)
   - Must exist first
   - Defines qualifier types, qualifiers, and resource types
   - Controls how imports are processed

2. **Primary ResourceManagerBuilder**
   - The source of truth for all resources
   - Created by importing files using the configuration
   - All modifications create clones, never mutate

3. **Filter Context** (`Map<QualifierName, string | undefined>`)
   - Optional qualifier values for filtering
   - Reduces the resource space
   - Creates a subset of resources/candidates

4. **Filtered ResourceManagerBuilder**
   - Clone of primary with filter parameters applied
   - If no filter, this is just a reference to primary (no clone needed)
   - Still a ResourceManagerBuilder, maintaining type consistency

### Derived Entities

5. **CompiledResourceCollection**
   - Always derived from the current ResourceManagerBuilder (filtered or primary)
   - Pre-compiled for efficient runtime access
   - Regenerated when the source ResourceManagerBuilder changes

6. **ResourceResolver**
   - Created from ResourceManagerBuilder + Resolution Context
   - Resolution Context is a DIFFERENT `Map<QualifierName, string | undefined>` than Filter Context
   - Resolves resources based on the resolution context

### Key Insight: Two Different Contexts
- **Filter Context**: Reduces the resource space (affects what resources/candidates exist)
- **Resolution Context**: Resolves within that space (determines which candidate wins)

## Import Normalization

All import types must produce a ResourceManagerBuilder:

1. **Configuration Import**
   - Sets up the system configuration
   - Prerequisite for all other imports

2. **Resource Files/Directories**
   - Import using configuration → ResourceManagerBuilder

3. **Bundle Import** (the fix)
   - Extract configuration
   - Extract CompiledResourceCollection
   - **Reconstruct ResourceManagerBuilder from CompiledResourceCollection**
   - Continue with normal flow

4. **ZIP File Import**
   - Extract configuration
   - Extract resource files
   - Import files using configuration → ResourceManagerBuilder

## Operations via Cloning

All modifications create new instances via cloning:

1. **Filtering**
   - Clone primary ResourceManagerBuilder
   - Apply filter parameters
   - Produce filtered ResourceManagerBuilder

2. **Apply Edits** (from Resolution Viewer)
   - Clone current ResourceManagerBuilder
   - Pass in new conditions/values
   - Let ResourceManagerBuilder do the work
   - Produce updated ResourceManagerBuilder

3. **No Filter Case**
   - Filtered ResourceManagerBuilder = reference to Primary
   - No cloning needed, just point to primary

## Implementation Guidelines

### Result Pattern Usage
- **Follow RESULT_PATTERN_GUIDE.md** in the root directory for all Result pattern usage
- Avoid intermediate result variables when possible
- Use `.onSuccess()` and `.onFailure()` for chaining operations
- Use `.orDefault()` for acceptable undefined/default values
- Use `.orThrow()` only in setup/test code, not production paths
- Use `captureResult` around code that might throw to convert to Results

### Type Safety and Validation
- **NEVER use unsafe casts**, especially for structs
- Use existing Converters or Validators from ts-res/ts-utils:
  - Converters: Transform and construct new objects (for simple types, primitives)
  - Validators: Validate existing objects without construction (for complex objects, class instances)
- If no converter/validator exists for a type, **create one** rather than using unsafe casts
- Example: Instead of `as ResourceType`, use `Convert.resourceType(value)` or create a new converter

## Implementation Plan

### Phase 1: Type System Cleanup
- Define proper TypeScript interfaces for all entities
- Replace all `any` types with specific types (using JsonValue for JSON data)
- Create validators/converters for new types as needed
- Establish clear type boundaries between components
- Import proper types from ts-res (QualifierTypes, Qualifiers, ResourceTypes, etc.)

### Phase 2: Import Flow Normalization
- Refactor bundle import to reconstruct ResourceManagerBuilder
- Remove special case handling for bundles
- Ensure all import paths produce ResourceManagerBuilder
- Eliminate polymorphic resource manager handling

### Phase 3: Clone-Based Operations
- Implement clone-based filtering
- Implement clone-based edit application
- Ensure primary ResourceManagerBuilder is never mutated
- Remove complex branching logic

### Phase 4: Orchestrator Simplification
- Extract business logic to dedicated services
- Make orchestrator a pure coordination layer
- Simplify state management
- Remove redundant effects and callbacks

### Phase 5: Testing & Validation
- Test each import type follows the same flow
- Verify filtering and editing via cloning
- Ensure type safety throughout
- Validate no regressions in functionality

## Success Criteria

1. **Zero `any` types** in production code
2. **Single flow path** for all operations
3. **Type-safe** throughout with proper interfaces
4. **No special cases** or branching for different import types
5. **Pure orchestrator** that only coordinates, no business logic
6. **Immutable operations** via cloning, no mutations
7. **Clear separation** between Filter Context and Resolution Context

## Expected Benefits

- **Type Safety**: Full TypeScript benefits with compile-time checking
- **Maintainability**: Clear, predictable flow without special cases
- **Debuggability**: Linear flow easier to trace and debug
- **Extensibility**: New features follow established patterns
- **Performance**: Simpler code paths, less branching
- **Reliability**: Fewer edge cases and error conditions