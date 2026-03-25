# @fgv/ts-sudoku-ui

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IDiagnosticLoggerProviderProps](./interfaces/IDiagnosticLoggerProviderProps.md)

</td><td>

Props for the DiagnosticLoggerProvider component.

</td></tr>
<tr><td>

[IValidationError](./interfaces/IValidationError.md)

</td><td>

Validation error for display in the UI

</td></tr>
<tr><td>

[ISudokuGridEntryProps](./interfaces/ISudokuGridEntryProps.md)

</td><td>

Props for the main SudokuGridEntry component

</td></tr>
<tr><td>

[ISudokuGridProps](./interfaces/ISudokuGridProps.md)

</td><td>

Props for the SudokuGrid component

</td></tr>
<tr><td>

[ICellDisplayInfo](./interfaces/ICellDisplayInfo.md)

</td><td>

Display information for a single cell

</td></tr>
<tr><td>

[ISudokuCellProps](./interfaces/ISudokuCellProps.md)

</td><td>

Props for the SudokuCell component

</td></tr>
<tr><td>

[ISudokuControlsProps](./interfaces/ISudokuControlsProps.md)

</td><td>

Props for the SudokuControls component

</td></tr>
<tr><td>

[IValidationDisplayProps](./interfaces/IValidationDisplayProps.md)

</td><td>

Props for the ValidationDisplay component

</td></tr>
<tr><td>

[ICageDisplayInfo](./interfaces/ICageDisplayInfo.md)

</td><td>

Display information for a cage in Killer Sudoku

</td></tr>
<tr><td>

[ICageOverlayProps](./interfaces/ICageOverlayProps.md)

</td><td>

Props for the CageOverlay component

</td></tr>
<tr><td>

[ICageSumIndicatorProps](./interfaces/ICageSumIndicatorProps.md)

</td><td>

Props for the CageSumIndicator component

</td></tr>
<tr><td>

[ICombinationDisplayInfo](./interfaces/ICombinationDisplayInfo.md)

</td><td>

Display information for a single combination

</td></tr>
<tr><td>

[IEliminationState](./interfaces/IEliminationState.md)

</td><td>

State management for combination elimination

</td></tr>
<tr><td>

[IKillerCombinationsExplorerProps](./interfaces/IKillerCombinationsExplorerProps.md)

</td><td>

Props for the KillerCombinationsExplorer component

</td></tr>
<tr><td>

[ICombinationCardProps](./interfaces/ICombinationCardProps.md)

</td><td>

Props for the CombinationCard component

</td></tr>
<tr><td>

[ICombinationGridProps](./interfaces/ICombinationGridProps.md)

</td><td>

Props for the CombinationGrid component

</td></tr>
<tr><td>

[ICompactControlRibbonProps](./interfaces/ICompactControlRibbonProps.md)

</td><td>

Props for the CompactControlRibbon component

</td></tr>
<tr><td>

[INumberKeypadProps](./interfaces/INumberKeypadProps.md)

</td><td>

Props for the NumberKeypad component

</td></tr>
<tr><td>

[IDualKeypadProps](./interfaces/IDualKeypadProps.md)

</td><td>

Props for the DualKeypad component

</td></tr>
<tr><td>

[IResponsiveLayoutInfo](./interfaces/IResponsiveLayoutInfo.md)

</td><td>

Responsive layout information

</td></tr>
<tr><td>

[IKeyboardShortcutOptions](./interfaces/IKeyboardShortcutOptions.md)

</td><td>

Options for keyboard shortcut configuration

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IKillerCombinationsMode](./type-aliases/IKillerCombinationsMode.md)

</td><td>

Display mode for killer combinations explorer

</td></tr>
<tr><td>

[DeviceType](./type-aliases/DeviceType.md)

</td><td>

Device type detection result

</td></tr>
<tr><td>

[ScreenOrientation](./type-aliases/ScreenOrientation.md)

</td><td>

Screen orientation

</td></tr>
<tr><td>

[KeypadLayoutMode](./type-aliases/KeypadLayoutMode.md)

