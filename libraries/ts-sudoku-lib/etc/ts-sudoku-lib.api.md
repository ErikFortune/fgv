## API Report File for "@fgv/ts-sudoku-lib"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { Brand } from '@fgv/ts-utils';
import { Converter } from '@fgv/ts-utils';
import { Result } from '@fgv/ts-utils';

// @public
export const allPuzzleTypes: PuzzleType[];

// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@fgv/ts-sudoku-lib" does not have an export "PuzzleDescription"
//
// @internal
class AnyPuzzle {
    // (undocumented)
    static create(puzzle: IPuzzleDescription): Result<Puzzle>;
}

// Warning: (ae-internal-missing-underscore) The name "Cage" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export class Cage implements ICage {
    // (undocumented)
    readonly cageType: CageType;
    // (undocumented)
    get cellIds(): CellId[];
    // (undocumented)
    protected readonly _cellIds: CellId[];
    // (undocumented)
    containedValues(state: PuzzleState): Set<number>;
    // (undocumented)
    containsCell(id: CellId): boolean;
    // (undocumented)
    containsValue(value: number, state: PuzzleState, ignore?: CellId[]): boolean;
    // (undocumented)
    static create(id: CageId, type: CageType, total: number, cells: CellId[]): Result<Cage>;
    // (undocumented)
    readonly id: CageId;
    // (undocumented)
    get numCells(): number;
    // (undocumented)
    toString(state?: PuzzleState): string;
    // (undocumented)
    readonly total: number;
}

// @public
export type CageId = Brand<string, 'CageId'>;

// @public
const cageId: Converter<CageId>;

// @public
export type CageType = 'row' | 'column' | 'section' | 'x' | 'killer';

// Warning: (ae-internal-missing-underscore) The name "Cell" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export class Cell implements ICellInit, ICell {
    constructor(init: ICellInit, cages: readonly Cage[]);
    // (undocumented)
    readonly cages: readonly Cage[];
    // (undocumented)
    readonly col: number;
    // (undocumented)
    hasValue(state: PuzzleState): boolean;
    // (undocumented)
    readonly id: CellId;
    // (undocumented)
    readonly immutable: boolean;
    // (undocumented)
    readonly immutableValue?: number;
    // (undocumented)
    isValid(state: PuzzleState): boolean;
    // (undocumented)
    isValidValue(value: number | undefined, state: PuzzleState): boolean;
    // (undocumented)
    readonly row: number;
    // (undocumented)
    toString(state?: PuzzleState): string;
    // (undocumented)
    update(value: number | undefined, notes: number[]): Result<ICellState>;
    // (undocumented)
    updateNotes(notes: number[], state: PuzzleState): Result<ICellState>;
    // (undocumented)
    updateValue(value: number | undefined, state: PuzzleState): Result<ICellState>;
}

// @public
export type CellId = Brand<string, 'CellId'>;

// @public
const cellId: Converter<CellId>;

declare namespace Converters {
    export {
        cageId,
        cellId,
        puzzleType,
        puzzleDescription
    }
}
export { Converters }

declare namespace Converters_2 {
    export {
        loadJsonPuzzlesFileSync,
        puzzlesFile
    }
}

declare namespace File_2 {
    export {
        Converters_2 as Converters,
        Model
    }
}
export { File_2 as File }

// @public
export interface ICage {
    readonly cageType: CageType;
    readonly cellIds: CellId[];
    containsCell(id: CellId): boolean;
    readonly id: CageId;
    readonly numCells: number;
    readonly total: number;
}

// @public
export interface ICell {
    readonly cages: readonly ICage[];
    readonly col: number;
    readonly id: CellId;
    readonly immutable: boolean;
    readonly immutableValue?: number;
    readonly row: number;
}

// @public
export interface ICellContents {
    readonly notes: number[];
    readonly value?: number;
}

