# Variable Grid Size Architecture Design

## Executive Summary
This document defines the comprehensive architecture for variable grid size support in the FGV Sudoku system, implementing the user's cage/board dimensional model based on their C# library experience.

## Design Principles

### Core Philosophy
- **Dimensional Flexibility**: Support any valid combination of cage and board dimensions
- **Type Safety**: Full TypeScript support with validation at compile-time and runtime
- **Clean Abstraction**: Eliminate all hardcoded grid assumptions
- **Extensibility**: Architecture supports future puzzle types and configurations
- **Performance**: Maintain or improve performance across all grid sizes

### User's Preferred Architecture
Based on proven C# implementation:
- `cageWidthInCells` / `cageHeightInCells` (section dimensions)
- `boardWidthInCages` / `boardHeightInCages` (board layout)

## Core Interfaces

### IPuzzleDimensions
```typescript
interface IPuzzleDimensions {
  readonly cageWidthInCells: number;    // Width of each section/cage (e.g., 3 for standard)
  readonly cageHeightInCells: number;   // Height of each section/cage (e.g., 3 for standard)
  readonly boardWidthInCages: number;   // Number of cages horizontally (e.g., 3 for standard)
  readonly boardHeightInCages: number;  // Number of cages vertically (e.g., 3 for standard)
}
```

### IPuzzleDefinition (Enhanced)
```typescript
interface IPuzzleDefinition extends IPuzzleDimensions {
  // Derived properties (calculated from dimensions)
  readonly totalRows: number;           // cageHeightInCells * boardHeightInCages
  readonly totalColumns: number;        // cageWidthInCells * boardWidthInCages
  readonly maxValue: number;            // cageWidthInCells * cageHeightInCells
  readonly totalCages: number;          // boardWidthInCages * boardHeightInCages

  // Existing properties
  readonly type: string;
  readonly difficulty: string;
  readonly cages?: ICage[];
  readonly immutableCells?: CellId[];
}
```

### Standard Configuration Examples
```typescript
const STANDARD_CONFIGS = {
  '4x4': { cageWidth: 2, cageHeight: 2, boardWidth: 2, boardHeight: 2 },    // Values 1-4
  '6x6': { cageWidth: 3, cageHeight: 2, boardWidth: 2, boardHeight: 3 },    // Values 1-6
  '9x9': { cageWidth: 3, cageHeight: 3, boardWidth: 3, boardHeight: 3 },    // Values 1-9
  '12x12': { cageWidth: 4, cageHeight: 3, boardWidth: 3, boardHeight: 4 },  // Values 1-12
} as const;
```

## Factory Pattern Implementation

### PuzzleDefinitionFactory
```typescript
class PuzzleDefinitionFactory {
  static create(dimensions: IPuzzleDimensions, options?: Partial<IPuzzleDefinition>): Result<IPuzzleDefinition>
  static validate(dimensions: IPuzzleDimensions): Result<true>
  static getStandardConfig(name: keyof typeof STANDARD_CONFIGS): IPuzzleDimensions
}
```

### Validation Rules
1. **Structural Validation**: All dimensions must be positive integers
2. **Size Constraints**: Reasonable limits (e.g., max 25x25 total grid)
3. **Mathematical Validity**: Ensure cage dimensions create valid Sudoku constraints
4. **Performance Limits**: Reject configurations that would cause performance issues

## Data Flow Architecture

### Layer Responsibilities

#### Core Library (ts-sudoku-lib)
- **Puzzle Definition**: Store and validate dimensional configuration
- **Section Management**: Generate cage layouts based on dimensions
- **Value Range**: Calculate valid values (1 to maxValue)
- **Validation Logic**: Check row/column/cage uniqueness for any grid size
- **Puzzle Generation**: Create valid puzzles for any configuration

#### UI Library (ts-sudoku-ui)
- **Dynamic Grid Rendering**: Generate CSS classes based on totalRows/totalColumns
- **Section Boundaries**: Calculate boundary positions using cage dimensions
- **Cell Sizing**: Adapt cell size and fonts for different grid dimensions
- **Cage Visualization**: Scale cage overlays to variable grid sizes

