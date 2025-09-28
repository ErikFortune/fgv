# Sudoku X Feature Implementation Requirements

## Task Overview
**Objective**: Implement complete Sudoku X support in the Sudoku application, enabling puzzles with diagonal constraints.

**Type**: Feature Implementation
**Complexity**: Complex (Multi-layer architecture changes)
**Priority**: High

## Current State Analysis

### Core Library (`@fgv/ts-sudoku-lib`)
**Status**: Foundation exists but has critical bugs

**Existing Infrastructure**:
- ✅ `SudokuXPuzzle` class exists in `/packlets/puzzles/sudokuXPuzzle.ts`
- ✅ `sudoku-x` type defined in common types
- ✅ Diagonal cage creation logic implemented (`_getXCages`)
- ✅ Factory registration in `AnyPuzzle.create()`
- ❌ **Critical Bug**: Missing `fail` import in `sudokuXPuzzle.ts` line 25
- ❌ **Critical Bug**: Type error on line 39 prevents compilation

**Diagonal Constraint Logic**:
- X1 diagonal: top-left to bottom-right (cells 0,0 → 8,8)
- X2 diagonal: top-right to bottom-left (cells 0,8 → 8,0)
- Both diagonals treated as cages with sum=45 constraint
- Cage type `'x'` defined in `CageType` union

### UI Library (`@fgv/ts-sudoku-ui`)
**Status**: No Sudoku X support, hardcoded to standard Sudoku

**Critical Issues**:
- `usePuzzleSession.ts` line 83: Hardcoded `Puzzles.Sudoku.create()` call
- No diagonal visualization components
- No UI indication of diagonal constraints
- Validation logic doesn't handle diagonal errors

### Application Layer
**Status**: Sample data ready, awaiting library support

**Ready Components**:
- Sample Sudoku X puzzle data in `PuzzlePage.tsx`
- Game type routing configured for `'sudoku-x'`
- User expects visual diagonal indicators

## Detailed Requirements

### Functional Requirements

#### FR1: Core Sudoku X Puzzle Support
- **Requirement**: Standard Sudoku rules PLUS diagonal constraints
- **Specification**: Both main diagonals must contain digits 1-9 exactly once
- **Validation**: All cells on diagonals checked for uniqueness constraint

#### FR2: Visual Diagonal Indication
- **Requirement**: Clear visual indication of diagonal constraints
- **Options**:
  - Diagonal lines overlaid on grid
  - Subtle background shading on diagonal cells
  - Border highlighting for diagonal cells
- **Accessibility**: Visual indicators must be distinguishable for colorblind users

#### FR3: Puzzle Type Integration
- **Requirement**: Seamless support for `type: 'sudoku-x'` throughout stack
- **Factory Pattern**: Use `Puzzles.Any.create()` for type-based puzzle creation
- **Error Handling**: Proper error messages for unsupported operations

#### FR4: Constraint Validation
- **Requirement**: Real-time validation of diagonal constraints
- **User Feedback**: Visual error indicators for diagonal conflicts
- **Performance**: Validation must be efficient for real-time updates

### Technical Requirements

#### TR1: Core Library Fixes
- **Import Fix**: Add `fail` import to `sudokuXPuzzle.ts`
- **Type Safety**: Ensure all Result pattern usage is correct
- **Cage Integration**: Verify diagonal cages integrate with existing constraint system

#### TR2: UI Library Updates
- **Factory Usage**: Replace hardcoded `Puzzles.Sudoku.create()` with `Puzzles.Any.create()`
- **Diagonal Rendering**: Add diagonal line/highlight components to `SudokuGrid`
- **Validation Display**: Extend validation error system for diagonal conflicts

#### TR3: Type System Consistency
- **Interface Alignment**: Ensure `IPuzzleDescription` types match between libraries
- **Export Consistency**: Maintain type exports and factory pattern usage
- **Error Propagation**: Proper Result pattern usage throughout call stack

### Exit Criteria

#### Functional Exit Criteria (Blocking)
1. **Sudoku X puzzles load without errors** - No "unsupported type" messages
2. **Diagonal constraints enforced** - Placing duplicate digits on diagonals shows validation errors
3. **Visual diagonal indicators present** - Users can clearly see diagonal constraint areas
4. **Standard Sudoku rules maintained** - Row, column, section constraints still work
5. **Multi-select works on diagonal cells** - Users can select and modify diagonal cells

#### Technical Exit Criteria (Blocking)
6. **Factory pattern implemented** - UI uses `Puzzles.Any.create()` for all puzzle types
7. **Core library compiles** - No TypeScript errors in `sudokuXPuzzle.ts`
8. **Type safety maintained** - All Result pattern usage follows codebase standards

#### User Acceptance Criteria
9. **Sample puzzle renders correctly** - Sudoku X example loads and displays properly
10. **Diagonal conflicts detected** - Users receive immediate feedback for diagonal violations
11. **Export functionality works** - Sudoku X puzzles can be exported with correct type

#### Validation Criteria
12. **Unit test coverage maintained** - 100% coverage for all new/modified components
13. **Integration testing passes** - End-to-end puzzle loading and solving works
14. **Performance acceptable** - No significant slowdown in validation or rendering

## Implementation Scope

### In-Scope
- Fix critical bugs in core library
- Implement diagonal visualization
- Update factory usage in UI library
- Comprehensive test coverage
- Integration with existing UI components

### Out-of-Scope
- New puzzle types beyond Sudoku X
- UI redesign or layout changes
- Advanced diagonal constraint variations
- Performance optimization beyond basic requirements

## Success Metrics
- **Primary**: Sudoku X puzzles load and function correctly
- **Secondary**: Visual clarity of diagonal constraints
- **Technical**: Zero compilation errors, 100% test coverage
- **User Experience**: Intuitive diagonal constraint understanding

## Risk Assessment

### High Risk
- **Type System Conflicts**: Interfaces between libraries may need alignment
- **Validation Performance**: Diagonal checking could impact real-time validation

### Medium Risk
- **Visual Design**: Diagonal indicators might interfere with existing UI
- **Multi-select Compatibility**: Diagonal cells need proper interaction support

### Low Risk
- **Core Logic**: Diagonal cage system appears well-designed
- **Factory Pattern**: Well-established pattern in codebase

## Dependencies
- Core library fixes must complete before UI updates
- Diagonal visualization needs design decisions
- Testing depends on working end-to-end integration

## Acceptance Process
All exit criteria must be validated through:
1. **Automated Testing**: Unit and integration tests pass
2. **Manual Validation**: Sample puzzle loads and functions correctly
3. **User Verification**: Diagonal constraints are visually clear and functionally correct