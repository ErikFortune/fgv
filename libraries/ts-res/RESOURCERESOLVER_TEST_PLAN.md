# ResourceResolver Test Enhancement Plan

## Objective
Enhance the existing `resourceResolver.test.ts` to verify that a `CompiledResourceCollection` functions identically to the `ResourceManagerBuilder` from which it was created. This will ensure feature parity and help catch any regression issues between the two implementations.

## Current Test Structure Analysis

### Current Setup (beforeEach)
1. Creates `qualifierTypes`, `qualifiers`, `resourceTypes` collections
2. Creates `ResourceManagerBuilder` instance (`resourceManager`)
3. Adds test resources with multiple candidates and conditions
4. Builds the resource manager to create decisions
5. Creates context provider with initial values
6. Creates single `ResourceResolver` using the `ResourceManagerBuilder`

### Current Test Coverage
- **create method**: Basic instantiation
- **resolveResource**: Best match, partial matches, no matches, errors
- **resolveAllResourceValues**: Multiple candidates, ordering, failures
- **caching behavior**: Cache hits, context changes, condition set caching
- **cache size properties**: Size verification
- **error handling**: Invalid indices, missing properties

## Proposed Enhancement Strategy

### 1. Setup Enhancement
**Goal**: Create dual resolvers in `beforeEach` for side-by-side testing

**Changes**:
1. Rename current `resolver` to `builderResolver` for clarity
2. Add `compiledCollection` variable of type `CompiledResourceCollection`
3. Add `collectionResolver` variable of type `ResourceResolver`
4. In `beforeEach`:
   - After building the `resourceManager`, call `getCompiledResourceCollection()`
   - Create `CompiledResourceCollection` from the compiled data
   - Create second `ResourceResolver` using the `CompiledResourceCollection`

**Code Structure**:
```typescript
let builderResolver: TsRes.Runtime.ResourceResolver;
let collectionResolver: TsRes.Runtime.ResourceResolver;
let compiledCollection: TsRes.Runtime.CompiledResourceCollection;

beforeEach(() => {
  // ... existing setup ...
  
  // Build the resource manager
  resourceManager.build().orThrow();
  
  // Create compiled collection
  const compiled = resourceManager.getCompiledResourceCollection().orThrow();
  compiledCollection = TsRes.Runtime.CompiledResourceCollection.create({
    compiledCollection: compiled,
    qualifierTypes,
    resourceTypes
  }).orThrow();
  
  // Create resolvers
  builderResolver = TsRes.Runtime.ResourceResolver.create({
    resourceManager,
    qualifierTypes,
    contextQualifierProvider: contextProvider
  }).orThrow();
  
  collectionResolver = TsRes.Runtime.ResourceResolver.create({
    resourceManager: compiledCollection,
    qualifierTypes,
    contextQualifierProvider: contextProvider
  }).orThrow();
});
```

### 2. Test Enhancement Pattern
**Goal**: Test both resolvers side-by-side in each existing test case

**Approach**: Create helper function to run identical tests on both resolvers
```typescript
function testBothResolvers(
  testName: string,
  testFn: (resolver: TsRes.Runtime.ResourceResolver, resolverName: string) => void
) {
  describe(testName, () => {
    test(`with ResourceManagerBuilder (${testName})`, () => {
      testFn(builderResolver, 'builder');
    });
    
    test(`with CompiledResourceCollection (${testName})`, () => {
      testFn(collectionResolver, 'collection');
    });
  });
}
```

### 3. Test Categories to Enhance

#### A. Core Resolution Tests
- **resolveResource**: Verify identical results for best match resolution
- **resolveAllResourceValues**: Verify identical candidate ordering and values
- Both should return exact same results for same input

#### B. Interface Compliance Tests  
- **IResourceManager interface**: Both should expose same properties
- **getBuiltResource**: Should return equivalent `IResource` objects
- **builtResources**: Should have same keys and equivalent values
- **conditions/conditionSets/decisions**: Should have same sizes and equivalent data

#### C. Caching Behavior Tests
- **Cache initialization**: Both should start with same cache sizes
- **Cache behavior**: Both should cache and clear in same patterns
- **Performance consistency**: Cache hits/misses should be equivalent

#### D. Error Handling Tests
- **Invalid inputs**: Both should fail with equivalent error messages
- **Missing resources**: Both should handle missing resources identically
- **Context changes**: Both should handle context modifications the same way

### 4. Implementation Steps

#### Step 1: Setup Infrastructure
1. Modify `beforeEach` to create both resolvers
2. Add helper function for dual testing
3. Verify basic setup works with a simple test

#### Step 2: Convert Existing Tests (Incremental)
1. **create method tests**: Verify both types can be created
2. **resolveResource tests**: Convert to dual testing pattern
3. **resolveAllResourceValues tests**: Convert to dual testing pattern
4. **caching behavior tests**: Convert to dual testing pattern
5. **error handling tests**: Convert to dual testing pattern

#### Step 3: Add Equivalence Tests
1. **Resource equivalence**: Compare `getBuiltResource` results
2. **Collection equivalence**: Compare `conditions`, `conditionSets`, `decisions` sizes
3. **Cache equivalence**: Compare cache sizes and behavior
4. **Property equivalence**: Verify all IResourceManager properties match

#### Step 4: Edge Case Testing
1. **Empty resource manager**: Test with no resources
2. **Single resource**: Test with minimal setup
3. **Complex scenarios**: Test with multiple resources and complex conditions
4. **Resource modifications**: Test after dynamic resource changes (if supported)

### 5. Success Criteria

#### Functional Equivalence
- All existing tests pass for both resolver types
- Both resolvers return identical results for same inputs
- Both resolvers fail with equivalent error messages for invalid inputs

#### Interface Compliance
- Both implement `IResourceManager` interface correctly
- All properties return equivalent data structures
- Method signatures and behavior are identical

#### Performance Equivalence
- Cache behavior is consistent between both types
- Cache sizes match for equivalent operations
- Resolution performance is comparable

#### Test Maintainability
- Tests remain DRY with minimal duplication
- New tests can easily be added for both resolver types
- Test failures clearly indicate which resolver type failed

### 6. Risk Mitigation

#### Potential Issues
1. **Timing differences**: Built vs compiled collections may have different initialization timing
2. **Reference equality**: Objects may not be `===` equal but should be functionally equivalent
3. **Error message differences**: Different code paths might generate slightly different error text
4. **Cache timing**: Different internal implementations might affect cache behavior

#### Mitigation Strategies
1. Use functional equality checks rather than reference equality
2. Use pattern matching for error messages rather than exact string matching
3. Focus on behavior equivalence rather than implementation details
4. Add tolerance for minor performance differences

### 7. Future Considerations

#### Extensibility
- Pattern can be extended to test other `IResourceManager` implementations
- Helper functions can be reused for integration tests
- Framework supports testing performance characteristics

#### Maintenance
- Changes to `ResourceManagerBuilder` will automatically test `CompiledResourceCollection` equivalence
- Regression testing becomes automatic
- New features require testing in both contexts

## Implementation Verification

After each step, verify:
1. All existing tests still pass
2. New tests pass for both resolver types
3. Test output clearly shows which resolver type is being tested
4. Test execution time remains reasonable
5. Test coverage remains at 100%

This plan ensures comprehensive testing of the equivalence between `ResourceManagerBuilder` and `CompiledResourceCollection` while maintaining code quality and test maintainability.