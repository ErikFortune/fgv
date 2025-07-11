# ResourceTree Implementation Plan

## Overview
Create a tree-structured presentation of resources in a CompiledResourceCollection based on ResourceId structure. ResourceIds are dot-separated sequences of identifiers that can be split into component names to construct a tree.

## Status: Phase 1 Complete ✅

### ✅ Phase 1: Research and Foundation
1. **✅ Explore ResourceId and ResourceName structures**
   - ResourceId: Branded string representing dot-separated sequence of ResourceNames
   - ResourceName: Branded string representing individual identifier component
   - Validation: Uses regex patterns `identifier` and `segmentedIdentifier`
   - Helper functions: `splitResourceId()` and `joinResourceIds()` in common/helpers/resources

2. **✅ Study ValidatingResultMap pattern**
   - ValidatingResultMap extends base ResultMap with `.validating` property
   - Follows pattern: Base class + Validating class + Read-only interfaces
   - Uses constructor params interface and static factory methods with Result pattern

3. **✅ Architecture Decision**
   - **Decision: Implement both base and validating classes**
   - ReadOnlyResourceTree<T> - Base class with core tree functionality
   - ReadOnlyValidatingResourceTree<T> - Extends base with validation
   - Follows established patterns for consistency and reusability

## ✅ Phase 2: Core Implementation Complete

### ✅ Files Created:
1. **ReadOnlyResourceTree<T>** - `src/packlets/runtime/readOnlyResourceTree.ts`
   - Generic tree structure with IResourceTreeNode interface
   - Methods: getResource(), getNode(), getAllResources(), traverse(), etc.
   - Supports tree construction from ResourceId hierarchy
   - Read-only operations only (no mutation)

2. **ReadOnlyValidatingResourceTree<T>** - `src/packlets/runtime/readOnlyValidatingResourceTree.ts`
   - Extends ReadOnlyResourceTree with validation layer
   - Adds `.validating` property for type-safe operations
   - Validates ResourceId strings before tree operations
   - Uses Result pattern throughout

3. **CompiledResourceCollection Enhancement**
   - Added `getBuiltResourceTree()` method
   - Lazy initialization with caching
   - Returns `Result<IReadOnlyValidatingResourceTree<IResource>>`

### ✅ Key Features Implemented:
- **Tree Structure**: Hierarchical organization based on dot-separated ResourceIds
- **Node Types**: Branch nodes (intermediate paths) and leaf nodes (actual resources)
- **Navigation**: Path-based lookup, tree traversal, resource enumeration
- **Validation**: Type-safe access with input validation
- **Performance**: Lazy initialization and caching
- **Immutability**: Read-only tree structure

## 🔄 Phase 3: Next Steps

### 🔲 Testing (Priority: High)
1. **Unit tests for ReadOnlyResourceTree<T>**
   - Location: `src/test/unit/runtime/readOnlyResourceTree.test.ts`
   - Test tree construction, traversal, and lookup operations
   - Test edge cases (empty tree, single resource, deep hierarchy)

2. **Unit tests for ReadOnlyValidatingResourceTree<T>**
   - Location: `src/test/unit/runtime/readOnlyValidatingResourceTree.test.ts`
   - Test validation logic and Result patterns
   - Test validating interface operations

3. **Integration tests with CompiledResourceCollection**
   - Location: `src/test/unit/runtime/compiledResourceCollection.test.ts`
   - Test getBuiltResourceTree() method
   - Test lazy initialization and caching behavior

### 🔲 Documentation and Exports (Priority: Medium)
1. **Update exports**
   - Add to `src/packlets/runtime/index.ts`
   - Update main library exports
   - Ensure proper TypeScript definitions

2. **JSDoc documentation**
   - Complete API documentation for all public methods
   - Add usage examples
   - Document tree structure format

## Design Principles Used

- **Result Pattern**: Consistent error handling throughout
- **Read-Only Design**: Immutable tree structure for safety
- **Lazy Initialization**: Performance optimization for tree construction
- **Type Safety**: Strong TypeScript typing with validation
- **Pattern Consistency**: Follows ValidatingResultMap architectural pattern

## Dependencies

- **@fgv/ts-utils**: Result pattern, Converter interface, captureResult
- **Common packlet**: ResourceId, ResourceName, splitResourceId, validation functions
- **Runtime packlet**: IResource interface, CompiledResourceCollection

## Example Usage

```typescript
// Get resource tree from compiled collection
const treeResult = compiledCollection.getBuiltResourceTree();
if (treeResult.isSuccess()) {
  const tree = treeResult.value;
  
  // Navigate tree structure
  const appNodeResult = tree.getNode('app' as ResourceId);
  const welcomeResourceResult = tree.getResource('app.messages.welcome' as ResourceId);
  
  // Use validating interface for string input
  const validatedResource = tree.validating.getResource('app.messages.welcome');
  
  // Traverse tree
  tree.traverse((node) => {
    console.log(`${node.path}: ${node.isLeaf ? 'resource' : 'branch'}`);
  });
}
```

## Architecture Benefits

1. **Hierarchical Organization**: Natural tree view of resource structure
2. **Efficient Navigation**: Direct path-based resource lookup
3. **Type Safety**: Validation layer prevents runtime errors
4. **Performance**: Lazy loading with caching for large resource sets
5. **Consistency**: Follows established library patterns
6. **Extensibility**: Base class allows for future enhancements

This implementation provides a robust foundation for tree-structured resource organization while maintaining the library's architectural principles and patterns.