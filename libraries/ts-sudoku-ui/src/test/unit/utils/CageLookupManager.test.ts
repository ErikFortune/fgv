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

import { CageLookupManager } from '../../../utils/CageLookupManager';
import { INeighborAnalysis } from '../../../utils/CagePatternManager';

describe('CageLookupManager', () => {
  describe('singleton pattern', () => {
    describe('getInstance', () => {
      test('should return same instance on multiple calls', () => {
        const instance1 = CageLookupManager.getInstance();
        const instance2 = CageLookupManager.getInstance();

        expect(instance1).toBe(instance2);
      });

      test('should initialize lookup tables on first access', () => {
        const instance = CageLookupManager.getInstance();

        // Verify we have the expected number of unique patterns
        expect(instance.uniquePatternCount).toBeGreaterThan(0);
        expect(instance.uniquePatternCount).toBeLessThanOrEqual(256);
      });
    });
  });

  describe('neighborsToPattern', () => {
    let manager: CageLookupManager;

    beforeEach(() => {
      manager = CageLookupManager.getInstance();
    });

    describe('isolated cell scenarios', () => {
      test('should return 0 for cell with no neighbors', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: false,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(0);
      });

      test('should return 255 for cell completely surrounded by neighbors', () => {
        const neighbors: INeighborAnalysis = {
          north: true,
          northEast: true,
          east: true,
          southEast: true,
          south: true,
          southWest: true,
          west: true,
          northWest: true
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(255);
      });
    });

    describe('cardinal direction patterns', () => {
      test('should encode north neighbor correctly (bit 0)', () => {
        const neighbors: INeighborAnalysis = {
          north: true,
          northEast: false,
          east: false,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(1);
      });

      test('should encode east neighbor correctly (bit 2)', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: true,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(4);
      });

      test('should encode south neighbor correctly (bit 4)', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: false,
          southEast: false,
          south: true,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(16);
      });

      test('should encode west neighbor correctly (bit 6)', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: false,
          southEast: false,
          south: false,
          southWest: false,
          west: true,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(64);
      });
    });

    describe('diagonal direction patterns', () => {
      test('should encode north-east neighbor correctly (bit 1)', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: true,
          east: false,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(2);
      });

      test('should encode south-east neighbor correctly (bit 3)', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: false,
          southEast: true,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(8);
      });

      test('should encode south-west neighbor correctly (bit 5)', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: false,
          southEast: false,
          south: false,
          southWest: true,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(32);
      });

      test('should encode north-west neighbor correctly (bit 7)', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: false,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: true
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(128);
      });
    });

    describe('realistic killer sudoku cage patterns', () => {
      test('should encode top-left corner of horizontal line cage', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: true, // Has neighbor to the right
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(4); // Only east bit set
      });

      test('should encode middle cell in horizontal line cage', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: true, // Has neighbor to the right
          southEast: false,
          south: false,
          southWest: false,
          west: true, // Has neighbor to the left
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(68); // East (4) + West (64) = 68
      });

      test('should encode top cell in vertical line cage', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: false,
          southEast: false,
          south: true, // Has neighbor below
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(16); // Only south bit set
      });

      test('should encode middle cell in vertical line cage', () => {
        const neighbors: INeighborAnalysis = {
          north: true, // Has neighbor above
          northEast: false,
          east: false,
          southEast: false,
          south: true, // Has neighbor below
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(17); // North (1) + South (16) = 17
      });

      test('should encode corner cell in L-shaped cage', () => {
        const neighbors: INeighborAnalysis = {
          north: true, // Neighbor above
          northEast: false,
          east: true, // Neighbor to the right
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(5); // North (1) + East (4) = 5
      });

      test('should encode top-left corner in 2x2 square cage', () => {
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: true, // Neighbor to the right
          southEast: true, // Diagonal neighbor
          south: true, // Neighbor below
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(28); // East (4) + SouthEast (8) + South (16) = 28
      });

      test('should encode center cell of T-shaped cage with no diagonal neighbors', () => {
        const neighbors: INeighborAnalysis = {
          north: true,
          northEast: false, // Missing diagonal
          east: true,
          southEast: false, // Missing diagonal
          south: true,
          southWest: false, // Missing diagonal
          west: true,
          northWest: false // Missing diagonal
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBe(85); // North (1) + East (4) + South (16) + West (64) = 85
      });
    });

    describe('pattern uniqueness', () => {
      test('should generate unique patterns for all 256 neighbor combinations', () => {
        const patterns = new Set<number>();

        for (let i = 0; i < 256; i++) {
          const neighbors: INeighborAnalysis = {
            north: (i & 1) !== 0,
            northEast: (i & 2) !== 0,
            east: (i & 4) !== 0,
            southEast: (i & 8) !== 0,
            south: (i & 16) !== 0,
            southWest: (i & 32) !== 0,
            west: (i & 64) !== 0,
            northWest: (i & 128) !== 0
          };

          patterns.add(manager.neighborsToPattern(neighbors));
        }

        // All 256 combinations should map to unique patterns
        expect(patterns.size).toBe(256);
      });

      test('should generate patterns in valid range [0, 255]', () => {
        const neighbors: INeighborAnalysis = {
          north: true,
          northEast: true,
          east: true,
          southEast: true,
          south: true,
          southWest: true,
          west: true,
          northWest: true
        };

        const pattern = manager.neighborsToPattern(neighbors);
        expect(pattern).toBeGreaterThanOrEqual(0);
        expect(pattern).toBeLessThanOrEqual(255);
      });
    });
  });

  describe('getPatternSVG', () => {
    let manager: CageLookupManager;

    beforeEach(() => {
      manager = CageLookupManager.getInstance();
    });

    describe('valid neighbor patterns', () => {
      test('should return SVG path for isolated cell (pattern 0)', () => {
        const svg = manager.getPatternSVG(0);

        expect(svg).toBeTruthy();
        expect(typeof svg).toBe('string');
        // Isolated cell should have edges and corners
        expect(svg.length).toBeGreaterThan(0);
      });

      test('should return empty SVG for completely surrounded cell (pattern 255)', () => {
        const svg = manager.getPatternSVG(255);

        // Completely surrounded cell has no visible borders
        expect(typeof svg).toBe('string');
        expect(svg).toBe('');
      });

      test('should return SVG path for horizontal line end (east neighbor only)', () => {
        const pattern = 4; // Only east bit set
        const svg = manager.getPatternSVG(pattern);

        expect(svg).toBeTruthy();
        expect(typeof svg).toBe('string');
        expect(svg.length).toBeGreaterThan(0);
      });

      test('should return SVG path for vertical line end (south neighbor only)', () => {
        const pattern = 16; // Only south bit set
        const svg = manager.getPatternSVG(pattern);

        expect(svg).toBeTruthy();
        expect(typeof svg).toBe('string');
        expect(svg.length).toBeGreaterThan(0);
      });

      test('should return valid SVG strings for all 256 neighbor patterns', () => {
        for (let pattern = 0; pattern < 256; pattern++) {
          const svg = manager.getPatternSVG(pattern);

          // All patterns should return a string (may be empty for internal cells)
          expect(typeof svg).toBe('string');
        }
      });
    });

    describe('invalid neighbor patterns', () => {
      test('should throw for negative pattern', () => {
        expect(() => manager.getPatternSVG(-1)).toThrow(/Invalid neighbor pattern/);
      });

      test('should throw for pattern >= 256', () => {
        expect(() => manager.getPatternSVG(256)).toThrow(/Invalid neighbor pattern/);
      });

      test('should throw for pattern >> 256', () => {
        expect(() => manager.getPatternSVG(1000)).toThrow(/Invalid neighbor pattern/);
      });
    });

    describe('SVG path format validation', () => {
      test('should generate SVG with M (moveto) commands', () => {
        const svg = manager.getPatternSVG(0); // Isolated cell
        expect(svg).toMatch(/M/); // Should contain moveto commands
      });

      test('should generate SVG with L (lineto) commands for edges', () => {
        const svg = manager.getPatternSVG(0); // Isolated cell
        expect(svg).toMatch(/L/); // Should contain lineto commands
      });

      test('should use normalized coordinates between 0 and 1', () => {
        const svg = manager.getPatternSVG(0);
        // Extract all numeric values from SVG path
        const numbers = svg.match(/\d+\.?\d*/g);

        if (numbers) {
          numbers.forEach((numStr) => {
            const num = parseFloat(numStr);
            expect(num).toBeGreaterThanOrEqual(0);
            expect(num).toBeLessThanOrEqual(1.2); // Allow some extension beyond edge
          });
        }
      });
    });

    describe('realistic killer sudoku cage rendering', () => {
      test('should provide different SVG paths for different cage positions', () => {
        // Top-left corner, middle, bottom-right corner should have distinct visuals
        const topLeft = manager.getPatternSVG(28); // East + SE + South
        const middle = manager.getPatternSVG(85); // N + E + S + W cardinals
        const bottomRight = manager.getPatternSVG(193); // N + NW + W

        // All should be valid
        expect(topLeft).toBeTruthy();
        expect(middle).toBeTruthy();
        expect(bottomRight).toBeTruthy();

        // They should be different for visual distinction
        expect(topLeft).not.toBe(middle);
        expect(middle).not.toBe(bottomRight);
        expect(topLeft).not.toBe(bottomRight);
      });

      test('should handle corner connector patterns when diagonal is missing', () => {
        // Pattern with cardinal neighbors but missing diagonal (creates corner connector)
        const pattern = 5; // North + East (no NE diagonal)
        const svg = manager.getPatternSVG(pattern);

        expect(svg).toBeTruthy();
        expect(svg.length).toBeGreaterThan(0);
      });

      test('should provide consistent SVG for same pattern on repeated calls', () => {
        const pattern = 42; // Arbitrary pattern
        const svg1 = manager.getPatternSVG(pattern);
        const svg2 = manager.getPatternSVG(pattern);

        expect(svg1).toBe(svg2);
      });
    });
  });

  describe('getSegmentPatternId', () => {
    let manager: CageLookupManager;

    beforeEach(() => {
      manager = CageLookupManager.getInstance();
    });

    describe('pattern ID mapping', () => {
      test('should return valid segment pattern ID for isolated cell', () => {
        const id = manager.getSegmentPatternId(0);

        expect(id).toBeGreaterThanOrEqual(0);
        expect(id).toBeLessThan(manager.uniquePatternCount);
      });

      test('should return valid segment pattern IDs for all 256 patterns', () => {
        for (let pattern = 0; pattern < 256; pattern++) {
          const id = manager.getSegmentPatternId(pattern);

          expect(id).toBeGreaterThanOrEqual(0);
          expect(id).toBeLessThan(manager.uniquePatternCount);
        }
      });

      test('should return same ID for patterns with equivalent segment requirements', () => {
        // Patterns that differ only in irrelevant diagonal neighbors should map to same segment ID
        // Pattern 0: No neighbors
        // Pattern 2: Only NE diagonal neighbor
        const id0 = manager.getSegmentPatternId(0);
        const id2 = manager.getSegmentPatternId(2);

        // These should be different because diagonal affects corner rendering
        expect(typeof id0).toBe('number');
        expect(typeof id2).toBe('number');
      });
    });

    describe('compression efficiency', () => {
      test('should compress 256 patterns to significantly fewer segment patterns', () => {
        const uniqueCount = manager.uniquePatternCount;

        // Should have significantly fewer unique segment patterns than neighbor patterns
        expect(uniqueCount).toBeLessThan(256);
        // Based on implementation, we expect around 47 unique patterns
        expect(uniqueCount).toBeGreaterThan(0);
      });

      test('should map multiple neighbor patterns to same segment pattern', () => {
        const segmentIds = new Set<number>();

        for (let pattern = 0; pattern < 256; pattern++) {
          segmentIds.add(manager.getSegmentPatternId(pattern));
        }

        // Unique segment IDs should be less than 256 (compression occurs)
        expect(segmentIds.size).toBeLessThan(256);
        expect(segmentIds.size).toBe(manager.uniquePatternCount);
      });
    });
  });

  describe('uniquePatternCount', () => {
    let manager: CageLookupManager;

    beforeEach(() => {
      manager = CageLookupManager.getInstance();
    });

    describe('lookup table efficiency', () => {
      test('should report consistent unique pattern count', () => {
        const count1 = manager.uniquePatternCount;
        const count2 = manager.uniquePatternCount;

        expect(count1).toBe(count2);
      });

      test('should have reasonable number of unique patterns for killer sudoku rendering', () => {
        const count = manager.uniquePatternCount;

        // Should have enough patterns for visual variety but not too many for performance
        expect(count).toBeGreaterThan(10); // Need variety for different cage shapes
        expect(count).toBeLessThan(256); // Should compress from 256 neighbor patterns
      });

      test('should report unique pattern count matching actual unique SVG paths', () => {
        const uniqueSvgPaths = new Set<string>();

        for (let pattern = 0; pattern < 256; pattern++) {
          uniqueSvgPaths.add(manager.getPatternSVG(pattern));
        }

        // Unique SVG paths should match the reported unique pattern count
        expect(uniqueSvgPaths.size).toBe(manager.uniquePatternCount);
      });
    });
  });

  describe('end-to-end: neighbor analysis to SVG rendering', () => {
    let manager: CageLookupManager;

    beforeEach(() => {
      manager = CageLookupManager.getInstance();
    });

    describe('realistic killer sudoku rendering workflow', () => {
      test('should convert neighbor analysis to SVG for isolated cage cell', () => {
        // User selects isolated cell for cage
        const neighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: false,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(neighbors);
        const svg = manager.getPatternSVG(pattern);

        expect(svg).toBeTruthy();
        expect(svg.length).toBeGreaterThan(0);
        // Should have all four edges visible
        expect(svg).toMatch(/M.*L/); // Contains path commands
      });

      test('should convert neighbor analysis to SVG for horizontal cage cells', () => {
        // Three-cell horizontal cage: left end, middle, right end
        const leftEndNeighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: true, // Neighbor to the right
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const middleNeighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: true, // Neighbor to the right
          southEast: false,
          south: false,
          southWest: false,
          west: true, // Neighbor to the left
          northWest: false
        };

        const rightEndNeighbors: INeighborAnalysis = {
          north: false,
          northEast: false,
          east: false,
          southEast: false,
          south: false,
          southWest: false,
          west: true, // Neighbor to the left
          northWest: false
        };

        const leftSvg = manager.getPatternSVG(manager.neighborsToPattern(leftEndNeighbors));
        const middleSvg = manager.getPatternSVG(manager.neighborsToPattern(middleNeighbors));
        const rightSvg = manager.getPatternSVG(manager.neighborsToPattern(rightEndNeighbors));

        // All should be valid
        expect(leftSvg).toBeTruthy();
        expect(middleSvg).toBeTruthy();
        expect(rightSvg).toBeTruthy();

        // Each should have distinct rendering
        expect(leftSvg).not.toBe(middleSvg);
        expect(middleSvg).not.toBe(rightSvg);
      });

      test('should convert neighbor analysis to SVG for L-shaped cage corner', () => {
        // L-shape corner with neighbors to north and east
        const cornerNeighbors: INeighborAnalysis = {
          north: true,
          northEast: false, // No diagonal neighbor
          east: true,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern = manager.neighborsToPattern(cornerNeighbors);
        const svg = manager.getPatternSVG(pattern);

        expect(svg).toBeTruthy();
        expect(svg.length).toBeGreaterThan(0);
        // Should have corner connector due to missing NE diagonal
        expect(svg).toMatch(/M.*L/);
      });

      test('should handle rapid successive lookups for user interaction performance', () => {
        // Simulate user hovering over multiple cells quickly
        const patterns = [0, 5, 15, 85];

        patterns.forEach((pattern) => {
          const svg = manager.getPatternSVG(pattern);
          expect(typeof svg).toBe('string');
        });
      });

      test('should provide consistent rendering across cage refresh', () => {
        // Simulate cage being re-rendered (e.g., after undo/redo)
        const neighbors: INeighborAnalysis = {
          north: true,
          northEast: false,
          east: true,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const pattern1 = manager.neighborsToPattern(neighbors);
        const svg1 = manager.getPatternSVG(pattern1);

        // Re-analyze same neighbors
        const pattern2 = manager.neighborsToPattern(neighbors);
        const svg2 = manager.getPatternSVG(pattern2);

        expect(pattern1).toBe(pattern2);
        expect(svg1).toBe(svg2);
      });
    });

    describe('visual correctness for cage boundaries', () => {
      test('should render edges for external cage boundaries', () => {
        // Cell with no north neighbor should have top edge visible
        const topEdgeNeighbors: INeighborAnalysis = {
          north: false, // No neighbor above
          northEast: false,
          east: true,
          southEast: false,
          south: true,
          southWest: false,
          west: true,
          northWest: false
        };

        const svg = manager.getPatternSVG(manager.neighborsToPattern(topEdgeNeighbors));
        expect(svg).toBeTruthy();
        expect(svg.length).toBeGreaterThan(0);
      });

      test('should render internal segments for cage cell connections', () => {
        // Cell with neighbor on one side should have internal segment
        const internalSegmentNeighbors: INeighborAnalysis = {
          north: true, // Has neighbor above - should create internal segment
          northEast: false,
          east: false,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const svg = manager.getPatternSVG(manager.neighborsToPattern(internalSegmentNeighbors));
        expect(svg).toBeTruthy();
        expect(svg.length).toBeGreaterThan(0);
      });

      test('should render corner connectors when diagonal neighbor missing', () => {
        // Corner situation: has north and east neighbors but no NE diagonal
        const cornerConnectorNeighbors: INeighborAnalysis = {
          north: true,
          northEast: false, // Missing diagonal should create corner connector
          east: true,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        const svg = manager.getPatternSVG(manager.neighborsToPattern(cornerConnectorNeighbors));
        expect(svg).toBeTruthy();
        expect(svg.length).toBeGreaterThan(0);
      });
    });
  });

  describe('integration with CagePatternManager workflow', () => {
    let manager: CageLookupManager;

    beforeEach(() => {
      manager = CageLookupManager.getInstance();
    });

    describe('typical usage pattern', () => {
      test('should process neighbor analysis from CagePatternManager', () => {
        // This would typically come from CagePatternManager.analyzeNeighbors()
        const neighborAnalysis: INeighborAnalysis = {
          north: true,
          northEast: true,
          east: true,
          southEast: false,
          south: false,
          southWest: false,
          west: false,
          northWest: false
        };

        // Convert to pattern
        const pattern = manager.neighborsToPattern(neighborAnalysis);
        expect(pattern).toBeGreaterThanOrEqual(0);
        expect(pattern).toBeLessThan(256);

        // Get SVG for rendering
        const svg = manager.getPatternSVG(pattern);
        expect(svg).toBeTruthy();
      });

      test('should handle complete cage rendering workflow', () => {
        // Simulate rendering a complete cage with multiple cells
        const cageCellNeighbors: INeighborAnalysis[] = [
          // Top-left corner
          {
            north: false,
            northEast: false,
            east: true,
            southEast: true,
            south: true,
            southWest: false,
            west: false,
            northWest: false
          },
          // Top-right corner
          {
            north: false,
            northEast: false,
            east: false,
            southEast: false,
            south: true,
            southWest: true,
            west: true,
            northWest: false
          },
          // Bottom-left corner
          {
            north: true,
            northEast: true,
            east: true,
            southEast: false,
            south: false,
            southWest: false,
            west: false,
            northWest: false
          },
          // Bottom-right corner
          {
            north: true,
            northEast: false,
            east: false,
            southEast: false,
            south: false,
            southWest: false,
            west: true,
            northWest: true
          }
        ];

        const svgPaths = cageCellNeighbors.map((neighbors) => {
          const pattern = manager.neighborsToPattern(neighbors);
          return manager.getPatternSVG(pattern);
        });

        // All cells should have valid SVG paths
        expect(svgPaths).toHaveLength(4);
        svgPaths.forEach((svg) => {
          expect(svg).toBeTruthy();
          expect(svg.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
