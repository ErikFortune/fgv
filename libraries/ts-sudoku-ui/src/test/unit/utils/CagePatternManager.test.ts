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

/* eslint-disable no-bitwise */

import { CellId } from '@fgv/ts-sudoku-lib';
import { CagePatternManager } from '../../../utils/CagePatternManager';

describe('CagePatternManager', () => {
  let manager: CagePatternManager;

  beforeEach(() => {
    manager = new CagePatternManager();
  });

  describe('buildOccupiedCellsSet', () => {
    describe('with valid cell IDs', () => {
      test('should build set from single cell', () => {
        const cellIds = ['A01' as CellId];
        const occupiedCells = manager.buildOccupiedCellsSet(cellIds);

        expect(occupiedCells.size).toBe(1);
        expect(occupiedCells.has('0,0')).toBe(true);
      });

      test('should build set from multiple cells in horizontal line', () => {
        const cellIds = ['A01' as CellId, 'B01' as CellId, 'C01' as CellId];
        const occupiedCells = manager.buildOccupiedCellsSet(cellIds);

        expect(occupiedCells.size).toBe(3);
        expect(occupiedCells.has('0,0')).toBe(true);
        expect(occupiedCells.has('1,0')).toBe(true);
        expect(occupiedCells.has('2,0')).toBe(true);
      });

      test('should build set from multiple cells in vertical line', () => {
        const cellIds = ['A01' as CellId, 'A02' as CellId, 'A03' as CellId];
        const occupiedCells = manager.buildOccupiedCellsSet(cellIds);

        expect(occupiedCells.size).toBe(3);
        expect(occupiedCells.has('0,0')).toBe(true);
        expect(occupiedCells.has('0,1')).toBe(true);
        expect(occupiedCells.has('0,2')).toBe(true);
      });

      test('should build set from L-shaped cage pattern', () => {
        const cellIds = ['A01' as CellId, 'A02' as CellId, 'B02' as CellId];
        const occupiedCells = manager.buildOccupiedCellsSet(cellIds);

        expect(occupiedCells.size).toBe(3);
        expect(occupiedCells.has('0,0')).toBe(true);
        expect(occupiedCells.has('0,1')).toBe(true);
        expect(occupiedCells.has('1,1')).toBe(true);
      });

      test('should build set from rectangular cage', () => {
        const cellIds = ['A01' as CellId, 'B01' as CellId, 'A02' as CellId, 'B02' as CellId];
        const occupiedCells = manager.buildOccupiedCellsSet(cellIds);

        expect(occupiedCells.size).toBe(4);
        expect(occupiedCells.has('0,0')).toBe(true);
        expect(occupiedCells.has('1,0')).toBe(true);
        expect(occupiedCells.has('0,1')).toBe(true);
        expect(occupiedCells.has('1,1')).toBe(true);
      });

      test('should handle duplicate cell IDs by keeping unique cells', () => {
        const cellIds = ['A01' as CellId, 'A01' as CellId, 'B01' as CellId];
        const occupiedCells = manager.buildOccupiedCellsSet(cellIds);

        expect(occupiedCells.size).toBe(2);
        expect(occupiedCells.has('0,0')).toBe(true);
        expect(occupiedCells.has('1,0')).toBe(true);
      });
    });

    describe('with empty input', () => {
      test('should return empty set for empty array', () => {
        const occupiedCells = manager.buildOccupiedCellsSet([]);

        expect(occupiedCells.size).toBe(0);
      });
    });

    describe('with complex killer sudoku cages', () => {
      test('should build set for typical 3-cell vertical cage', () => {
        const cellIds = ['A01' as CellId, 'A02' as CellId, 'A03' as CellId];
        const occupiedCells = manager.buildOccupiedCellsSet(cellIds);

        expect(occupiedCells.size).toBe(3);
        expect(occupiedCells.has('0,0')).toBe(true);
        expect(occupiedCells.has('0,1')).toBe(true);
        expect(occupiedCells.has('0,2')).toBe(true);
      });

      test('should build set for irregular 5-cell cage', () => {
        // T-shaped pattern
        const cellIds = ['B01' as CellId, 'A02' as CellId, 'B02' as CellId, 'C02' as CellId, 'B03' as CellId];
        const occupiedCells = manager.buildOccupiedCellsSet(cellIds);

        expect(occupiedCells.size).toBe(5);
        expect(occupiedCells.has('1,0')).toBe(true);
        expect(occupiedCells.has('0,1')).toBe(true);
        expect(occupiedCells.has('1,1')).toBe(true);
        expect(occupiedCells.has('2,1')).toBe(true);
        expect(occupiedCells.has('1,2')).toBe(true);
      });
    });
  });

  describe('analyzeNeighbors', () => {
    describe('single cell cage (isolated)', () => {
      test('should detect no neighbors for isolated cell', () => {
        const cellId = 'E05' as CellId;
        const occupiedCells = new Set(['4,4']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(false);
        expect(neighbors.east).toBe(false);
        expect(neighbors.south).toBe(false);
        expect(neighbors.west).toBe(false);
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(false);
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });
    });

    describe('horizontal line cages', () => {
      test('should detect east neighbor for left cell in horizontal line', () => {
        const cellId = 'A01' as CellId;
        const occupiedCells = new Set(['0,0', '0,1', '0,2']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(false);
        expect(neighbors.east).toBe(true); // Has neighbor to the right
        expect(neighbors.south).toBe(false);
        expect(neighbors.west).toBe(false);
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(false);
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });

      test('should detect both east and west neighbors for middle cell in horizontal line', () => {
        const cellId = 'A02' as CellId;
        const occupiedCells = new Set(['0,0', '0,1', '0,2']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(false);
        expect(neighbors.east).toBe(true); // Has neighbor to the right
        expect(neighbors.south).toBe(false);
        expect(neighbors.west).toBe(true); // Has neighbor to the left
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(false);
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });

      test('should detect west neighbor for right cell in horizontal line', () => {
        const cellId = 'A03' as CellId;
        const occupiedCells = new Set(['0,0', '0,1', '0,2']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(false);
        expect(neighbors.east).toBe(false);
        expect(neighbors.south).toBe(false);
        expect(neighbors.west).toBe(true); // Has neighbor to the left
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(false);
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });
    });

    describe('vertical line cages', () => {
      test('should detect south neighbor for top cell in vertical line', () => {
        // Vertical line: A01, B01, C01 (same column, different rows)
        const cellId = 'A01' as CellId;
        const occupiedCells = new Set(['0,0', '1,0', '2,0']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(false);
        expect(neighbors.east).toBe(false);
        expect(neighbors.south).toBe(true); // Has neighbor below (B01)
        expect(neighbors.west).toBe(false);
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(false);
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });

      test('should detect both north and south neighbors for middle cell in vertical line', () => {
        // Vertical line: A01, B01, C01 (same column, different rows)
        const cellId = 'B01' as CellId;
        const occupiedCells = new Set(['0,0', '1,0', '2,0']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(true); // Has neighbor above (A01)
        expect(neighbors.east).toBe(false);
        expect(neighbors.south).toBe(true); // Has neighbor below (C01)
        expect(neighbors.west).toBe(false);
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(false);
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });

      test('should detect north neighbor for bottom cell in vertical line', () => {
        // Vertical line: A01, B01, C01 (same column, different rows)
        const cellId = 'C01' as CellId;
        const occupiedCells = new Set(['0,0', '1,0', '2,0']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(true); // Has neighbor above (B01)
        expect(neighbors.east).toBe(false);
        expect(neighbors.south).toBe(false);
        expect(neighbors.west).toBe(false);
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(false);
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });
    });

    describe('2x2 square cage', () => {
      test('should detect south and east neighbors for top-left cell in square', () => {
        const cellId = 'A01' as CellId;
        const occupiedCells = new Set(['0,0', '1,0', '0,1', '1,1']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(false);
        expect(neighbors.east).toBe(true); // Has neighbor to the right
        expect(neighbors.south).toBe(true); // Has neighbor below
        expect(neighbors.west).toBe(false);
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(true); // Has diagonal neighbor
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });

      test('should detect all neighbors except northwest for bottom-right cell in square', () => {
        const cellId = 'B02' as CellId;
        const occupiedCells = new Set(['0,0', '1,0', '0,1', '1,1']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(true); // Has neighbor above
        expect(neighbors.east).toBe(false);
        expect(neighbors.south).toBe(false);
        expect(neighbors.west).toBe(true); // Has neighbor to the left
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(false);
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(true); // Has diagonal neighbor
      });
    });

    describe('L-shaped cages', () => {
      test('should correctly analyze neighbors for corner of L-shape', () => {
        // L-shape: A01 (0,0), B01 (1,0), B02 (1,1)
        const cellId = 'B01' as CellId; // Corner cell at (1,0)
        const occupiedCells = new Set(['0,0', '1,0', '1,1']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(true); // A01 is above at (0,0)
        expect(neighbors.east).toBe(true); // B02 is to the right at (1,1)
        expect(neighbors.south).toBe(false);
        expect(neighbors.west).toBe(false);
        expect(neighbors.northEast).toBe(false); // A02 not in cage
        expect(neighbors.southEast).toBe(false);
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });

      test('should correctly analyze neighbors for end of L-shape vertical arm', () => {
        // L-shape: A01 (0,0), B01 (1,0), B02 (1,1)
        const cellId = 'A01' as CellId; // Top of vertical arm at (0,0)
        const occupiedCells = new Set(['0,0', '1,0', '1,1']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(false);
        expect(neighbors.east).toBe(false); // A02 not in cage
        expect(neighbors.south).toBe(true); // B01 is below at (1,0)
        expect(neighbors.west).toBe(false);
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(true); // B02 at (1,1) is diagonal neighbor
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });

      test('should correctly analyze neighbors for end of L-shape horizontal arm', () => {
        // L-shape: A01 (0,0), B01 (1,0), B02 (1,1)
        const cellId = 'B02' as CellId; // End of horizontal arm at (1,1)
        const occupiedCells = new Set(['0,0', '1,0', '1,1']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(false); // A02 not in cage
        expect(neighbors.east).toBe(false);
        expect(neighbors.south).toBe(false);
        expect(neighbors.west).toBe(true); // B01 is to the left at (1,0)
        expect(neighbors.northEast).toBe(false);
        expect(neighbors.southEast).toBe(false);
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(true); // A01 at (0,0) is diagonal neighbor
      });
    });

    describe('T-shaped cages', () => {
      test('should correctly analyze center cell of T-shape', () => {
        // T-shape: R0C1 (top), R1C0, R1C1, R1C2 (horizontal bar), R2C1 (bottom)
        const cellId = 'B02' as CellId; // Center cell
        const occupiedCells = new Set(['1,0', '0,1', '1,1', '2,1', '1,2']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(true); // R0C1
        expect(neighbors.east).toBe(true); // R1C2
        expect(neighbors.south).toBe(true); // R2C1
        expect(neighbors.west).toBe(true); // R1C0
        expect(neighbors.northEast).toBe(false); // Not in cage
        expect(neighbors.southEast).toBe(false); // Not in cage
        expect(neighbors.southWest).toBe(false); // Not in cage
        expect(neighbors.northWest).toBe(false); // Not in cage
      });

      test('should correctly analyze edge cell of T-shape horizontal bar', () => {
        // T-shape: B01 (1,0), A02, B02, C02 (0,1),(1,1),(2,1), B03 (1,2)
        const cellId = 'B01' as CellId; // Left end of horizontal bar at (1,0)
        const occupiedCells = new Set(['1,0', '0,1', '1,1', '2,1', '1,2']);

        const neighbors = manager.analyzeNeighbors(cellId, occupiedCells);

        expect(neighbors.north).toBe(false); // A01 not in cage
        expect(neighbors.east).toBe(true); // B02 at (1,1)
        expect(neighbors.south).toBe(false); // C01 not in cage
        expect(neighbors.west).toBe(false);
        expect(neighbors.northEast).toBe(true); // A02 at (0,1) is diagonal neighbor
        expect(neighbors.southEast).toBe(true); // C02 at (2,1) is diagonal neighbor
        expect(neighbors.southWest).toBe(false);
        expect(neighbors.northWest).toBe(false);
      });
    });
  });

  describe('generateEdgePattern', () => {
    describe('isolated cells', () => {
      test('should generate all edges for isolated cell', () => {
        const neighbors = {
          north: false,
          east: false,
          south: false,
          west: false,
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };

        const edges = manager.generateEdgePattern(neighbors);

        expect(edges.top).toBe(true);
        expect(edges.right).toBe(true);
        expect(edges.bottom).toBe(true);
        expect(edges.left).toBe(true);
      });
    });

    describe('horizontal line patterns', () => {
      test('should generate top/bottom edges only for middle cell in horizontal line', () => {
        const neighbors = {
          north: false,
          east: true, // Has neighbor to the right
          south: false,
          west: true, // Has neighbor to the left
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };

        const edges = manager.generateEdgePattern(neighbors);

        expect(edges.top).toBe(true);
        expect(edges.right).toBe(false); // No edge because there's a neighbor
        expect(edges.bottom).toBe(true);
        expect(edges.left).toBe(false); // No edge because there's a neighbor
      });

      test('should generate left edge for leftmost cell in horizontal line', () => {
        const neighbors = {
          north: false,
          east: true, // Has neighbor to the right
          south: false,
          west: false, // No neighbor to the left
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };

        const edges = manager.generateEdgePattern(neighbors);

        expect(edges.top).toBe(true);
        expect(edges.right).toBe(false); // No edge because there's a neighbor
        expect(edges.bottom).toBe(true);
        expect(edges.left).toBe(true); // Edge because no neighbor
      });

      test('should generate right edge for rightmost cell in horizontal line', () => {
        const neighbors = {
          north: false,
          east: false, // No neighbor to the right
          south: false,
          west: true, // Has neighbor to the left
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };

        const edges = manager.generateEdgePattern(neighbors);

        expect(edges.top).toBe(true);
        expect(edges.right).toBe(true); // Edge because no neighbor
        expect(edges.bottom).toBe(true);
        expect(edges.left).toBe(false); // No edge because there's a neighbor
      });
    });

    describe('vertical line patterns', () => {
      test('should generate left/right edges only for middle cell in vertical line', () => {
        const neighbors = {
          north: true, // Has neighbor above
          east: false,
          south: true, // Has neighbor below
          west: false,
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };

        const edges = manager.generateEdgePattern(neighbors);

        expect(edges.top).toBe(false); // No edge because there's a neighbor
        expect(edges.right).toBe(true);
        expect(edges.bottom).toBe(false); // No edge because there's a neighbor
        expect(edges.left).toBe(true);
      });

      test('should generate top edge for topmost cell in vertical line', () => {
        const neighbors = {
          north: false, // No neighbor above
          east: false,
          south: true, // Has neighbor below
          west: false,
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };

        const edges = manager.generateEdgePattern(neighbors);

        expect(edges.top).toBe(true); // Edge because no neighbor
        expect(edges.right).toBe(true);
        expect(edges.bottom).toBe(false); // No edge because there's a neighbor
        expect(edges.left).toBe(true);
      });

      test('should generate bottom edge for bottommost cell in vertical line', () => {
        const neighbors = {
          north: true, // Has neighbor above
          east: false,
          south: false, // No neighbor below
          west: false,
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };

        const edges = manager.generateEdgePattern(neighbors);

        expect(edges.top).toBe(false); // No edge because there's a neighbor
        expect(edges.right).toBe(true);
        expect(edges.bottom).toBe(true); // Edge because no neighbor
        expect(edges.left).toBe(true);
      });
    });

    describe('square patterns', () => {
      test('should generate no edges for cell completely surrounded in square', () => {
        const neighbors = {
          north: true,
          east: true,
          south: true,
          west: true,
          northEast: true,
          southEast: true,
          southWest: true,
          northWest: true
        };

        const edges = manager.generateEdgePattern(neighbors);

        expect(edges.top).toBe(false);
        expect(edges.right).toBe(false);
        expect(edges.bottom).toBe(false);
        expect(edges.left).toBe(false);
      });

      test('should generate appropriate edges for corner cells', () => {
        // Top-left corner of 2x2 square
        const neighbors = {
          north: false,
          east: true, // Has neighbor to the right
          south: true, // Has neighbor below
          west: false,
          northEast: false,
          southEast: true, // Has diagonal neighbor
          southWest: false,
          northWest: false
        };

        const edges = manager.generateEdgePattern(neighbors);

        expect(edges.top).toBe(true); // External edge
        expect(edges.right).toBe(false); // Internal edge (neighbor exists)
        expect(edges.bottom).toBe(false); // Internal edge (neighbor exists)
        expect(edges.left).toBe(true); // External edge
      });
    });
  });

  describe('generateCornerPattern', () => {
    describe('isolated cells', () => {
      test('should generate all corners for isolated cell with all edges', () => {
        const neighbors = {
          north: false,
          east: false,
          south: false,
          west: false,
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };
        const edges = {
          top: true,
          right: true,
          bottom: true,
          left: true
        };

        const corners = manager.generateCornerPattern(neighbors, edges);

        expect(corners.topRight).toBe(true);
        expect(corners.bottomRight).toBe(true);
        expect(corners.bottomLeft).toBe(true);
        expect(corners.topLeft).toBe(true);
      });
    });

    describe('horizontal line patterns', () => {
      test('should not generate corners for middle cell in horizontal line', () => {
        const neighbors = {
          north: false,
          east: true,
          south: false,
          west: true,
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };
        const edges = {
          top: true,
          right: false, // No right edge because neighbor exists
          bottom: true,
          left: false // No left edge because neighbor exists
        };

        const corners = manager.generateCornerPattern(neighbors, edges);

        // No corners because corners require both adjacent edges to exist
        expect(corners.topRight).toBe(false); // No right edge
        expect(corners.bottomRight).toBe(false); // No right edge
        expect(corners.bottomLeft).toBe(false); // No left edge
        expect(corners.topLeft).toBe(false); // No left edge
      });

      test('should generate left corners for leftmost cell in horizontal line', () => {
        const neighbors = {
          north: false,
          east: true,
          south: false,
          west: false,
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };
        const edges = {
          top: true,
          right: false, // No right edge because neighbor exists
          bottom: true,
          left: true // Left edge exists
        };

        const corners = manager.generateCornerPattern(neighbors, edges);

        expect(corners.topRight).toBe(false); // No right edge
        expect(corners.bottomRight).toBe(false); // No right edge
        expect(corners.bottomLeft).toBe(true); // Both bottom and left edges exist
        expect(corners.topLeft).toBe(true); // Both top and left edges exist
      });

      test('should generate right corners for rightmost cell in horizontal line', () => {
        const neighbors = {
          north: false,
          east: false,
          south: false,
          west: true,
          northEast: false,
          southEast: false,
          southWest: false,
          northWest: false
        };
        const edges = {
          top: true,
          right: true, // Right edge exists
          bottom: true,
          left: false // No left edge because neighbor exists
        };

        const corners = manager.generateCornerPattern(neighbors, edges);

        expect(corners.topRight).toBe(true); // Both top and right edges exist
        expect(corners.bottomRight).toBe(true); // Both bottom and right edges exist
        expect(corners.bottomLeft).toBe(false); // No left edge
        expect(corners.topLeft).toBe(false); // No left edge
      });
    });

    describe('corner exclusion based on diagonal neighbors', () => {
      test('should not generate corner when diagonal neighbor exists', () => {
        // Top-left corner of 2x2 square - no corner because diagonal neighbor exists
        const neighbors = {
          north: false,
          east: true,
          south: true,
          west: false,
          northEast: false,
          southEast: true, // Diagonal neighbor exists
          southWest: false,
          northWest: false
        };
        const edges = {
          top: true,
          right: false,
          bottom: false,
          left: true
        };

        const corners = manager.generateCornerPattern(neighbors, edges);

        expect(corners.topRight).toBe(false); // No right edge
        expect(corners.bottomRight).toBe(false); // No right or bottom edge
        expect(corners.bottomLeft).toBe(false); // No bottom edge
        expect(corners.topLeft).toBe(true); // Both top and left edges exist, no NW diagonal neighbor
      });

      test('should generate corner only when both adjacent edges exist and diagonal neighbor is missing', () => {
        const neighbors = {
          north: false,
          east: false,
          south: false,
          west: false,
          northEast: false, // Diagonal neighbor missing
          southEast: true, // Diagonal neighbor exists
          southWest: true, // Diagonal neighbor exists
          northWest: false // Diagonal neighbor missing
        };
        const edges = {
          top: true,
          right: true,
          bottom: true,
          left: true
        };

        const corners = manager.generateCornerPattern(neighbors, edges);

        expect(corners.topRight).toBe(true); // Both edges exist, no NE diagonal
        expect(corners.bottomRight).toBe(false); // Diagonal neighbor exists
        expect(corners.bottomLeft).toBe(false); // Diagonal neighbor exists
        expect(corners.topLeft).toBe(true); // Both edges exist, no NW diagonal
      });
    });

    describe('L-shaped cage corners', () => {
      test('should generate appropriate corners for L-shape outer corner', () => {
        // L-shape corner at R1C0, with R0C0 above and R1C1 to the right
        const neighbors = {
          north: true, // R0C0
          east: true, // R1C1
          south: false,
          west: false,
          northEast: false, // R0C1 not in cage
          southEast: false,
          southWest: false,
          northWest: false
        };
        const edges = {
          top: false, // No top edge (neighbor above)
          right: false, // No right edge (neighbor to right)
          bottom: true, // Bottom edge (no neighbor below)
          left: true // Left edge (no neighbor to left)
        };

        const corners = manager.generateCornerPattern(neighbors, edges);

        expect(corners.topRight).toBe(false); // Missing both edges
        expect(corners.bottomRight).toBe(false); // Missing right edge
        expect(corners.bottomLeft).toBe(true); // Both bottom and left edges exist
        expect(corners.topLeft).toBe(false); // Missing top edge
      });
    });
  });

  describe('getEdgeId', () => {
    test('should return 0 for no edges', () => {
      const edges = { top: false, right: false, bottom: false, left: false };
      expect(manager.getEdgeId(edges)).toBe(0);
    });

    test('should return 1 for top edge only', () => {
      const edges = { top: true, right: false, bottom: false, left: false };
      expect(manager.getEdgeId(edges)).toBe(1);
    });

    test('should return 2 for right edge only', () => {
      const edges = { top: false, right: true, bottom: false, left: false };
      expect(manager.getEdgeId(edges)).toBe(2);
    });

    test('should return 4 for bottom edge only', () => {
      const edges = { top: false, right: false, bottom: true, left: false };
      expect(manager.getEdgeId(edges)).toBe(4);
    });

    test('should return 8 for left edge only', () => {
      const edges = { top: false, right: false, bottom: false, left: true };
      expect(manager.getEdgeId(edges)).toBe(8);
    });

    test('should return 15 for all edges', () => {
      const edges = { top: true, right: true, bottom: true, left: true };
      expect(manager.getEdgeId(edges)).toBe(15);
    });

    test('should return 5 for top and bottom edges', () => {
      const edges = { top: true, right: false, bottom: true, left: false };
      expect(manager.getEdgeId(edges)).toBe(5);
    });

    test('should return 10 for left and right edges', () => {
      const edges = { top: false, right: true, bottom: false, left: true };
      expect(manager.getEdgeId(edges)).toBe(10);
    });

    test('should return 3 for top and right edges', () => {
      const edges = { top: true, right: true, bottom: false, left: false };
      expect(manager.getEdgeId(edges)).toBe(3);
    });

    test('should generate unique IDs for all 16 possible edge combinations', () => {
      const ids = new Set<number>();

      for (let i = 0; i < 16; i++) {
        const edges = {
          top: (i & 1) !== 0,
          right: (i & 2) !== 0,
          bottom: (i & 4) !== 0,
          left: (i & 8) !== 0
        };
        ids.add(manager.getEdgeId(edges));
      }

      expect(ids.size).toBe(16); // All combinations should be unique
    });
  });

  describe('getCornerId', () => {
    test('should return 0 for no corners', () => {
      const corners = { topRight: false, bottomRight: false, bottomLeft: false, topLeft: false };
      expect(manager.getCornerId(corners)).toBe(0);
    });

    test('should return 1 for topRight corner only', () => {
      const corners = { topRight: true, bottomRight: false, bottomLeft: false, topLeft: false };
      expect(manager.getCornerId(corners)).toBe(1);
    });

    test('should return 2 for bottomRight corner only', () => {
      const corners = { topRight: false, bottomRight: true, bottomLeft: false, topLeft: false };
      expect(manager.getCornerId(corners)).toBe(2);
    });

    test('should return 4 for bottomLeft corner only', () => {
      const corners = { topRight: false, bottomRight: false, bottomLeft: true, topLeft: false };
      expect(manager.getCornerId(corners)).toBe(4);
    });

    test('should return 8 for topLeft corner only', () => {
      const corners = { topRight: false, bottomRight: false, bottomLeft: false, topLeft: true };
      expect(manager.getCornerId(corners)).toBe(8);
    });

    test('should return 15 for all corners', () => {
      const corners = { topRight: true, bottomRight: true, bottomLeft: true, topLeft: true };
      expect(manager.getCornerId(corners)).toBe(15);
    });

    test('should generate unique IDs for all 16 possible corner combinations', () => {
      const ids = new Set<number>();

      for (let i = 0; i < 16; i++) {
        const corners = {
          topRight: (i & 1) !== 0,
          bottomRight: (i & 2) !== 0,
          bottomLeft: (i & 4) !== 0,
          topLeft: (i & 8) !== 0
        };
        ids.add(manager.getCornerId(corners));
      }

      expect(ids.size).toBe(16); // All combinations should be unique
    });
  });

  describe('getPatternForCell', () => {
    describe('single cell patterns', () => {
      test('should generate complete pattern for isolated cell', () => {
        const cellId = 'E05' as CellId;
        const occupiedCells = new Set(['4,4']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Isolated cell should have all edges
        expect(pattern.edges.top).toBe(true);
        expect(pattern.edges.right).toBe(true);
        expect(pattern.edges.bottom).toBe(true);
        expect(pattern.edges.left).toBe(true);

        // Isolated cell should have all corners
        expect(pattern.corners.topRight).toBe(true);
        expect(pattern.corners.bottomRight).toBe(true);
        expect(pattern.corners.bottomLeft).toBe(true);
        expect(pattern.corners.topLeft).toBe(true);

        // Should have maximum edge and corner IDs
        expect(pattern.edgeId).toBe(15);
        expect(pattern.cornerId).toBe(15);
      });
    });

    describe('horizontal line patterns', () => {
      test('should generate correct pattern for leftmost cell in horizontal line', () => {
        const cellId = 'A01' as CellId;
        const occupiedCells = new Set(['0,0', '0,1', '0,2']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Should have top, bottom, and left edges (no right edge)
        expect(pattern.edges.top).toBe(true);
        expect(pattern.edges.right).toBe(false);
        expect(pattern.edges.bottom).toBe(true);
        expect(pattern.edges.left).toBe(true);

        // Should have top-left and bottom-left corners only
        expect(pattern.corners.topRight).toBe(false);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(true);
        expect(pattern.corners.topLeft).toBe(true);
      });

      test('should generate correct pattern for middle cell in horizontal line', () => {
        const cellId = 'A02' as CellId;
        const occupiedCells = new Set(['0,0', '0,1', '0,2']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Should have only top and bottom edges (no left or right edges)
        expect(pattern.edges.top).toBe(true);
        expect(pattern.edges.right).toBe(false);
        expect(pattern.edges.bottom).toBe(true);
        expect(pattern.edges.left).toBe(false);

        // Should have no corners (missing both left and right edges)
        expect(pattern.corners.topRight).toBe(false);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(false);
        expect(pattern.corners.topLeft).toBe(false);
      });

      test('should generate correct pattern for rightmost cell in horizontal line', () => {
        const cellId = 'A03' as CellId;
        const occupiedCells = new Set(['0,0', '0,1', '0,2']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Should have top, bottom, and right edges (no left edge)
        expect(pattern.edges.top).toBe(true);
        expect(pattern.edges.right).toBe(true);
        expect(pattern.edges.bottom).toBe(true);
        expect(pattern.edges.left).toBe(false);

        // Should have top-right and bottom-right corners only
        expect(pattern.corners.topRight).toBe(true);
        expect(pattern.corners.bottomRight).toBe(true);
        expect(pattern.corners.bottomLeft).toBe(false);
        expect(pattern.corners.topLeft).toBe(false);
      });
    });

    describe('vertical line patterns', () => {
      test('should generate correct pattern for topmost cell in vertical line', () => {
        const cellId = 'A01' as CellId;
        const occupiedCells = new Set(['0,0', '1,0', '2,0']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Should have top, left, and right edges (no bottom edge)
        expect(pattern.edges.top).toBe(true);
        expect(pattern.edges.right).toBe(true);
        expect(pattern.edges.bottom).toBe(false);
        expect(pattern.edges.left).toBe(true);

        // Should have top-left and top-right corners only
        expect(pattern.corners.topRight).toBe(true);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(false);
        expect(pattern.corners.topLeft).toBe(true);
      });

      test('should generate correct pattern for middle cell in vertical line', () => {
        const cellId = 'B01' as CellId;
        const occupiedCells = new Set(['0,0', '1,0', '2,0']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Should have only left and right edges (no top or bottom edges)
        expect(pattern.edges.top).toBe(false);
        expect(pattern.edges.right).toBe(true);
        expect(pattern.edges.bottom).toBe(false);
        expect(pattern.edges.left).toBe(true);

        // Should have no corners (missing both top and bottom edges)
        expect(pattern.corners.topRight).toBe(false);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(false);
        expect(pattern.corners.topLeft).toBe(false);
      });

      test('should generate correct pattern for bottommost cell in vertical line', () => {
        const cellId = 'C01' as CellId;
        const occupiedCells = new Set(['0,0', '1,0', '2,0']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Should have bottom, left, and right edges (no top edge)
        expect(pattern.edges.top).toBe(false);
        expect(pattern.edges.right).toBe(true);
        expect(pattern.edges.bottom).toBe(true);
        expect(pattern.edges.left).toBe(true);

        // Should have bottom-left and bottom-right corners only
        expect(pattern.corners.topRight).toBe(false);
        expect(pattern.corners.bottomRight).toBe(true);
        expect(pattern.corners.bottomLeft).toBe(true);
        expect(pattern.corners.topLeft).toBe(false);
      });
    });

    describe('2x2 square patterns', () => {
      test('should generate correct pattern for top-left corner of square', () => {
        const cellId = 'A01' as CellId;
        const occupiedCells = new Set(['0,0', '1,0', '0,1', '1,1']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Should have top and left edges only (internal bottom and right)
        expect(pattern.edges.top).toBe(true);
        expect(pattern.edges.right).toBe(false);
        expect(pattern.edges.bottom).toBe(false);
        expect(pattern.edges.left).toBe(true);

        // Should have only top-left corner (diagonal neighbor prevents others)
        expect(pattern.corners.topRight).toBe(false);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(false);
        expect(pattern.corners.topLeft).toBe(true);
      });

      test('should generate correct pattern for top-right corner of square', () => {
        const cellId = 'A02' as CellId; // row=0, col=1 is top-right
        const occupiedCells = new Set(['0,0', '1,0', '0,1', '1,1']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Should have top and right edges only
        expect(pattern.edges.top).toBe(true);
        expect(pattern.edges.right).toBe(true);
        expect(pattern.edges.bottom).toBe(false);
        expect(pattern.edges.left).toBe(false);

        // Should have only top-right corner
        expect(pattern.corners.topRight).toBe(true);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(false);
        expect(pattern.corners.topLeft).toBe(false);
      });

      test('should generate correct pattern for bottom-left corner of square', () => {
        const cellId = 'B01' as CellId; // row=1, col=0 is bottom-left
        const occupiedCells = new Set(['0,0', '1,0', '0,1', '1,1']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Should have bottom and left edges only
        expect(pattern.edges.top).toBe(false);
        expect(pattern.edges.right).toBe(false);
        expect(pattern.edges.bottom).toBe(true);
        expect(pattern.edges.left).toBe(true);

        // Should have only bottom-left corner
        expect(pattern.corners.topRight).toBe(false);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(true);
        expect(pattern.corners.topLeft).toBe(false);
      });

      test('should generate correct pattern for bottom-right corner of square', () => {
        const cellId = 'B02' as CellId;
        const occupiedCells = new Set(['0,0', '1,0', '0,1', '1,1']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Should have bottom and right edges only
        expect(pattern.edges.top).toBe(false);
        expect(pattern.edges.right).toBe(true);
        expect(pattern.edges.bottom).toBe(true);
        expect(pattern.edges.left).toBe(false);

        // Should have only bottom-right corner
        expect(pattern.corners.topRight).toBe(false);
        expect(pattern.corners.bottomRight).toBe(true);
        expect(pattern.corners.bottomLeft).toBe(false);
        expect(pattern.corners.topLeft).toBe(false);
      });
    });

    describe('L-shaped cage patterns', () => {
      test('should generate correct pattern for L-shape corner cell', () => {
        // L-shape: A01 (0,0) top, B01 (1,0) corner, B02 (1,1) right
        const cellId = 'B01' as CellId; // Corner at (1,0)
        const occupiedCells = new Set(['0,0', '1,0', '1,1']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Corner should have bottom and left edges
        expect(pattern.edges.top).toBe(false); // A01 is above
        expect(pattern.edges.right).toBe(false); // B02 is to the right
        expect(pattern.edges.bottom).toBe(true); // No neighbor below
        expect(pattern.edges.left).toBe(true); // No neighbor to the left

        // Should have bottom-left corner only
        expect(pattern.corners.topRight).toBe(false);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(true);
        expect(pattern.corners.topLeft).toBe(false);
      });

      test('should generate correct pattern for L-shape vertical end', () => {
        // L-shape: A01 (0,0) top, B01 (1,0) corner, B02 (1,1) right
        const cellId = 'A01' as CellId; // Top at (0,0)
        const occupiedCells = new Set(['0,0', '1,0', '1,1']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Top end should have top, left, and right edges
        expect(pattern.edges.top).toBe(true); // No neighbor above
        expect(pattern.edges.right).toBe(true); // A02 not in cage
        expect(pattern.edges.bottom).toBe(false); // B01 is below
        expect(pattern.edges.left).toBe(true); // No neighbor to the left

        // Should have top-left and top-right corners
        expect(pattern.corners.topRight).toBe(true);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(false);
        expect(pattern.corners.topLeft).toBe(true);
      });

      test('should generate correct pattern for L-shape horizontal end', () => {
        // L-shape: A01 (0,0) top, B01 (1,0) corner, B02 (1,1) right
        const cellId = 'B02' as CellId; // Right end at (1,1)
        const occupiedCells = new Set(['0,0', '1,0', '1,1']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Right end should have top, right, and bottom edges
        expect(pattern.edges.top).toBe(true); // A02 not in cage
        expect(pattern.edges.right).toBe(true); // No neighbor to the right
        expect(pattern.edges.bottom).toBe(true); // No neighbor below
        expect(pattern.edges.left).toBe(false); // B01 is to the left

        // Should have top-right and bottom-right corners
        expect(pattern.corners.topRight).toBe(true);
        expect(pattern.corners.bottomRight).toBe(true);
        expect(pattern.corners.bottomLeft).toBe(false);
        expect(pattern.corners.topLeft).toBe(false);
      });
    });

    describe('T-shaped cage patterns', () => {
      test('should generate correct pattern for T-shape center cell', () => {
        // T-shape: R0C1 (top), R1C0, R1C1 (center), R1C2, R2C1 (bottom)
        const cellId = 'B02' as CellId;
        const occupiedCells = new Set(['1,0', '0,1', '1,1', '2,1', '1,2']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Center should have no external edges
        expect(pattern.edges.top).toBe(false);
        expect(pattern.edges.right).toBe(false);
        expect(pattern.edges.bottom).toBe(false);
        expect(pattern.edges.left).toBe(false);

        // Should have no corners (all internal)
        expect(pattern.corners.topRight).toBe(false);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(false);
        expect(pattern.corners.topLeft).toBe(false);

        expect(pattern.edgeId).toBe(0);
        expect(pattern.cornerId).toBe(0);
      });

      test('should generate correct pattern for T-shape horizontal bar end', () => {
        // T-shape: A02 (0,1) top, B01 (1,0) left end, B02 (1,1) center, B03 (1,2), C02 (2,1) bottom
        const cellId = 'B01' as CellId; // Left end at (1,0)
        const occupiedCells = new Set(['1,0', '0,1', '1,1', '2,1', '1,2']);

        const pattern = manager.getPatternForCell(cellId, occupiedCells);

        // Left end should have top, bottom, and left edges
        expect(pattern.edges.top).toBe(true); // A01 not in cage
        expect(pattern.edges.right).toBe(false); // B02 is to the right
        expect(pattern.edges.bottom).toBe(true); // C01 not in cage
        expect(pattern.edges.left).toBe(true); // No neighbor to the left

        // Should have top-left and bottom-left corners
        expect(pattern.corners.topRight).toBe(false);
        expect(pattern.corners.bottomRight).toBe(false);
        expect(pattern.corners.bottomLeft).toBe(true);
        expect(pattern.corners.topLeft).toBe(true);
      });
    });

    describe('realistic killer sudoku cage scenarios', () => {
      test('should handle typical 3-cell vertical cage in killer sudoku', () => {
        const cage = ['A01' as CellId, 'A02' as CellId, 'A03' as CellId];
        const occupiedCells = manager.buildOccupiedCellsSet(cage);

        const topPattern = manager.getPatternForCell(cage[0], occupiedCells);
        const middlePattern = manager.getPatternForCell(cage[1], occupiedCells);
        const bottomPattern = manager.getPatternForCell(cage[2], occupiedCells);

        // Each cell should have distinct visual patterns
        expect(topPattern.edgeId).not.toBe(middlePattern.edgeId);
        expect(middlePattern.edgeId).not.toBe(bottomPattern.edgeId);

        // Top and bottom should have corners, middle should not
        expect(topPattern.cornerId).toBeGreaterThan(0);
        expect(middlePattern.cornerId).toBe(0);
        expect(bottomPattern.cornerId).toBeGreaterThan(0);
      });

      test('should handle adjacent cages with different patterns', () => {
        // Two side-by-side vertical cages (going down rows)
        const cage1 = ['A01' as CellId, 'B01' as CellId]; // Column 0: (0,0), (1,0)
        const cage2 = ['A02' as CellId, 'B02' as CellId]; // Column 1: (0,1), (1,1)

        const occupiedCells1 = manager.buildOccupiedCellsSet(cage1);
        const occupiedCells2 = manager.buildOccupiedCellsSet(cage2);

        const pattern1Top = manager.getPatternForCell(cage1[0], occupiedCells1);
        const pattern2Top = manager.getPatternForCell(cage2[0], occupiedCells2);

        // Both should have similar structure but be independently calculated
        expect(pattern1Top.edges.top).toBe(true);
        expect(pattern2Top.edges.top).toBe(true);
        expect(pattern1Top.edges.bottom).toBe(false);
        expect(pattern2Top.edges.bottom).toBe(false);
      });

      test('should correctly pattern a complex irregular cage', () => {
        // Complex shape that might appear in killer sudoku
        const complexCage = [
          'A01' as CellId,
          'B01' as CellId,
          'A02' as CellId,
          'A03' as CellId,
          'B03' as CellId
        ];
        const occupiedCells = manager.buildOccupiedCellsSet(complexCage);

        // Test each cell has appropriate pattern
        complexCage.forEach((cellId) => {
          const pattern = manager.getPatternForCell(cellId, occupiedCells);

          // Each cell should have a valid pattern
          expect(pattern.edgeId).toBeGreaterThanOrEqual(0);
          expect(pattern.edgeId).toBeLessThanOrEqual(15);
          expect(pattern.cornerId).toBeGreaterThanOrEqual(0);
          expect(pattern.cornerId).toBeLessThanOrEqual(15);
        });
      });
    });
  });

  describe('user experience: visual distinction', () => {
    test('should provide distinct patterns for cells with different neighbor configurations', () => {
      // Create several different cage patterns
      const isolatedCell = manager.getPatternForCell('A01' as CellId, new Set(['0,0']));

      const topOfVerticalLine = manager.getPatternForCell('A01' as CellId, new Set(['0,0', '1,0']));

      const middleOfVerticalLine = manager.getPatternForCell('A02' as CellId, new Set(['0,0', '0,1', '0,2']));

      const cornerOfSquare = manager.getPatternForCell(
        'A01' as CellId,
        new Set(['0,0', '1,0', '0,1', '1,1'])
      );

      // All should have distinct edge patterns
      const edgeIds = [
        isolatedCell.edgeId,
        topOfVerticalLine.edgeId,
        middleOfVerticalLine.edgeId,
        cornerOfSquare.edgeId
      ];
      const uniqueEdgeIds = new Set(edgeIds);
      expect(uniqueEdgeIds.size).toBe(4); // All different

      // All should have distinct corner patterns
      const cornerIds = [
        isolatedCell.cornerId,
        topOfVerticalLine.cornerId,
        middleOfVerticalLine.cornerId,
        cornerOfSquare.cornerId
      ];
      const uniqueCornerIds = new Set(cornerIds);
      expect(uniqueCornerIds.size).toBe(4); // All different
    });

    test('should ensure cage boundaries are clearly defined through edge patterns', () => {
      // Create a 2x2 cage and verify all external boundaries have edges
      // Layout: B02 (1,1)  B03 (1,2)
      //         C02 (2,1)  C03 (2,2)
      const cagePattern = [
        'B02' as CellId, // top-left
        'B03' as CellId, // top-right
        'C02' as CellId, // bottom-left
        'C03' as CellId // bottom-right
      ];
      const occupiedCells = manager.buildOccupiedCellsSet(cagePattern);

      // Check that external edges are marked
      const topLeft = manager.getPatternForCell(cagePattern[0], occupiedCells);
      expect(topLeft.edges.top).toBe(true); // External edge
      expect(topLeft.edges.left).toBe(true); // External edge

      const topRight = manager.getPatternForCell(cagePattern[1], occupiedCells);
      expect(topRight.edges.top).toBe(true); // External edge
      expect(topRight.edges.right).toBe(true); // External edge

      const bottomLeft = manager.getPatternForCell(cagePattern[2], occupiedCells);
      expect(bottomLeft.edges.bottom).toBe(true); // External edge
      expect(bottomLeft.edges.left).toBe(true); // External edge

      const bottomRight = manager.getPatternForCell(cagePattern[3], occupiedCells);
      expect(bottomRight.edges.bottom).toBe(true); // External edge
      expect(bottomRight.edges.right).toBe(true); // External edge
    });

    test('should provide corner markers for outer corners to enhance visual clarity', () => {
      // Single isolated cell should have all four corners for clear visual boundary
      const isolatedPattern = manager.getPatternForCell('E05' as CellId, new Set(['4,4']));

      expect(isolatedPattern.corners.topLeft).toBe(true);
      expect(isolatedPattern.corners.topRight).toBe(true);
      expect(isolatedPattern.corners.bottomLeft).toBe(true);
      expect(isolatedPattern.corners.bottomRight).toBe(true);
    });

    test('should support visual distinction between 10+ adjacent cages through pattern cycling', () => {
      // Verify that we have enough unique patterns for many adjacent cages
      const uniquePatterns = new Set<string>();

      // Generate patterns for many different cage configurations
      for (let i = 0; i < 16; i++) {
        const edges = {
          top: (i & 1) !== 0,
          right: (i & 2) !== 0,
          bottom: (i & 4) !== 0,
          left: (i & 8) !== 0
        };

        for (let j = 0; j < 16; j++) {
          const corners = {
            topRight: (j & 1) !== 0,
            bottomRight: (j & 2) !== 0,
            bottomLeft: (j & 4) !== 0,
            topLeft: (j & 8) !== 0
          };

          const edgeId = manager.getEdgeId(edges);
          const cornerId = manager.getCornerId(corners);
          uniquePatterns.add(`${edgeId}-${cornerId}`);
        }
      }

      // We have 16 edge patterns × 16 corner patterns = 256 unique combinations
      expect(uniquePatterns.size).toBe(256);
    });
  });
});