// Warning: (ae-internal-missing-underscore) The name "ICellInit" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export interface ICellInit {
    // (undocumented)
    readonly col: number;
    // (undocumented)
    readonly id: CellId;
    // (undocumented)
    readonly immutableValue?: number;
    // (undocumented)
    readonly row: number;
}

// @public
export interface ICellState extends ICellContents {
    // (undocumented)
    readonly id: CellId;
}

// Warning: (ae-internal-missing-underscore) The name "ICellUpdate" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export interface ICellUpdate {
    // (undocumented)
    from: ICellState;
    // (undocumented)
    to: ICellState;
}

// @public (undocumented)
export class Ids {
    // (undocumented)
    static cageId(from: string | ICage): Result<CageId>;
    // (undocumented)
    static cellId(spec: string | IRowColumn | ICell): Result<CellId>;
    // (undocumented)
    static cellIds(firstRow: number, numRows: number, firstCol: number, numCols: number): Result<CellId[]>;
    // (undocumented)
    static columnCageId(col: number): CageId;
    // (undocumented)
    static rowCageId(row: number): CageId;
    // (undocumented)
    static sectionCageId(row: number, col: number): CageId;
}

// @public
export interface IPuzzleDescription {
    // (undocumented)
    cells: string;
    // (undocumented)
    cols: number;
    // (undocumented)
    description: string;
    // (undocumented)
    id?: string;
    // (undocumented)
    level: number;
    // (undocumented)
    rows: number;
    // (undocumented)
    type: PuzzleType;
}

// @public
interface IPuzzlesFile {
    // (undocumented)
    puzzles: IPuzzleDescription[];
}

// Warning: (ae-internal-missing-underscore) The name "IPuzzleUpdate" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export interface IPuzzleUpdate {
    // (undocumented)
    cells: ICellUpdate[];
    // (undocumented)
    from: PuzzleState;
    // (undocumented)
    to: PuzzleState;
}

// @public
export interface IRowColumn {
    // (undocumented)
    col: number;
    // (undocumented)
    row: number;
}

// Warning: (ae-incompatible-release-tags) The symbol "KillerSudokuPuzzle" is marked as @public, but its signature references "Puzzle" which is marked as @internal
// Warning: (ae-incompatible-release-tags) The symbol "KillerSudokuPuzzle" is marked as @public, but its signature references "Puzzle" which is marked as @internal
//
// @public (undocumented)
class KillerSudokuPuzzle extends Puzzle {
    // (undocumented)
    static create(desc: IPuzzleDescription): Result<Puzzle>;
}

// Warning: (ae-unresolved-link) The @link reference could not be resolved: This type of declaration is not supported yet by the resolver
//
// @public
function loadJsonPuzzlesFileSync(path: string): Result<IPuzzlesFile>;

declare namespace Model {
    export {
        IPuzzlesFile
    }
}

// @public
export type NavigationDirection = 'down' | 'left' | 'right' | 'up';

// @public
export type NavigationWrap = 'none' | 'wrap-around' | 'wrap-next';

