# Design: Adding Puzzle Dimensions to IPuzzleFileData

## Executive Summary

This design adds explicit dimension fields to IPuzzleFileData to eliminate error-prone dimension inference from cell counts. The solution maintains backward compatibility while providing a clear migration path to explicit dimensions.

## Current Problems

### 1. Complex and Unreliable Inference Logic
The current `_convertToDefinition` method in `collections.ts` (lines 99-162) attempts to infer puzzle dimensions from cell count:
- Tries to match standard configurations (4x4, 6x6, 9x9, 12x12)
- For non-standard sizes, calculates square roots and guesses cage dimensions
- Falls back to 9x9 for non-square grids
- Special handling for killer sudoku with cage definitions

### 2. Error-Prone for Edge Cases
- Non-square grids (e.g., 54 cells = 6x9) incorrectly fall back to 9x9, causing validation failures
- No way to distinguish between different valid configurations with same cell count
- Killer sudoku requires parsing cells to extract grid size before '|' separator
- Cannot reliably support all intended grid sizes (4x4, 6x6, 9x9, 12x12, 16x16, 25x25)

### 3. Limited Extensibility
- Adding new grid sizes requires updating inference logic
- No way to store non-standard cage configurations explicitly
- Tight coupling between file format and inference algorithm

## Proposed Solution

### 1. Enhanced IPuzzleFileData Interface

```typescript
/**
 * Input format for puzzle data in JSON files.
 * Contains only the essential data needed to create an IPuzzleDefinition.
 * @public
 */
export interface IPuzzleFileData {
  id?: string;
  description: string;
  type: PuzzleType;
  level: number;
  cells: string;

  // NEW: Optional dimension fields for explicit configuration
  dimensions?: {
    cageWidthInCells: number;
    cageHeightInCells: number;
    boardWidthInCages: number;
    boardHeightInCages: number;
  };
}
```

### 2. Design Rationale

**Optional dimensions field:**
- **Backward compatibility**: Existing puzzle files without dimensions continue to work
- **Progressive enhancement**: New files can specify dimensions explicitly
- **Single source of truth**: When present, dimensions are authoritative (no inference needed)

**Nested object structure:**
- Groups related dimension fields logically
- Matches IPuzzleDimensions interface structure
- Clear semantic meaning (this is dimension configuration)
- Easier to extend with metadata (e.g., `dimensions?: IPuzzleDimensions & { configName?: string }`)

**Alternative considered and rejected:**
- **Required fields**: Would break all existing puzzle files
- **Separate top-level fields**: More verbose, less clear grouping
- **String-based config names**: Less flexible, requires predefined configurations

### 3. Migration Strategy

#### Phase 1: Add Support (Backward Compatible)
1. Update `IPuzzleFileData` to add optional `dimensions` field
2. Update converter to accept optional dimensions
3. Update `_convertToDefinition` to use dimensions if present, else infer
4. All existing files continue to work unchanged

#### Phase 2: Gradual Migration
1. Update default puzzles.json to include dimensions explicitly
2. Update documentation to recommend including dimensions
3. Add warnings (optional) when dimensions are inferred
4. Tools can auto-generate dimensions field from existing files

#### Phase 3: Future (Optional)
1. Consider making dimensions required in next major version
2. Provide migration tool to add dimensions to existing files

### 4. Validation Logic

```typescript
// In _convertToDefinition method
private _convertToDefinition(fileData: Files.Model.IPuzzleFileData): Result<IPuzzleDefinition> {
  let dimensions: IPuzzleDimensions;

  if (fileData.dimensions) {
    // Use explicit dimensions - validate they match cell count
    dimensions = fileData.dimensions;

    // Validate dimensions are valid
    const validation = PuzzleDefinitionFactory.validate(dimensions);
    if (validation.isFailure()) {
      return fail(`Invalid dimensions for puzzle ${fileData.id ?? 'unknown'}: ${validation.message}`);
    }

    // Validate dimensions match cell count
    const expectedCells = this._calculateExpectedCellCount(dimensions, fileData.type);
    const actualCells = this._getGridCellCount(fileData.cells, fileData.type);

    if (actualCells !== expectedCells) {
      return fail(
        `Cell count mismatch for puzzle ${fileData.id ?? 'unknown'}: ` +
        `dimensions specify ${expectedCells} cells but found ${actualCells}`
      );
    }
  } else {
    // Fall back to inference (existing logic)
    const inferResult = this._inferDimensions(fileData);
    if (inferResult.isFailure()) {
      return inferResult;
    }
    dimensions = inferResult.value;
  }

  return PuzzleDefinitionFactory.create(dimensions, {
    id: fileData.id,
    description: fileData.description,
    type: fileData.type,
    level: fileData.level,
    cells: fileData.cells
  });
}

private _calculateExpectedCellCount(dimensions: IPuzzleDimensions, type: PuzzleType): number {
  return dimensions.cageHeightInCells *
         dimensions.boardHeightInCages *
         dimensions.cageWidthInCells *
         dimensions.boardWidthInCages;
}

private _getGridCellCount(cells: string, type: PuzzleType): number {
  if (type === 'killer-sudoku') {
    const separatorIndex = cells.indexOf('|');
    return separatorIndex === -1 ? cells.length : separatorIndex;
  }
  return cells.length;
}

private _inferDimensions(fileData: Files.Model.IPuzzleFileData): Result<IPuzzleDimensions> {
  // Existing inference logic from lines 108-153
  // Extracted into separate method for clarity
}
```

