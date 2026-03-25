[Home](../README.md) > usePuzzleSession

# Function: usePuzzleSession

Hook for managing puzzle session state and operations

## Signature

```typescript
function usePuzzleSession(initialPuzzleDescription: IPuzzleDefinition): { session: PuzzleSession | null; selectedCell: CellId | null; selectedCells: CellId[]; inputMode: InputMode; setSelectedCell: (cell: CellId | null) => void; setSelectedCells: (cells: CellId[]) => void; setInputMode: (mode: InputMode) => void; cellDisplayInfo: ICellDisplayInfo[]; cageDisplayInfo: ICageDisplayInfo[]; validationErrors: IValidationError[]; isValid: boolean; isSolved: boolean; canUndo: boolean; canRedo: boolean; error: string | null; updateCellValue: (cellId: CellId, value: number | undefined) => void; toggleCellNote: (cellId: CellId, note: number) => void; clearCellNotes: (cellId: CellId) => void; navigateToCell: (direction: NavigationDirection, wrap?: NavigationWrap) => void; undo: () => void; redo: () => void; reset: () => void; exportPuzzle: () => IPuzzleDefinition | null }
```
