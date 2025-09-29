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

import React, { useMemo } from 'react';
import { CellId } from '@fgv/ts-sudoku-lib';
import { ICageOverlayProps } from '../types';
import { CageSumIndicator } from './CageSumIndicator';
import { CagePatternManager } from '../utils/CagePatternManager';
import { CageLookupManager } from '../utils/CageLookupManager';

/**
 * Helper to get cell position from CellId
 */
function getCellPosition(cellId: CellId): { row: number; col: number } {
  // CellId format is like "A1" where A is row (A=0, B=1, etc.) and 1 is column (1=0, 2=1, etc.)
  if (cellId.length >= 2) {
    const rowChar = cellId.charAt(0);
    const colStr = cellId.substring(1);

    // Convert letter to row number (A=0, B=1, etc.)
    const row = rowChar.charCodeAt(0) - 'A'.charCodeAt(0);

    // Convert number to column number (1-based to 0-based)
    const col = parseInt(colStr, 10) - 1;

    if (!isNaN(row) && !isNaN(col) && row >= 0 && row <= 8 && col >= 0 && col <= 8) {
      return { row, col };
    }
  }

  // Fallback - should not happen with valid CellIds
  console.warn(`Invalid CellId format: ${cellId}`);
  return { row: 0, col: 0 };
}

/**
 * Helper to get the top-left cell position for sum indicator placement
 */
function getTopLeftPosition(cellIds: CellId[]): { top: number; left: number } {
  if (cellIds.length === 0) return { top: 0, left: 0 };

  const positions = cellIds.map(getCellPosition);

  // Find the top-left most cell
  let minRow = positions[0].row;
  let minCol = positions[0].col;

  positions.forEach(({ row, col }) => {
    if (row < minRow || (row === minRow && col < minCol)) {
      minRow = row;
      minCol = col;
    }
  });

  // Convert grid coordinates to percentage-based positioning
  // Grid is 9x9, so each cell is ~11.11% wide and high
  const cellWidthPercent = 100 / 9;
  const cellHeightPercent = 100 / 9;

  return {
    top: minRow * cellHeightPercent + 0.5, // Small offset from corner
    left: minCol * cellWidthPercent + 0.5 // Small offset from corner
  };
}

/**
 * Component for rendering cage boundaries and sum indicators in Killer Sudoku
 * @public
 */
export const CageOverlay: React.FC<ICageOverlayProps> = ({ cages, gridSize, cellSize, className }) => {
  // Debug logging
  console.log('CageOverlay rendered with:', {
    cageCount: cages.length,
    gridSize,
    cellSize,
    cages: cages.map((c) => ({ id: c.cage.id, cellIds: c.cage.cellIds }))
  });

  // Initialize managers once
  const patternManager = useMemo(() => new CagePatternManager(), []);
  const lookupManager = useMemo(() => CageLookupManager.getInstance(), []);

  // Calculate SVG viewBox and class names
  const viewBox = `0 0 ${gridSize.width} ${gridSize.height}`;

  const overlayClasses = useMemo(() => {
    const classes = ['cage-overlay'];
    if (className) classes.push(className);
    return classes.join(' ');
  }, [className]);

  return (
    <div
      className={`
        ${overlayClasses}
        absolute inset-0 w-full h-full pointer-events-none
      `}
      style={{ zIndex: 1000 }}
      data-testid="cage-overlay"
    >
      {/* SVG for cage boundaries using connected border system */}
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        className="absolute inset-0"
        preserveAspectRatio="none"
      >
        {/* Render connected cage borders using two-stage lookup */}
        {cages.map((cageInfo, index) => {
          const { cage, isHighlighted, isValid } = cageInfo;

          // Build occupied cells set for this cage
          const occupiedCells = patternManager.buildOccupiedCellsSet(cage.cellIds);

          // Render each cell with connected borders
          return cage.cellIds.map((cellId, cellIndex) => {
            const { row, col } = getCellPosition(cellId);
            const x = col * cellSize;
            const y = row * cellSize;

            // Analyze neighbors and get pattern
            const neighbors = patternManager.analyzeNeighbors(cellId, occupiedCells);
            const neighborPattern = lookupManager.neighborsToPattern(neighbors);
            const pathData = lookupManager.getPatternSVG(neighborPattern);

            // Skip if no path data
            if (!pathData) {
              return null;
            }

            // Render connected border pattern
            return (
              <g
                key={`${cage.id || index}-${cellIndex}`}
                transform={`translate(${x}, ${y}) scale(${cellSize})`}
              >
                <path
                  d={pathData}
                  stroke={isHighlighted ? '#1e40af' : isValid ? '#2563eb' : '#dc2626'}
                  strokeWidth={0.8 / cellSize}
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity="1.0"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          });
        })}
      </svg>

      {/* Sum indicators */}
      {cages.map((cageInfo, index) => {
        const { cage, currentSum, isComplete, isValid } = cageInfo;
        const position = getTopLeftPosition(cage.cellIds);

        return (
          <CageSumIndicator
            key={cage.id || index}
            cage={cage}
            currentSum={currentSum}
            isComplete={isComplete}
            isValid={isValid}
            position={position}
          />
        );
      })}
    </div>
  );
};
