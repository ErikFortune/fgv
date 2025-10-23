/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { CellId, parseCellId } from '@fgv/ts-sudoku-lib';

/**
 * Represents the neighbor analysis for a cell in 8 directions
 */
export interface INeighborAnalysis {
  // Cardinal directions
  north: boolean;
  east: boolean;
  south: boolean;
  west: boolean;
  // Diagonal directions
  northEast: boolean;
  southEast: boolean;
  southWest: boolean;
  northWest: boolean;
}

/**
 * Represents edge pattern requirements
 */
export interface IEdgePattern {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

/**
 * Represents corner pattern requirements
 */
export interface ICornerPattern {
  topRight: boolean;
  bottomRight: boolean;
  bottomLeft: boolean;
  topLeft: boolean;
}

/**
 * Complete pattern specification for a cell
 */
export interface ICellPattern {
  edges: IEdgePattern;
  corners: ICornerPattern;
  edgeId: number;
  cornerId: number;
}

/**
 * Direction vectors for 8-directional neighbor analysis
 */
const NEIGHBOR_DIRECTIONS = [
  { dx: 0, dy: -1, name: 'north' }, // N
  { dx: 1, dy: -1, name: 'northEast' }, // NE
  { dx: 1, dy: 0, name: 'east' }, // E
  { dx: 1, dy: 1, name: 'southEast' }, // SE
  { dx: 0, dy: 1, name: 'south' }, // S
  { dx: -1, dy: 1, name: 'southWest' }, // SW
  { dx: -1, dy: 0, name: 'west' }, // W
  { dx: -1, dy: -1, name: 'northWest' } // NW
] as const;

/**
 * Manages cage border patterns using compositional approach
 * Analyzes 8-directional neighbors and generates appropriate border patterns
 */
export class CagePatternManager {
  /**
   * Convert CellId to grid position
   */
  private _getCellPosition(cellId: CellId): { row: number; col: number } {
    const parsed = parseCellId(cellId);
    if (parsed) {
      return parsed;
    }

    console.warn(`Invalid CellId format: ${cellId}`);
    return { row: 0, col: 0 };
  }

  /**
   * Analyze neighbors in 8 directions to determine which cells are part of the cage
   */
  public analyzeNeighbors(cellId: CellId, occupiedCells: Set<string>): INeighborAnalysis {
    const { row, col } = this._getCellPosition(cellId);
    const analysis: Partial<INeighborAnalysis> = {};

    for (const direction of NEIGHBOR_DIRECTIONS) {
      const neighborRow = row + direction.dy;
      const neighborCol = col + direction.dx;
      const neighborKey = `${neighborRow},${neighborCol}`;

      analysis[direction.name as keyof INeighborAnalysis] = occupiedCells.has(neighborKey);
    }

    return analysis as INeighborAnalysis;
  }

  /**
   * Generate edge pattern based on cardinal direction neighbors
   * Edges are drawn where there is NO neighbor (external boundary)
   */
  public generateEdgePattern(neighbors: INeighborAnalysis): IEdgePattern {
    return {
      top: !neighbors.north,
      right: !neighbors.east,
      bottom: !neighbors.south,
      left: !neighbors.west
    };
  }

  /**
   * Generate corner pattern based on diagonal neighbors and adjacent edges
   * Corners are drawn where diagonal neighbor is missing AND both adjacent edges exist
   */
  public generateCornerPattern(neighbors: INeighborAnalysis, edges: IEdgePattern): ICornerPattern {
    return {
      // Top-right corner: draw if NE neighbor is missing AND both top and right edges exist
      topRight: !neighbors.northEast && edges.top && edges.right,

      // Bottom-right corner: draw if SE neighbor is missing AND both bottom and right edges exist
      bottomRight: !neighbors.southEast && edges.bottom && edges.right,

      // Bottom-left corner: draw if SW neighbor is missing AND both bottom and left edges exist
      bottomLeft: !neighbors.southWest && edges.bottom && edges.left,

      // Top-left corner: draw if NW neighbor is missing AND both top and left edges exist
      topLeft: !neighbors.northWest && edges.top && edges.left
    };
  }

  /**
   * Convert edge pattern to numeric ID (0-15)
   */
  public getEdgeId(edges: IEdgePattern): number {
    // should be bitwise or but that makes eslint cranky
    return (edges.top ? 1 : 0) + (edges.right ? 2 : 0) + (edges.bottom ? 4 : 0) + (edges.left ? 8 : 0);
  }

  /**
   * Convert corner pattern to numeric ID (0-15)
   */
  public getCornerId(corners: ICornerPattern): number {
    // should be bitwise or but that makes eslint cranky
    return (
      (corners.topRight ? 1 : 0) +
      (corners.bottomRight ? 2 : 0) +
      (corners.bottomLeft ? 4 : 0) +
      (corners.topLeft ? 8 : 0)
    );
  }

  /**
   * Generate complete pattern specification for a cell
   */
  public getPatternForCell(cellId: CellId, occupiedCells: Set<string>): ICellPattern {
    const neighbors = this.analyzeNeighbors(cellId, occupiedCells);
    const edges = this.generateEdgePattern(neighbors);
    const corners = this.generateCornerPattern(neighbors, edges);

    return {
      edges,
      corners,
      edgeId: this.getEdgeId(edges),
      cornerId: this.getCornerId(corners)
    };
  }

  /**
   * Build occupied cells set from cell IDs
   */
  public buildOccupiedCellsSet(cellIds: CellId[]): Set<string> {
    const occupiedCells = new Set<string>();

    for (const cellId of cellIds) {
      const position = this._getCellPosition(cellId);
      occupiedCells.add(`${position.row},${position.col}`);
    }

    return occupiedCells;
  }
}
