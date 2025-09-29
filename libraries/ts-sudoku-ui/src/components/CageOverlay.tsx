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
 * Helper to calculate cage boundary path
 */
function calculateCageBoundary(cellIds: CellId[], cellSize: number): string {
  if (cellIds.length === 0) return '';

  // Convert cell IDs to grid positions
  const positions = cellIds.map(getCellPosition);

  // Create a set of occupied cells for quick lookup
  const occupiedCells = new Set(positions.map((pos) => `${pos.row},${pos.col}`));

  // For each cell, determine which borders to draw
  const segments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  positions.forEach(({ row, col }) => {
    const x = col * cellSize;
    const y = row * cellSize;

    // Inset borders by 10% from cell edges to draw inside the cell borders
    const inset = cellSize * 0.1;

    // Check top border
    if (!occupiedCells.has(`${row - 1},${col}`)) {
      segments.push({
        x1: x + inset,
        y1: y + inset,
        x2: x + cellSize - inset,
        y2: y + inset
      });
    }

    // Check bottom border
    if (!occupiedCells.has(`${row + 1},${col}`)) {
      segments.push({
        x1: x + inset,
        y1: y + cellSize - inset,
        x2: x + cellSize - inset,
        y2: y + cellSize - inset
      });
    }

    // Check left border
    if (!occupiedCells.has(`${row},${col - 1}`)) {
      segments.push({
        x1: x + inset,
        y1: y + inset,
        x2: x + inset,
        y2: y + cellSize - inset
      });
    }

    // Check right border
    if (!occupiedCells.has(`${row},${col + 1}`)) {
      segments.push({
        x1: x + cellSize - inset,
        y1: y + inset,
        x2: x + cellSize - inset,
        y2: y + cellSize - inset
      });
    }
  });

  // Convert segments to SVG path
  return segments.map((seg) => `M${seg.x1},${seg.y1}L${seg.x2},${seg.y2}`).join(' ');
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
      {/* SVG for cage boundaries */}
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        className="absolute inset-0"
        preserveAspectRatio="none"
      >
        {cages.map((cageInfo, index) => {
          const { cage, isHighlighted, isValid } = cageInfo;
          const pathData = calculateCageBoundary(cage.cellIds, cellSize);

          if (!pathData) return null;

          return (
            <g key={cage.id || index}>
              <path
                d={pathData}
                stroke={isHighlighted ? '#1e40af' : isValid ? '#2563eb' : '#dc2626'}
                strokeWidth="0.8"
                strokeDasharray="1.2 0.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity="1.0"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
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