### 5. Converter Updates

```typescript
// In files/converters.ts
export const puzzleDimensions: Converter<IPuzzleDimensions> = Converters.strictObject<IPuzzleDimensions>({
  cageWidthInCells: Converters.number,
  cageHeightInCells: Converters.number,
  boardWidthInCages: Converters.number,
  boardHeightInCages: Converters.number
});

export const puzzleFileData: Converter<IPuzzleFileData> = Converters.strictObject<IPuzzleFileData>(
  {
    id: Converters.string,
    description: Converters.string,
    type: CommonConverters.puzzleType,
    level: Converters.number,
    cells: Converters.oneOf([Converters.string, Converters.stringArray.map((s) => succeed(s.join('')))]),
    dimensions: puzzleDimensions  // NEW
  },
  {
    optionalFields: ['id', 'dimensions']  // Both optional
  }
);
```

### 6. Updated Puzzle File Format Examples

#### Example 1: Standard 9x9 with explicit dimensions
```json
{
  "id": "standard-9x9",
  "description": "Standard 9x9 puzzle",
  "type": "sudoku",
  "level": 1,
  "dimensions": {
    "cageWidthInCells": 3,
    "cageHeightInCells": 3,
    "boardWidthInCages": 3,
    "boardHeightInCages": 3
  },
  "cells": "...puzzle data..."
}
```

#### Example 2: 16x16 puzzle with explicit dimensions
```json
{
  "id": "large-16x16",
  "description": "16x16 Sudoku puzzle",
  "type": "sudoku",
  "level": 3,
  "dimensions": {
    "cageWidthInCells": 4,
    "cageHeightInCells": 4,
    "boardWidthInCages": 4,
    "boardHeightInCages": 4
  },
  "cells": "...256 cells..."
}
```

#### Example 3: 6x6 puzzle with rectangular cages
```json
{
  "id": "rect-6x6",
  "description": "6x6 puzzle with 3x2 cages",
  "type": "sudoku",
  "level": 2,
  "dimensions": {
    "cageWidthInCells": 3,
    "cageHeightInCells": 2,
    "boardWidthInCages": 2,
    "boardHeightInCages": 3
  },
  "cells": "...36 cells..."
}
```

#### Example 4: Backward compatible (no dimensions)
```json
{
  "id": "legacy-puzzle",
  "description": "Legacy puzzle without dimensions",
  "type": "sudoku",
  "level": 1,
  "cells": "...81 cells..."
}
```
This will continue to work, inferring 9x9 configuration from 81-cell count.

### 7. Integration with PuzzleDefinitionFactory

The PuzzleDefinitionFactory already accepts `IPuzzleDimensions` and validates them:
- `PuzzleDefinitionFactory.validate()` checks dimension validity
- `PuzzleDefinitionFactory.create()` creates full definition from dimensions
- Type-specific validators ensure cells match dimensions

The integration point is `_convertToDefinition()` which:
1. Determines dimensions (explicit or inferred)
2. Validates dimensions
3. Validates cell count matches dimensions
4. Passes to PuzzleDefinitionFactory.create()

No changes needed to PuzzleDefinitionFactory itself.

### 8. Error Handling and Validation

#### Validation Rules (Priority Order)
1. **Dimension structure validation** (if dimensions present)
   - All four dimension fields must be positive integers
   - Passes PuzzleDefinitionFactory.validate()

2. **Cell count validation**
   - If dimensions specified: actual cells must match expected cell count
   - If dimensions inferred: inference must succeed

3. **Type-specific validation**
   - Cells format matches puzzle type requirements
   - Handled by existing PuzzleDefinitionFactory validators

#### Error Messages
```typescript
// Dimension validation failures
"Invalid dimensions for puzzle 'puzzle-id': Cage dimensions must be at least 2x2 for valid Sudoku puzzles"

// Cell count mismatch
"Cell count mismatch for puzzle 'puzzle-id': dimensions specify 81 cells but found 64"

// Inference failure
"Cannot infer dimensions for puzzle 'puzzle-id': cell count 54 does not match any standard configuration"

// Type validation failure
"Expected 81 cells, got 54" // From PuzzleDefinitionFactory
```