</td><td>

Layout mode for dual keypad

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[useDiagnosticLogger](./functions/useDiagnosticLogger.md)

</td><td>

Hook to access the current diagnostic logger.

</td></tr>
<tr><td>

[usePuzzleSession](./functions/usePuzzleSession.md)

</td><td>

Hook for managing puzzle session state and operations

</td></tr>
<tr><td>

[useResponsiveLayout](./functions/useResponsiveLayout.md)

</td><td>

Hook to detect responsive layout information for optimal keypad display

</td></tr>
<tr><td>

[useKillerCombinations](./functions/useKillerCombinations.md)

</td><td>

Hook to get all valid killer cage combinations for a selected cage

</td></tr>
<tr><td>

[useCombinationElimination](./functions/useCombinationElimination.md)

</td><td>

Hook for managing combination elimination state with session storage persistence

</td></tr>
<tr><td>

[useKeyboardShortcut](./functions/useKeyboardShortcut.md)

</td><td>

Hook for registering global keyboard shortcuts

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[DefaultDiagnosticLogger](./variables/DefaultDiagnosticLogger.md)

</td><td>

Default diagnostic logger (no-op for production).

</td></tr>
<tr><td>

[DiagnosticLoggerContext](./variables/DiagnosticLoggerContext.md)

</td><td>

React context for diagnostic logging.

</td></tr>
<tr><td>

[DiagnosticLoggerProvider](./variables/DiagnosticLoggerProvider.md)

</td><td>

Provider component that makes diagnostic logger available to all child components.

</td></tr>
<tr><td>

[SudokuGridEntry](./variables/SudokuGridEntry.md)

</td><td>

Main container component that orchestrates puzzle entry

</td></tr>
<tr><td>

[SudokuGrid](./variables/SudokuGrid.md)

</td><td>

Grid component that renders the 9x9 Sudoku grid with proper visual structure

</td></tr>
<tr><td>

[SudokuCell](./variables/SudokuCell.md)

</td><td>

Individual Sudoku cell component with input handling and validation display

</td></tr>
<tr><td>

[SudokuControls](./variables/SudokuControls.md)

</td><td>

Control panel for grid-wide operations

</td></tr>
<tr><td>

[ValidationDisplay](./variables/ValidationDisplay.md)

</td><td>

Component to display validation errors and puzzle status

</td></tr>
<tr><td>

[CompactControlRibbon](./variables/CompactControlRibbon.md)

</td><td>

Compact control ribbon with icon-only badges for actions and status indicator

</td></tr>
<tr><td>

[DualKeypad](./variables/DualKeypad.md)

</td><td>

Dual keypad component with responsive layout for mobile and desktop sudoku input

</td></tr>
<tr><td>

[NumberKeypad](./variables/NumberKeypad.md)

</td><td>

Reusable number keypad component for sudoku input

</td></tr>
<tr><td>

[CageOverlay](./variables/CageOverlay.md)

</td><td>

Component for rendering cage boundaries and sum indicators in Killer Sudoku

</td></tr>
<tr><td>

[CageSumIndicator](./variables/CageSumIndicator.md)

</td><td>

Component for displaying the target sum of a cage in Killer Sudoku

</td></tr>
<tr><td>

[KillerCombinationsExplorer](./variables/KillerCombinationsExplorer.md)

</td><td>

Main killer combinations explorer container component

</td></tr>
<tr><td>

[KillerCombinationsPanel](./variables/KillerCombinationsPanel.md)

</td><td>

Desktop panel variant for killer combinations explorer

</td></tr>
<tr><td>

[KillerCombinationsModal](./variables/KillerCombinationsModal.md)

</td><td>

Mobile modal variant for killer combinations explorer

</td></tr>
<tr><td>

[CombinationGrid](./variables/CombinationGrid.md)

</td><td>

Grid layout component for displaying combination cards

</td></tr>
<tr><td>

[CombinationCard](./variables/CombinationCard.md)

</td><td>

Individual combination card component with toggle functionality

</td></tr>
</tbody></table>