#### Application Layer
- **Configuration Selection**: Allow users to choose grid sizes
- **State Management**: Handle variable-sized puzzle state
- **User Preferences**: Persist grid size preferences
- **Performance Monitoring**: Track performance across different sizes

## Migration Strategy

### Dual Format Support
```typescript
// New format (preferred)
const newPuzzle: IPuzzleDefinition = {
  cageWidthInCells: 3,
  cageHeightInCells: 3,
  boardWidthInCages: 3,
  boardHeightInCages: 3,
  totalRows: 9,        // derived
  totalColumns: 9,     // derived
  maxValue: 9,         // derived
  type: 'sudoku',
  difficulty: 'medium'
};

// Automatic conversion
const converted = PuzzleDefinitionFactory.fromLegacy(legacyPuzzle);
```

### Conversion Logic
- **Default Mapping**: Legacy puzzles assumed to be 9×9 with 3×3 cages
- **Type Preservation**: Maintain existing puzzle types and difficulty levels
- **Data Integrity**: Validate converted puzzles meet new constraints
- **No Backward Compatibility**: Upgrade existing puzzles - no need to support legacy format

## Component Updates Required

### Core Library Changes
1. **Puzzle Interface**: Replace hardcoded dimensions with IPuzzleDefinition
2. **Section Logic**: Use cageWidth/Height for section boundaries
3. **Value Validation**: Use maxValue instead of hardcoded 9
4. **Cell ID System**: Extend beyond A-I, 1-9 for larger grids
5. **Generator Algorithms**: Accept dimensional parameters

### UI Library Changes
1. **SudokuGrid**: Generate dynamic CSS classes (`grid-cols-${totalColumns}`)
2. **SudokuCell**: Calculate section boundaries using cage dimensions
3. **CageOverlay**: Scale cage visualization to variable grid sizes
4. **Responsive Sizing**: Adapt cell and font sizes for different grids

### Application Changes
1. **Grid Selection**: UI for choosing puzzle dimensions
2. **State Management**: Handle variable-sized puzzle state
3. **Routing**: Support size parameters in puzzle URLs
4. **Preferences**: Store and restore user's preferred grid sizes

## Cell ID Extension

### Current System
- Limited to A-I (columns) and 1-9 (rows)
- Format: "A1", "B2", etc.

### Extended System
```typescript
// Support grids up to 26×26 (more than sufficient)
// Columns: A-Z (26 columns max)
// Rows: 1-26 (26 rows max)
// Format remains: "A1", "B2", ..., "Z26"

function generateCellId(row: number, column: number): CellId {
  const columnLetter = String.fromCharCode(65 + column); // A-Z
  const rowNumber = row + 1; // 1-based
  return `${columnLetter}${rowNumber}` as CellId;
}
```

## Performance Considerations

### Memory Usage
| Grid Size | Memory Usage | Relative to 9×9 |
|-----------|--------------|-----------------|
| 4×4 | ~16 cells | 25% |
| 6×6 | ~36 cells | 56% |
| 9×9 | ~81 cells | 100% |
| 12×12 | ~144 cells | 178% |

### Computational Complexity
- **Puzzle Generation**: O(n²) where n = totalCells
- **Validation**: O(n) for each constraint check
- **UI Rendering**: Linear scaling with cell count
- **Cage Visualization**: Constant complexity per cage

### Optimization Strategies
1. **Lazy Loading**: Generate cage layouts on demand
2. **Memoization**: Cache validation results for repeated checks
3. **Virtual Rendering**: For very large grids, render only visible cells
4. **Configuration Limits**: Reasonable maximum grid sizes

## Testing Strategy

### Unit Testing
- **Dimensional Validation**: Test all validation rules
- **Factory Methods**: Verify correct puzzle creation
- **Legacy Conversion**: Ensure accurate format migration
- **Edge Cases**: Test boundary conditions and error cases

