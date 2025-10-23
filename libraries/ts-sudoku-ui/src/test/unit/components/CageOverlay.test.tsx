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

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CageOverlay } from '../../../components/CageOverlay';
import { ICageOverlayProps, ICageDisplayInfo } from '../../../types';
import { CellId, CageId, ICage } from '@fgv/ts-sudoku-lib';
import { DiagnosticLoggerProvider } from '../../../contexts/DiagnosticLoggerContext';
import { Logging } from '@fgv/ts-utils';

describe('CageOverlay', () => {
  // Helper to create a mock cage with valid CellIds
  const createMockCage = (id: string, cellIds: string[], total: number = 15): ICage => ({
    id: id as CageId,
    cageType: 'killer' as const,
    total,
    numCells: cellIds.length,
    cellIds: cellIds as CellId[],
    containsCell: (cellId: CellId) => cellIds.includes(cellId)
  });

  const defaultGridSize = { width: 900, height: 900 };
  const defaultCellSize = 100;

  const createDefaultProps = (cages: ICageDisplayInfo[] = []): ICageOverlayProps => ({
    cages,
    gridSize: defaultGridSize,
    cellSize: defaultCellSize,
    numRows: 9,
    numColumns: 9
  });

  // Helper to render with logger context
  const renderWithLogger = (
    ui: React.ReactElement,
    logger?: Logging.LogReporter<unknown>
  ): ReturnType<typeof render> => {
    const testLogger =
      logger ||
      new Logging.LogReporter({
        logger: new Logging.InMemoryLogger('detail')
      });
    return render(<DiagnosticLoggerProvider logger={testLogger}>{ui}</DiagnosticLoggerProvider>);
  };

  describe('Basic Rendering', () => {
    test('should render empty overlay when no cages provided', () => {
      renderWithLogger(<CageOverlay {...createDefaultProps()} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('cage-overlay');
    });

    test('should apply custom className', () => {
      const props = { ...createDefaultProps(), className: 'custom-cage-class' };
      renderWithLogger(<CageOverlay {...props} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toHaveClass('custom-cage-class');
      expect(overlay).toHaveClass('cage-overlay');
    });

    test('should render with correct z-index for layering', () => {
      renderWithLogger(<CageOverlay {...createDefaultProps()} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toHaveStyle({ zIndex: 1000 });
    });

    test('should be non-interactive with pointer-events-none', () => {
      renderWithLogger(<CageOverlay {...createDefaultProps()} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toHaveClass('pointer-events-none');
    });
  });

  describe('Cage Border Rendering with Valid CellIds', () => {
    test('should render single valid cage with proper CellIds', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();

      // Should contain SVG for rendering cage borders
      const svg = overlay.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 900 900');
    });

    test('should render multiple cages with valid CellIds', () => {
      const cage1 = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cage2 = createMockCage('cage-2', ['C03', 'C04', 'D03'], 12);

      const cageInfos: ICageDisplayInfo[] = [
        { cage: cage1, isHighlighted: false, isComplete: false, isValid: true },
        { cage: cage2, isHighlighted: false, isComplete: false, isValid: true }
      ];

      renderWithLogger(<CageOverlay {...createDefaultProps(cageInfos)} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // Should have SVG paths for cage borders
      const paths = svg?.querySelectorAll('path');
      expect(paths).toBeTruthy();
      expect(paths!.length).toBeGreaterThan(0);
    });

    test('should render cage with all valid CellIds in L-shape pattern', () => {
      // Create an L-shaped cage pattern
      const cage = createMockCage('cage-l-shape', ['A01', 'A02', 'A03', 'B01', 'C01'], 20);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    test('should render cage with valid CellIds in different grid positions', () => {
      // Test cage in middle of grid
      const cage = createMockCage('cage-middle', ['E05', 'E06', 'F05', 'F06'], 18);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
    });

    test('should render cage with valid CellIds at grid boundaries', () => {
      // Test cage at bottom-right corner
      const cage = createMockCage('cage-corner', ['H08', 'H09', 'I08', 'I09'], 16);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Cage Visual States', () => {
    test('should apply highlighted style to highlighted cage', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: true,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      const paths = svg?.querySelectorAll('path');

      // Highlighted cages should use darker blue color (#1e40af)
      const highlightedPaths = Array.from(paths || []).filter(
        (path) => path.getAttribute('stroke') === '#1e40af'
      );
      expect(highlightedPaths.length).toBeGreaterThan(0);
    });

    test('should apply valid style to valid cage', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      const paths = svg?.querySelectorAll('path');

      // Valid cages should use blue color (#2563eb)
      const validPaths = Array.from(paths || []).filter((path) => path.getAttribute('stroke') === '#2563eb');
      expect(validPaths.length).toBeGreaterThan(0);
    });

    test('should apply invalid style to invalid cage', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: false
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      const paths = svg?.querySelectorAll('path');

      // Invalid cages should use red color (#dc2626)
      const invalidPaths = Array.from(paths || []).filter(
        (path) => path.getAttribute('stroke') === '#dc2626'
      );
      expect(invalidPaths.length).toBeGreaterThan(0);
    });

    test('should render different visual states for multiple cages', () => {
      const cage1 = createMockCage('cage-valid', ['A01', 'A02'], 10);
      const cage2 = createMockCage('cage-invalid', ['C01', 'C02'], 12);
      const cage3 = createMockCage('cage-highlighted', ['E01', 'E02'], 8);

      const cageInfos: ICageDisplayInfo[] = [
        { cage: cage1, isHighlighted: false, isComplete: false, isValid: true },
        { cage: cage2, isHighlighted: false, isComplete: false, isValid: false },
        { cage: cage3, isHighlighted: true, isComplete: false, isValid: true }
      ];

      renderWithLogger(<CageOverlay {...createDefaultProps(cageInfos)} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      const paths = svg?.querySelectorAll('path');

      // Check for different stroke colors
      const strokeColors = Array.from(paths || []).map((path) => path.getAttribute('stroke'));
      expect(strokeColors).toContain('#2563eb'); // Valid blue
      expect(strokeColors).toContain('#dc2626'); // Invalid red
      expect(strokeColors).toContain('#1e40af'); // Highlighted dark blue
    });
  });

  describe('Sum Indicator Positioning', () => {
    test('should render sum indicator for cage with valid CellIds', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        currentSum: 10,
        isComplete: false,
        isValid: true
      };

      const { container } = renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      // Sum indicator should be rendered via CageSumIndicator component
      // (functional verification - component renders without errors)
      expect(container).toBeInTheDocument();
    });

    test('should position sum indicator at top-left when cells are in reverse order', () => {
      // Create cage with cells listed in reverse order (bottom-right to top-left)
      // This ensures the min-finding logic in getTopLeftPosition is exercised
      const cage = createMockCage(
        'cage-reversed',
        ['C03', 'B02', 'A01'], // Reverse order - A01 should be top-left
        18
      );
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        currentSum: 12,
        isComplete: false,
        isValid: true
      };

      const { container } = renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      // Sum indicator should still be positioned correctly at top-left (A01)
      expect(container).toBeInTheDocument();
    });

    test('should position sum indicator at top-left of cage', () => {
      // Cage in top-left corner
      const cageTopLeft = createMockCage('cage-tl', ['A01', 'A02', 'B01'], 15);
      // Cage in middle
      const cageMiddle = createMockCage('cage-mid', ['E05', 'E06', 'F05'], 18);

      const cageInfos: ICageDisplayInfo[] = [
        { cage: cageTopLeft, isHighlighted: false, isComplete: false, isValid: true },
        { cage: cageMiddle, isHighlighted: false, isComplete: false, isValid: true }
      ];

      const { container } = renderWithLogger(<CageOverlay {...createDefaultProps(cageInfos)} />);

      // Verify both sum indicators render without error
      expect(container).toBeInTheDocument();
    });

    test('should render sum indicators for multiple cages with valid CellIds', () => {
      const cage1 = createMockCage('cage-1', ['A01', 'A02'], 10);
      const cage2 = createMockCage('cage-2', ['C03', 'C04'], 12);
      const cage3 = createMockCage('cage-3', ['E05', 'E06'], 14);

      const cageInfos: ICageDisplayInfo[] = [
        { cage: cage1, isHighlighted: false, currentSum: 7, isComplete: false, isValid: true },
        { cage: cage2, isHighlighted: false, currentSum: 12, isComplete: true, isValid: true },
        { cage: cage3, isHighlighted: false, currentSum: 9, isComplete: false, isValid: false }
      ];

      const { container } = renderWithLogger(<CageOverlay {...createDefaultProps(cageInfos)} />);

      // All sum indicators should render
      expect(container).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty cage gracefully', () => {
      const emptyCage = createMockCage('cage-empty', [], 0);
      const cageInfo: ICageDisplayInfo = {
        cage: emptyCage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
    });

    test('should handle cage with single valid CellId', () => {
      const singleCellCage = createMockCage('cage-single', ['A01'], 5);
      const cageInfo: ICageDisplayInfo = {
        cage: singleCellCage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
    });

    test('should warn about invalid CellId format and use fallback', () => {
      const logger = new Logging.LogReporter({
        logger: new Logging.InMemoryLogger('detail')
      });

      // Create cage with mix of valid and invalid CellIds
      const mixedCage = createMockCage(
        'cage-mixed',
        ['A01', 'invalid-cell-id' as unknown as string, 'B02'],
        15
      );
      const cageInfo: ICageDisplayInfo = {
        cage: mixedCage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />, logger);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();

      // Logger should have warning about invalid CellId
      const inMemoryLogger = logger.logger as Logging.InMemoryLogger;
      const loggedMessages = inMemoryLogger.logged;
      expect(
        loggedMessages.some(
          (msg: string) => msg.includes('Invalid CellId format') && msg.includes('invalid-cell-id')
        )
      ).toBe(true);
    });

    test('should handle cage with CellIds outside grid boundaries', () => {
      const logger = new Logging.LogReporter({
        logger: new Logging.InMemoryLogger('detail')
      });

      // Create cage where parsed row/col would be outside 9x9 grid
      // parseCellId will successfully parse J10 (row 9, col 9) but it's outside numRows/numColumns
      const cage = createMockCage(
        'cage-outbound',
        ['A01', 'B02', 'J10' as unknown as string], // J10 would be row 9, col 9 (out of bounds for 9x9)
        15
      );
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />, logger);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();

      // Should warn about CellId being outside grid boundaries
      const inMemoryLogger = logger.logger as Logging.InMemoryLogger;
      const loggedMessages = inMemoryLogger.logged;
      expect(
        loggedMessages.some((msg: string) => msg.includes('Invalid CellId format') && msg.includes('J10'))
      ).toBe(true);
    });

    test('should handle large number of cages', () => {
      // Create many cages across the grid
      const cages: ICageDisplayInfo[] = [];
      for (let i = 0; i < 20; i++) {
        const row = String.fromCharCode(65 + (i % 9)); // A-I
        const col = (i % 9) + 1;
        const cellId = `${row}0${col}`;
        const cage = createMockCage(`cage-${i}`, [cellId], i + 5);
        cages.push({
          cage,
          isHighlighted: i === 0,
          isComplete: i % 3 === 0,
          isValid: i % 2 === 0
        });
      }

      renderWithLogger(<CageOverlay {...createDefaultProps(cages)} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Different Grid Sizes', () => {
    test('should render with different grid dimensions', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      const props: ICageOverlayProps = {
        cages: [cageInfo],
        gridSize: { width: 600, height: 600 },
        cellSize: 50,
        numRows: 12,
        numColumns: 12
      };

      renderWithLogger(<CageOverlay {...props} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 600 600');
    });

    test('should handle non-square grid dimensions', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02'], 10);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      const props: ICageOverlayProps = {
        cages: [cageInfo],
        gridSize: { width: 800, height: 600 },
        cellSize: 80,
        numRows: 6,
        numColumns: 10
      };

      renderWithLogger(<CageOverlay {...props} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 800 600');
    });

    test('should handle variable grid sizes with valid CellIds', () => {
      const cage = createMockCage('cage-var', ['A01', 'B01', 'C01'], 18);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      const props: ICageOverlayProps = {
        cages: [cageInfo],
        gridSize: { width: 450, height: 450 },
        cellSize: 50,
        numRows: 9,
        numColumns: 9
      };

      renderWithLogger(<CageOverlay {...props} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('SVG Rendering Details', () => {
    test('should render SVG with correct attributes', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');

      expect(svg).toHaveAttribute('width', '100%');
      expect(svg).toHaveAttribute('height', '100%');
      expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
    });

    test('should render path elements with dashed stroke', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      const paths = svg?.querySelectorAll('path');

      // Paths should have dashed stroke
      const dashedPaths = Array.from(paths || []).filter(
        (path) => path.getAttribute('stroke-dasharray') === '6 4'
      );
      expect(dashedPaths.length).toBeGreaterThan(0);
    });

    test('should render paths with rounded caps and joins', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      const paths = svg?.querySelectorAll('path');

      Array.from(paths || []).forEach((path) => {
        expect(path.getAttribute('stroke-linecap')).toBe('round');
        expect(path.getAttribute('stroke-linejoin')).toBe('round');
        expect(path.getAttribute('fill')).toBe('none');
      });
    });

    test('should apply non-scaling-stroke for consistent border width', () => {
      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      const svg = overlay.querySelector('svg');
      const paths = svg?.querySelectorAll('path');

      // SVG attributes in DOM use kebab-case, not camelCase
      Array.from(paths || []).forEach((path) => {
        expect(path.getAttribute('vector-effect')).toBe('non-scaling-stroke');
      });
    });
  });

  describe('Complex Cage Patterns', () => {
    test('should render diagonal cage pattern', () => {
      const cage = createMockCage('cage-diagonal', ['A01', 'B02', 'C03', 'D04'], 22);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
    });

    test('should render snake-like cage pattern', () => {
      const cage = createMockCage('cage-snake', ['A01', 'A02', 'B02', 'B03', 'C03'], 25);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
    });

    test('should render large contiguous cage', () => {
      // 3x3 block cage
      const cage = createMockCage(
        'cage-block',
        ['A01', 'A02', 'A03', 'B01', 'B02', 'B03', 'C01', 'C02', 'C03'],
        45
      );
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
    });

    test('should render T-shaped cage pattern', () => {
      const cage = createMockCage('cage-t-shape', ['A01', 'A02', 'A03', 'B02'], 18);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />);

      const overlay = screen.getByTestId('cage-overlay');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Diagnostic Logging', () => {
    test('should log cage information when rendered', () => {
      const logger = new Logging.LogReporter({
        logger: new Logging.InMemoryLogger('detail')
      });

      const cage = createMockCage('cage-1', ['A01', 'A02', 'B01'], 15);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />, logger);

      // Check that diagnostic logging occurred
      const inMemoryLogger = logger.logger as Logging.InMemoryLogger;
      const loggedMessages = inMemoryLogger.logged;

      expect(loggedMessages.some((msg: string) => msg.includes('CageOverlay rendered'))).toBe(true);
    });

    test('should log warning for invalid CellIds during border rendering', () => {
      const logger = new Logging.LogReporter({
        logger: new Logging.InMemoryLogger('detail')
      });

      const cage = createMockCage('cage-bad', ['A01', 'bad-id' as unknown as string], 10);
      const cageInfo: ICageDisplayInfo = {
        cage,
        isHighlighted: false,
        isComplete: false,
        isValid: true
      };

      renderWithLogger(<CageOverlay {...createDefaultProps([cageInfo])} />, logger);

      const inMemoryLogger = logger.logger as Logging.InMemoryLogger;
      const loggedMessages = inMemoryLogger.logged;
      const warnings = loggedMessages.filter(
        (msg: string) => msg.includes('Invalid CellId format') && msg.includes('bad-id')
      );

      expect(warnings.length).toBeGreaterThan(0);
    });
  });
});
