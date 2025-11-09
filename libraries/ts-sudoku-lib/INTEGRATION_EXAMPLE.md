# PuzzleSessionHints Integration Example

This document demonstrates how to use the integrated hint system with PuzzleSession.

## Basic Usage

```typescript
import { PuzzleSessionHints, Puzzles, IPuzzleDescription, PuzzleType } from '@fgv/ts-sudoku-lib';

// Create a puzzle
const puzzleDescription: IPuzzleDescription = {
  id: 'example',
  description: 'Example puzzle',
  type: 'sudoku' as PuzzleType,
  level: 1,
  rows: 9,
  cols: 9,
  cells: [
    // Your puzzle data as a string of 81 characters
    '5.......1.7.....3...1...5..7.......6.2.....8.6.......4..9...2...8.....7.3.......9'
  ].join('')
};

const puzzle = Puzzles.Any.create(puzzleDescription).orThrow();
const hintsSession = PuzzleSessionHints.create(puzzle).orThrow();
```

## Using Hints

```typescript
// Check if hints are available
const hasHints = hintsSession.hasHints().orThrow();
console.log(`Hints available: ${hasHints}`);

// Get all available hints
const allHints = hintsSession.getAllHints().orThrow();
console.log(`Found ${allHints.length} hints`);

// Get the best hint
if (allHints.length > 0) {
  const bestHint = hintsSession.getHint().orThrow();
  console.log(`Best hint: ${bestHint.techniqueName}`);

  // Get explanation
  const explanation = hintsSession.getExplanation(bestHint);
  console.log(`Explanation: ${explanation}`);

  // Apply the hint
  hintsSession.applyHint(bestHint).orThrow();
  console.log('Hint applied successfully');
}

// Get hints for a specific cell
const cellHints = hintsSession.getHintsForCell('A1').orThrow();
console.log(`Hints affecting cell A1: ${cellHints.length}`);
```

## State Management

```typescript
// The session maintains state synchronization
console.log(`Can undo: ${hintsSession.canUndo}`);
console.log(`Can redo: ${hintsSession.canRedo}`);

// All normal PuzzleSession operations work
hintsSession.updateCellValue('B2', 5);
hintsSession.undo();
hintsSession.redo();

// Check if puzzle is solved
if (hintsSession.checkIsSolved()) {
  console.log('Puzzle solved!');
}
```

## Configuration

```typescript
// Create with custom configuration
const config = {
  enableNakedSingles: true,
  enableHiddenSingles: false,
  defaultExplanationLevel: 'brief' as const,
  cacheTimeoutMs: 3000
};

const customHintsSession = PuzzleSessionHints.create(puzzle, config).orThrow();
```

## System Information

```typescript
// Get system capabilities
const summary = hintsSession.getSystemSummary();
console.log(summary);

// Get statistics about available hints
const stats = hintsSession.getHintStatistics().orThrow();
console.log(`Total hints: ${stats.totalHints}`);
console.log(`Techniques available: ${Array.from(stats.hintsByTechnique.keys()).join(', ')}`);
console.log(`Difficulties: ${Array.from(stats.hintsByDifficulty.keys()).join(', ')}`);
```

## Error Handling

```typescript
// Always use Result pattern for error handling
const hintResult = hintsSession.getHint();
if (hintResult.isSuccess()) {
  const hint = hintResult.value;
  // Use the hint
} else {
  console.error(`No hints available: ${hintResult.message}`);
}

// Or use Result chaining
hintsSession.getAllHints()
  .onSuccess(hints => {
    if (hints.length > 0) {
      return hintsSession.applyHint(hints[0]);
    }
    return fail('No hints to apply');
  })
  .onSuccess(() => {
    console.log('Hint applied successfully');
  })
  .onFailure(error => {
    console.error(`Failed to apply hint: ${error}`);
  });
```

## Features

### Transparent Integration
- All existing PuzzleSession methods are available
- State synchronization is automatic
- Undo/redo works with hint applications

### Caching
- Hints are cached for performance
- Cache is automatically invalidated when state changes
- Configurable cache timeout

### Educational Framework
- Multiple explanation levels (brief, detailed, educational)
- Rich hint descriptions with steps and tips
- Technique-specific explanations

### Extensible Architecture
- Support for multiple solving techniques
- Easy to add new hint providers
- Configurable technique enablement

## Available Techniques

Currently supported:
- **Naked Singles**: Cells with only one possible value
- **Hidden Singles**: Values that can only go in one cell within a constraint group

More techniques can be added through the extensible provider system.