// Warning: (ae-internal-missing-underscore) The name "Puzzle" should be prefixed with an underscore because the declaration is marked as @internal
//
// @internal (undocumented)
export class Puzzle {
    protected constructor(puzzle: IPuzzleDescription, extraCages?: [CageId, Cage][]);
    // (undocumented)
    get cages(): Cage[];
    // (undocumented)
    protected readonly _cages: Map<CageId, Cage>;
    // (undocumented)
    get cells(): Cell[];
    // (undocumented)
    protected readonly _cells: Map<CellId, Cell>;
    // (undocumented)
    checkIsSolved(state: PuzzleState): boolean;
    // (undocumented)
    checkIsValid(state: PuzzleState): boolean;
    // (undocumented)
    get cols(): Cage[];
    // (undocumented)
    protected readonly _columns: Map<CageId, Cage>;
    // (undocumented)
    protected static _createColumnCages(numRows: number, numCols: number): Result<[CageId, Cage][]>;
    // (undocumented)
    protected static _createRowCages(numRows: number, numCols: number): Result<[CageId, Cage][]>;
    // (undocumented)
    readonly description: string;
    // (undocumented)
    getCage(id: CageId): Result<Cage>;
    // (undocumented)
    getCell(spec: string | IRowColumn | ICell): Result<Cell>;
    // (undocumented)
    getCellContents(spec: string | IRowColumn, state: PuzzleState): Result<{
        cell: Cell;
        contents: ICellContents;
    }>;
    // (undocumented)
    getCellNeighbor(spec: string | IRowColumn | ICell, direction: NavigationDirection, wrap: NavigationWrap): Result<ICell>;
    // (undocumented)
    getColumn(col: CageId | number): Result<Cage>;
    // (undocumented)
    getEmptyCells(state: PuzzleState): Cell[];
    // (undocumented)
    getInvalidCells(state: PuzzleState): Cell[];
    // (undocumented)
    getRow(row: CageId | number): Result<Cage>;
    // (undocumented)
    getSection(spec: CageId | IRowColumn): Result<Cage>;
    // (undocumented)
    readonly id?: string;
    // (undocumented)
    readonly initialState: PuzzleState;
    // (undocumented)
    get numColumns(): number;
    // (undocumented)
    get numRows(): number;
    // (undocumented)
    get rows(): Cage[];
    // (undocumented)
    protected readonly _rows: Map<CageId, Cage>;
    // (undocumented)
    get sections(): Cage[];
    // (undocumented)
    protected readonly _sections: Map<CageId, Cage>;
    // (undocumented)
    toString(state: PuzzleState): string;
    // (undocumented)
    toStrings(state: PuzzleState): string[];
    // (undocumented)
    updateCellNotes(want: string | IRowColumn, notes: number[], state: PuzzleState): Result<IPuzzleUpdate>;
    // (undocumented)
    updateCellValue(want: string | IRowColumn, value: number | undefined, state: PuzzleState): Result<IPuzzleUpdate>;
    // (undocumented)
    updateContents(wantUpdates: ICellState[] | ICellState, state: PuzzleState): Result<IPuzzleUpdate>;
    // (undocumented)
    updateNotes(wantUpdates: ICellState[] | ICellState, state: PuzzleState): Result<IPuzzleUpdate>;
    // (undocumented)
    updateValues(wantUpdates: ICellState[] | ICellState, state: PuzzleState): Result<IPuzzleUpdate>;
}

// @public
export class PuzzleCollection {
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: This type of declaration is not supported yet by the resolver
    // Warning: (ae-unresolved-link) The @link reference could not be resolved: This type of declaration is not supported yet by the resolver
    static create(from: File_2.Model.IPuzzlesFile): Result<PuzzleCollection>;
    getDescription(id: string): Result<IPuzzleDescription>;
    getPuzzle(id: string): Result<PuzzleSession>;
    static load(path: string): Result<PuzzleCollection>;
    readonly puzzles: readonly IPuzzleDescription[];
}

// @public
export class PuzzleCollections {
    static get default(): PuzzleCollection;
}

// @public
const puzzleDescription: Converter<IPuzzleDescription>;

declare namespace Puzzles {
    export {
        AnyPuzzle as Any,
        KillerSudokuPuzzle as Killer,
        SudokuPuzzle as Sudoku,
        SudokuXPuzzle as SudokuX
    }
}
export { Puzzles }