### Integration Testing
- **Cross-Layer Compatibility**: Verify data flow from library to UI to app
- **Grid Size Matrix**: Test all standard configurations
- **Performance Benchmarks**: Measure performance across grid sizes
- **UI Responsiveness**: Verify proper rendering on all screen sizes

### Configuration Coverage
Test matrix covering all standard configurations:
- 4×4 (2×2 cages, values 1-4)
- 6×6 (3x2 cages, values 1-6)
- 9×9 (3×3 cages, values 1-9)
- 12×12 (4x3 cages, values 1-12)

## Implementation Phases

### Phase 1: Core Interfaces (1-2 weeks)
1. Create IPuzzleDimensions and IPuzzleDefinition interfaces
2. Implement PuzzleDefinitionFactory with validation
3. Add standard configuration presets
4. Create comprehensive test suite for new interfaces
5. Implement legacy format conversion

**Exit Criteria:**
- All interfaces compile without errors
- Factory methods create valid puzzle definitions
- 100% test coverage for dimensional logic
- Legacy conversion works correctly

### Phase 2: Core Logic Updates (2-3 weeks)
1. Update puzzle generation to use dimensional parameters
2. Modify validation logic for variable grid sizes
3. Implement dynamic section creation
4. Extend cell ID system for larger grids
5. Update all hardcoded 3×3 and 1-9 assumptions

**Exit Criteria:**
- Puzzle generation works for all standard configurations
- Validation correctly handles rectangular sections
- Cell ID system supports grids up to 26×26
- Performance benchmarks established

### Phase 3: UI Integration (2-3 weeks)
1. Update SudokuGrid for dynamic CSS generation
2. Modify SudokuCell for variable section boundaries
3. Adapt CageOverlay for variable grid sizes
4. Implement responsive sizing logic
5. Create grid size selection interface

**Exit Criteria:**
- All grid sizes render correctly
- Section boundaries display properly
- Cage visualization adapts to any grid size
- User can select and switch between grid sizes

### Phase 4: Legacy Deprecation (1 week)
1. Add deprecation warnings to legacy interfaces
2. Update documentation for new architecture
3. Create migration guide for external consumers
4. Performance optimization and final testing

**Exit Criteria:**
- Complete documentation coverage
- Migration path clearly defined
- Performance acceptable across all configurations
- All legacy functionality preserved

## Risk Mitigation

### Technical Risks
1. **Performance on Large Grids**: Mitigated by configuration limits and optimization
2. **UI Complexity**: Addressed through responsive design and progressive enhancement
3. **Algorithm Scalability**: Validated through mathematical analysis and benchmarking

### Implementation Risks
1. **Scope Creep**: Clear phase boundaries and exit criteria
2. **Breaking Changes**: Comprehensive testing and gradual rollout
3. **User Adoption**: Intuitive configuration interface and good defaults

## Success Criteria

### Functional Requirements
- ✅ Support all standard grid configurations (4×4, 6×4, 6×6, 9×9, 12×12)
- ✅ All existing puzzles upgraded to new structure
- ✅ Performance remains acceptable across all grid sizes
- ✅ UI adapts responsively to different grid dimensions
- ✅ Killer Sudoku cages work with variable grid sizes

### Quality Requirements
- ✅ Type-safe interfaces with comprehensive validation
- ✅ Clean architecture with no hardcoded assumptions
- ✅ Extensible design supporting future puzzle types
- ✅ Complete test coverage across all configurations
- ✅ Comprehensive documentation and migration guides

## Conclusion

This architecture design provides a comprehensive foundation for variable grid size support that:

1. **Implements the user's proven cage/board dimensional model** from their C# experience
2. **Eliminates all hardcoded grid assumptions** through clean abstraction
3. **Maintains type safety and performance** across all supported configurations
4. **Provides clear migration path** from legacy format to new architecture
5. **Enables future extensibility** for additional puzzle types and configurations

The phased implementation approach provides clear milestones and risk mitigation, while the clean slate development environment eliminates backward compatibility constraints.

**Recommendation**: Proceed with implementation following the 4-phase roadmap outlined above.