### 9. Testing Strategy

#### Unit Tests Required

**1. Converter Tests (files/converters.test.ts)**
- Parse puzzle with dimensions field
- Parse puzzle without dimensions field (backward compatibility)
- Reject invalid dimension structure
- Reject invalid dimension values

**2. Collection Tests (collections.test.ts)**
- Load puzzle with explicit dimensions - success path
- Load puzzle without dimensions - inference fallback
- Reject puzzle with dimensions that don't match cell count
- Reject puzzle with invalid dimensions

**3. Edge Case Tests (collections-edge-cases.test.ts)**
- 16x16 puzzle with explicit dimensions
- 25x25 puzzle with explicit dimensions
- 6x6 puzzle with rectangular cages (3x2)
- Non-square cell count with dimensions (should fail gracefully)
- Killer sudoku with dimensions

**4. Migration Tests**
- Existing puzzles.json loads successfully
- Updated puzzles.json with dimensions loads successfully
- Mixed collection (some with, some without dimensions)

#### Integration Tests
- PuzzleSession created from puzzle with explicit dimensions
- Game play works correctly with non-standard dimensions
- UI renders correctly for all supported sizes

### 10. Documentation Updates

#### API Documentation
- Update TSDoc for `IPuzzleFileData` interface
- Add examples showing dimension usage
- Document migration path

#### User Documentation
- Puzzle file format reference
- Migration guide for existing puzzle files
- Best practices (always include dimensions for clarity)

#### Developer Documentation
- Update architecture docs explaining dimension handling
- Document inference algorithm (retained for backward compatibility)
- Note that inference is legacy path, explicit dimensions preferred

### 11. Benefits Summary

**Immediate Benefits:**
1. **Reliability**: No more inference errors for edge cases
2. **Clarity**: Puzzle files are self-documenting
3. **Validation**: Explicit dimensions enable better error messages
4. **Extensibility**: Easy to support new grid sizes

**Long-term Benefits:**
1. **Maintainability**: Simpler code (less inference logic)
2. **Performance**: Skip inference overhead when dimensions present
3. **Future-proof**: Foundation for advanced features (non-rectangular grids, custom cage patterns)
4. **Migration path**: Clear path to eventually require dimensions

**Backward Compatibility:**
1. All existing puzzle files continue to work
2. Gradual migration at user's pace
3. No breaking changes to API
4. Tools can auto-migrate files

### 12. Implementation Plan

#### Step 1: Core Implementation
1. Update `IPuzzleFileData` interface
2. Update converter with optional dimensions field
3. Refactor `_convertToDefinition` to use explicit dimensions when present
4. Extract existing inference logic to `_inferDimensions` method
5. Add helper methods for validation

#### Step 2: Testing
1. Add converter tests for new field
2. Add collection tests for dimension handling
3. Add edge case tests for various grid sizes
4. Update existing tests as needed

#### Step 3: Migration
1. Update default puzzles.json with explicit dimensions
2. Add migration utility (optional tool to update files)
3. Update documentation

#### Step 4: Validation
1. Run full test suite
2. Test with existing puzzle files
3. Test with new dimension configurations
4. Performance validation

### 13. Risk Assessment

**Low Risk:**
- Backward compatibility maintained
- Optional field reduces breaking change risk
- Existing inference logic retained as fallback
- Incremental migration possible

**Potential Issues:**
1. **User confusion**: Some files have dimensions, some don't
   - Mitigation: Clear documentation, consider warnings for inferred dimensions

2. **Validation complexity**: Need to validate both dimension values and cell count match
   - Mitigation: Comprehensive tests, clear error messages

3. **File size increase**: Dimension object adds ~100 bytes per puzzle
   - Mitigation: Negligible for typical puzzle collections

### 14. Future Enhancements

Once dimensions are established, future enhancements become easier:

1. **Named configurations**: Add optional `configName` field
   ```json
   "dimensions": {
     "configName": "standard-9x9",
     "cageWidthInCells": 3,
     ...
   }
   ```

2. **Custom cage patterns**: Support irregular cage layouts
   ```json
   "dimensions": {
     ...
     "customCagePattern": "jigsaw"
   }
   ```

3. **Dimension validation tools**: CLI tools to validate/fix puzzle files

4. **Automatic inference removal**: Eventually deprecate inference in favor of required dimensions

## Conclusion

Adding optional explicit dimensions to IPuzzleFileData provides immediate value (reliability, clarity) while maintaining full backward compatibility. The design provides a clear migration path and foundation for future enhancements, with minimal risk and implementation complexity.

The key insight is making dimensions **optional** initially, which allows:
- Existing files to continue working unchanged
- New files to be explicit and self-documenting
- Gradual, non-breaking migration
- Future path to required dimensions if desired

Implementation is straightforward, localized to a few files, and well-tested through the existing validation infrastructure.