// @public
export class PuzzleSession {
    // @internal
    protected constructor(puzzle: Puzzle);
    cageContainedValues(spec: string | ICage): Set<number>;
    cageContainsValue(spec: string | ICage, value: number): boolean;
    get cages(): ICage[];
    get canRedo(): boolean;
    get canUndo(): boolean;
    cellHasValue(spec: string | IRowColumn | ICell): boolean;
    cellIsValid(spec: string | IRowColumn | ICell): boolean;
    get cells(): ICell[];
    checkIsSolved(): boolean;
    checkIsValid(): boolean;
    get cols(): ICage[];
    // Warning: (ae-incompatible-release-tags) The symbol "create" is marked as @public, but its signature references "Puzzle" which is marked as @internal
    static create(puzzle: Puzzle): Result<PuzzleSession>;
    get description(): string;
    getCellContents(spec: string | IRowColumn): Result<{
        cell: ICell;
        contents: ICellContents;
    }>;
    getCellNeighbor(spec: string | IRowColumn | ICell, direction: NavigationDirection, wrap: NavigationWrap): Result<ICell>;
    getEmptyCells(): ICell[];
    getInvalidCells(): ICell[];
    get id(): string | undefined;
    isValidForCell(spec: string | IRowColumn | ICell, value: number): boolean;
    get nextStep(): number;
    // (undocumented)
    protected _nextStep: number;
    get numColumns(): number;
    get numRows(): number;
    get numSteps(): number;
    // (undocumented)
    protected _numSteps: number;
    // Warning: (ae-incompatible-release-tags) The symbol "_puzzle" is marked as @public, but its signature references "Puzzle" which is marked as @internal
    //
    // (undocumented)
    protected readonly _puzzle: Puzzle;
    redo(): Result<this>;
    get rows(): ICage[];
    get sections(): ICage[];
    state: PuzzleState;
    // Warning: (ae-forgotten-export) The symbol "IPuzzleStep" needs to be exported by the entry point index.d.ts
    //
    // (undocumented)
    protected _steps: IPuzzleStep[];
    toStrings(): string[];
    undo(): Result<this>;
    updateCellNotes(spec: string | IRowColumn | ICell, notes: number[]): Result<this>;
    updateCells(updates: ICellState[]): Result<this>;
    updateCellValue(spec: string | IRowColumn | ICell, value: number | undefined): Result<this>;
}

// Warning: (ae-unresolved-link) The @link reference could not be resolved: This type of declaration is not supported yet by the resolver
//
// @public
const puzzlesFile: Converter<IPuzzlesFile>;

// @public (undocumented)
export class PuzzleState {
    // @internal
    protected constructor(from: Map<CellId, ICellContents>, updates?: ICellState[]);
    // @internal (undocumented)
    protected readonly _cells: Map<CellId, ICellContents>;
    static create(cells: ICellState[]): Result<PuzzleState>;
    getCellContents(id: CellId): Result<ICellContents>;
    hasValue(id: CellId): boolean;
    // @internal
    protected static _toEntries(states?: ICellState[]): [CellId, ICellContents][];
    update(updates: ICellState[]): Result<PuzzleState>;
}

// @public
export type PuzzleType = 'killer-sudoku' | 'sudoku' | 'sudoku-x';

// @public
const puzzleType: Converter<PuzzleType, PuzzleType[]>;

// Warning: (ae-incompatible-release-tags) The symbol "SudokuPuzzle" is marked as @public, but its signature references "Puzzle" which is marked as @internal
// Warning: (ae-incompatible-release-tags) The symbol "SudokuPuzzle" is marked as @public, but its signature references "Puzzle" which is marked as @internal
//
// @public (undocumented)
class SudokuPuzzle extends Puzzle {
    // (undocumented)
    static create(puzzle: IPuzzleDescription): Result<Puzzle>;
}

// Warning: (ae-incompatible-release-tags) The symbol "SudokuXPuzzle" is marked as @public, but its signature references "Puzzle" which is marked as @internal
// Warning: (ae-incompatible-release-tags) The symbol "SudokuXPuzzle" is marked as @public, but its signature references "Puzzle" which is marked as @internal
//
// @public (undocumented)
class SudokuXPuzzle extends Puzzle {
    // (undocumented)
    static create(puzzle: IPuzzleDescription): Result<Puzzle>;
}

// @public
export const totalsByCageSize: readonly {
    min: number;
    max: number;
}[];

// (No @packageDocumentation comment for this package)

```
