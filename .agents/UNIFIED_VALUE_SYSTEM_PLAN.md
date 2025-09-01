# Plan: Implement Unified Resource Value System

## Summary
Transform the resource system to use a shared array of JsonValues with indices, reducing duplication. Instead of each candidate directly containing a JsonValue, candidates will reference values through indices into a centralized value collection managed by a CandidateValueCollector.

## Architecture Changes

### Stage 1: Create ICandidateValue and CandidateValue (new files)
**File: `src/packlets/common/candidateValue.ts`**
- Create `ICandidateValue` interface implementing `ICollectible<CandidateValueKey, CandidateValueIndex>`
  - Properties: `key` (hash of normalized JSON), `index`, `json` (normalized JsonValue)
  - Method: `setIndex(index: number): Result<CandidateValueIndex>`
- Create `CandidateValue` class implementing `ICandidateValue`
  - Use `Hash.Crc32Normalizer` to normalize JSON values
  - Generate key from hash of normalized value
  - Store normalized JsonValue

### Stage 2: Create CandidateValueCollector (new file)
**File: `src/packlets/common/candidateValueCollector.ts`**
- Create `CandidateValueCollector` class extending appropriate collector base
  - Manages collection of `ICandidateValue` objects
  - Key-based deduplication (same normalized JSON = same value)
  - Method: `getOrAdd(json: JsonValue): Result<ICandidateValue>`
  - Method: `getAt(index: CandidateValueIndex): Result<ICandidateValue>`
  - Method: `toArray(): JsonValue[]` for compilation
- Create `ValidatingCandidateValueCollector` wrapper
  - Applies normalization before adding values
  - Computes hash key from normalized JSON

### Stage 3: Update ResourceCandidate
**File: `src/packlets/resources/resourceCandidate.ts`**
- Add `candidateValue: ICandidateValue` property
- Keep `json` getter that returns `candidateValue.json`
- Update constructor to accept `ICandidateValue` instead of raw JSON
- Update `IResourceCandidateCreateParams` to include `candidateValueCollector`

### Stage 4: Update ResourceBuilder
**File: `src/packlets/resources/resourceBuilder.ts`**
- Add `candidateValueCollector: CandidateValueCollector` to constructor params
- When adding candidates, use collector to `getOrAdd` JSON values
- Pass `ICandidateValue` to ResourceCandidate constructor
- Update `IResourceBuilderCreateParams` interface

### Stage 5: Update Resource
**File: `src/packlets/resources/resource.ts`**
- Update `toCompiled()` method to output `valueIndex` instead of `json`
- Candidates array now references indices into shared value array

### Stage 6: Update ResourceManagerBuilder
**File: `src/packlets/resources/resourceManagerBuilder.ts`**
- Add `_candidateValueCollector: CandidateValueCollector` member
- Initialize collector in constructor
- Pass collector to all ResourceBuilder instances
- Update `toCompiledResourceCollection()`:
  - Add `candidateValues: this._candidateValueCollector.toArray()`
  - Update resource compilation to use value indices

### Stage 7: Update Compilation Types
**File: `src/packlets/resource-json/compiled/json.ts`**
- Already has `valueIndex: CandidateValueIndex` in `ICompiledCandidate` ✓
- Already has `candidateValues: ReadonlyArray<JsonValue>` in `ICompiledResourceCollection` ✓

### Stage 8: Update CompiledResourceCollection
**File: `src/packlets/runtime/compiledResourceCollection.ts`**
- Already stores `_candidateValues: JsonValue[]` ✓
- Already has `_getCandidateValue(valueIndex: number)` method ✓
- Implementation appears ready for value indices ✓

### Stage 9: Update Type Exports
**File: `src/packlets/common/resources.ts`**
- Export `ICandidateValue` interface
- Export `CandidateValueKey` and related types

**File: `src/packlets/common/convert.ts`**
- Add converters for `CandidateValueKey` and `CandidateValueIndex`

**File: `src/packlets/common/validate/resources.ts`**
- Add validators for candidate values if needed

## Benefits
1. **Memory Efficiency**: Duplicate JSON values stored only once
2. **Performance**: Hash-based deduplication reduces redundant storage
3. **Consistency**: Normalized values ensure consistent comparisons
4. **Maintainability**: Centralized value management simplifies updates

## Testing Strategy
1. Unit tests for CandidateValue and CandidateValueCollector
2. Integration tests for ResourceBuilder with value collector
3. End-to-end tests for compilation and runtime loading
4. Performance tests comparing memory usage before/after

## Migration Notes
- This is a non-breaking internal change
- External APIs remain unchanged
- Compiled format already supports value indices
- Runtime already handles value arrays correctly