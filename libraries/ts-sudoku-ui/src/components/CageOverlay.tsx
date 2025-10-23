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

import React, { useMemo, useEffect } from 'react';
import { CellId, parseCellId } from '@fgv/ts-sudoku-lib';
import { ICageOverlayProps } from '../types';
import { CageSumIndicator } from './CageSumIndicator';
import { CagePatternManager } from '../utils/CagePatternManager';
import { CageLookupManager } from '../utils/CageLookupManager';
import { useDiagnosticLogger } from '../contexts/DiagnosticLoggerContext';
import { Logging } from '@fgv/ts-utils';

/**
 * Helper to get cell position from CellId
 */
function getTopLeftPosition(
  cellIds: CellId[],
  log: Logging.LogReporter<unknown, unknown>,
  numRows: number,
  numColumns: number
): { top: number; left: number } {
  if (cellIds.length === 0) return { top: 0, left: 0 };

  const positions = cellIds.map((cellId) => {
    const parsed = parseCellId(cellId);
    if (parsed && parsed.row >= 0 && parsed.row < numRows && parsed.col >= 0 && parsed.col < numColumns) {
      return parsed;
    }
    // Fallback - should not happen with valid CellIds
    log.warn(`Invalid CellId format: ${cellId}`);
    return { row: 0, col: 0 };
  });

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
  const cellWidthPercent = 100 / numColumns;
  const cellHeightPercent = 100 / numRows;

  return {
    top: minRow * cellHeightPercent + 0.5, // Small offset from corner
    left: minCol * cellWidthPercent + 0.5 // Small offset from corner
  };
}

/**
 * Component for rendering cage boundaries and sum indicators in Killer Sudoku
 * @public
 */
export const CageOverlay: React.FC<ICageOverlayProps> = ({
  cages,
  gridSize,
  cellSize,
  numRows = 9,
  numColumns = 9,
  className
}) => {
  const log = useDiagnosticLogger();

  // Initialize managers once
  const patternManager = useMemo(() => new CagePatternManager(), []);
  const lookupManager = useMemo(() => CageLookupManager.getInstance(), []);

  // Debug logging
  useEffect(() => {
    log.info('CageOverlay rendered', {
      cageCount: cages.length,
      gridSize,
      cellSize,
      cages: cages.map((c) => ({ id: c.cage.id, cellIds: c.cage.cellIds }))
    });
  }, [cages, gridSize, cellSize, log]);

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
            // Parse cell position using centralized function
            const parsed = parseCellId(cellId);
            let row = 0,
              col = 0;

            if (
              parsed &&
              parsed.row >= 0 &&
              parsed.row < numRows &&
              parsed.col >= 0 &&
              parsed.col < numColumns
            ) {
              row = parsed.row;
              col = parsed.col;
            } else {
              log.warn(`Invalid CellId format: ${cellId}`);
            }

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
                key={/* c8 ignore next 1 - defense in depth */ `${cage.id ?? index}-${cellIndex}`}
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
        const position = getTopLeftPosition(cage.cellIds, log, numRows, numColumns);

        return (
          <CageSumIndicator
            key={/* c8 ignore next 1 - defense in depth */ cage.id ?? index}
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
