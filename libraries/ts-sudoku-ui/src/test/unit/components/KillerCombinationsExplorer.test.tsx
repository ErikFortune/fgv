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

// Mock the hooks and child components (must be before imports)
jest.mock('../../../hooks/useResponsiveLayout');
jest.mock('../../../hooks/useKillerCombinations');
jest.mock('../../../hooks/useCombinationElimination');
jest.mock('../../../components/KillerCombinationsPanel');
jest.mock('../../../components/KillerCombinationsModal');

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@fgv/ts-utils-jest';
import { KillerCombinationsExplorer } from '../../../components/KillerCombinationsExplorer';
import { ICage } from '@fgv/ts-sudoku-lib';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { useKillerCombinations } from '../../../hooks/useKillerCombinations';
import { useCombinationElimination } from '../../../hooks/useCombinationElimination';
import { KillerCombinationsPanel } from '../../../components/KillerCombinationsPanel';
import { KillerCombinationsModal } from '../../../components/KillerCombinationsModal';
import { succeed, fail } from '@fgv/ts-utils';

const mockUseResponsiveLayout = useResponsiveLayout as jest.MockedFunction<typeof useResponsiveLayout>;
const mockUseKillerCombinations = useKillerCombinations as jest.MockedFunction<typeof useKillerCombinations>;
const mockUseCombinationElimination = useCombinationElimination as jest.MockedFunction<
  typeof useCombinationElimination
>;
const mockKillerCombinationsPanel = KillerCombinationsPanel as jest.MockedFunction<
  typeof KillerCombinationsPanel
>;
const mockKillerCombinationsModal = KillerCombinationsModal as jest.MockedFunction<
  typeof KillerCombinationsModal
>;

describe('KillerCombinationsExplorer', () => {
  const createMockCage = (numCells: number = 2, total: number = 5, id: string = 'test-cage-1'): ICage => ({
    id: id as unknown as ICage['id'],
    cageType: 'killer',
    numCells,
    total,
    cellIds: Array.from({ length: numCells }, (__unused, i) => `cell-${i}` as unknown as ICage['cellIds'][0]),
    containsCell: jest.fn(() => false)
  });

  const mockToggleElimination = jest.fn();
  const mockOnClose = jest.fn();

  const defaultCombinations = [
    { combination: [1, 4], signature: '1,4', isEliminated: false },
    { combination: [2, 3], signature: '2,3', isEliminated: false }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseResponsiveLayout.mockReturnValue({
      deviceType: 'desktop',
      orientation: 'landscape',
      keypadLayoutMode: 'hidden',
      screenWidth: 1200,
      screenHeight: 800,
      isTouchDevice: false,
      isSmallScreen: false,
      hasSpaceForDualKeypads: true
    });

    mockUseKillerCombinations.mockReturnValue(succeed(defaultCombinations));

    mockUseCombinationElimination.mockReturnValue({
      eliminatedSignatures: new Set(),
      toggleElimination: mockToggleElimination,
      clearAll: jest.fn()
    });

    mockKillerCombinationsPanel.mockImplementation(({ cage }) => (
      <div data-testid="panel-mock">Panel: {cage.id}</div>
    ));

    mockKillerCombinationsModal.mockImplementation(({ cage }) => (
      <div data-testid="modal-mock">Modal: {cage.id}</div>
    ));
  });

  describe('mode selection', () => {
    test('should render panel mode when screen width >= 1024px', () => {
      mockUseResponsiveLayout.mockReturnValue({
        deviceType: 'desktop',
        orientation: 'landscape',
        keypadLayoutMode: 'hidden',
        screenWidth: 1024,
        screenHeight: 768,
        isTouchDevice: false,
        isSmallScreen: false,
        hasSpaceForDualKeypads: true
      });

      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('panel-mock')).toBeInTheDocument();
      expect(screen.queryByTestId('modal-mock')).not.toBeInTheDocument();
    });

    test('should render modal mode when screen width < 1024px', () => {
      mockUseResponsiveLayout.mockReturnValue({
        deviceType: 'mobile',
        orientation: 'portrait',
        keypadLayoutMode: 'side-by-side',
        screenWidth: 768,
        screenHeight: 1024,
        isTouchDevice: true,
        isSmallScreen: true,
        hasSpaceForDualKeypads: true
      });

      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('modal-mock')).toBeInTheDocument();
      expect(screen.queryByTestId('panel-mock')).not.toBeInTheDocument();
    });

    test('should use custom mobile breakpoint when provided', () => {
      mockUseResponsiveLayout.mockReturnValue({
        deviceType: 'tablet',
        orientation: 'landscape',
        keypadLayoutMode: 'stacked',
        screenWidth: 900,
        screenHeight: 600,
        isTouchDevice: true,
        isSmallScreen: false,
        hasSpaceForDualKeypads: true
      });

      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
          mobileBreakpoint={800}
        />
      );

      // 900 >= 800, so should be panel mode
      expect(screen.getByTestId('panel-mock')).toBeInTheDocument();
    });

    test('should switch from panel to modal when screen width changes', () => {
      mockUseResponsiveLayout.mockReturnValue({
        deviceType: 'desktop',
        orientation: 'landscape',
        keypadLayoutMode: 'hidden',
        screenWidth: 1200,
        screenHeight: 800,
        isTouchDevice: false,
        isSmallScreen: false,
        hasSpaceForDualKeypads: true
      });

      const cage = createMockCage();
      const { rerender } = render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('panel-mock')).toBeInTheDocument();

      mockUseResponsiveLayout.mockReturnValue({
        deviceType: 'mobile',
        orientation: 'portrait',
        keypadLayoutMode: 'side-by-side',
        screenWidth: 768,
        screenHeight: 1024,
        isTouchDevice: true,
        isSmallScreen: true,
        hasSpaceForDualKeypads: true
      });

      rerender(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('modal-mock')).toBeInTheDocument();
      expect(screen.queryByTestId('panel-mock')).not.toBeInTheDocument();
    });
  });

  describe('rendering conditions', () => {
    test('should not render when isOpen is false', () => {
      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('panel-mock')).not.toBeInTheDocument();
      expect(screen.queryByTestId('modal-mock')).not.toBeInTheDocument();
    });

    test('should not render when selectedCage is null', () => {
      render(
        <KillerCombinationsExplorer
          selectedCage={null}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('panel-mock')).not.toBeInTheDocument();
      expect(screen.queryByTestId('modal-mock')).not.toBeInTheDocument();
    });

    test('should not render when combinations fail to load', () => {
      mockUseKillerCombinations.mockReturnValue(fail('Invalid cage configuration'));

      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('panel-mock')).not.toBeInTheDocument();
      expect(screen.queryByTestId('modal-mock')).not.toBeInTheDocument();
    });
  });

  describe('combinations and elimination state', () => {
    test('should fetch combinations for selected cage', () => {
      const cage = createMockCage(3, 10);
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(mockUseKillerCombinations).toHaveBeenCalledWith(cage);
    });

    test('should merge combinations with elimination state', () => {
      mockUseCombinationElimination.mockReturnValue({
        eliminatedSignatures: new Set(['1,4']),
        toggleElimination: mockToggleElimination,
        clearAll: jest.fn()
      });

      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Verify the mock was called with the correct combinations
      const callArgs = mockKillerCombinationsPanel.mock.calls[0][0];
      expect(callArgs.combinations).toEqual([
        { combination: [1, 4], signature: '1,4', isEliminated: true },
        { combination: [2, 3], signature: '2,3', isEliminated: false }
      ]);
    });

    test('should load elimination state with cage ID', () => {
      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(mockUseCombinationElimination).toHaveBeenCalledWith('puzzle-1', 'test-cage-1');
    });

    test('should handle missing puzzle ID', () => {
      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId={undefined}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(mockUseCombinationElimination).toHaveBeenCalledWith(undefined, 'test-cage-1');
    });

    test('should update combinations when cage changes', () => {
      const cage1 = createMockCage(2, 5);
      const cage2 = createMockCage(3, 10);

      const { rerender } = render(
        <KillerCombinationsExplorer
          selectedCage={cage1}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(mockUseKillerCombinations).toHaveBeenCalledWith(cage1);

      rerender(
        <KillerCombinationsExplorer
          selectedCage={cage2}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(mockUseKillerCombinations).toHaveBeenCalledWith(cage2);
    });
  });

  describe('props forwarding', () => {
    test('should forward all props to Panel component', () => {
      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
          className="custom-explorer-class"
        />
      );

      const callArgs = mockKillerCombinationsPanel.mock.calls[0][0];
      expect(callArgs.cage).toBe(cage);
      expect(callArgs.onToggle).toBe(mockToggleElimination);
      expect(callArgs.onClose).toBe(mockOnClose);
      expect(callArgs.isOpen).toBe(true);
      expect(callArgs.className).toBe('custom-explorer-class');
      expect(Array.isArray(callArgs.combinations)).toBe(true);
    });

    test('should forward all props to Modal component', () => {
      mockUseResponsiveLayout.mockReturnValue({
        deviceType: 'mobile',
        orientation: 'portrait',
        keypadLayoutMode: 'side-by-side',
        screenWidth: 500,
        screenHeight: 800,
        isTouchDevice: true,
        isSmallScreen: true,
        hasSpaceForDualKeypads: true
      });

      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
          className="custom-explorer-class"
        />
      );

      const callArgs = mockKillerCombinationsModal.mock.calls[0][0];
      expect(callArgs.cage).toBe(cage);
      expect(callArgs.onToggle).toBe(mockToggleElimination);
      expect(callArgs.onClose).toBe(mockOnClose);
      expect(callArgs.isOpen).toBe(true);
      expect(callArgs.className).toBe('custom-explorer-class');
      expect(Array.isArray(callArgs.combinations)).toBe(true);
    });

    test('should pass toggleElimination from elimination hook', () => {
      const customToggle = jest.fn();
      mockUseCombinationElimination.mockReturnValue({
        eliminatedSignatures: new Set(),
        toggleElimination: customToggle,
        clearAll: jest.fn()
      });

      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const callArgs = mockKillerCombinationsPanel.mock.calls[0][0];
      expect(callArgs.onToggle).toBe(customToggle);
    });
  });

  describe('edge cases', () => {
    test('should handle cage with empty combinations list', () => {
      mockUseKillerCombinations.mockReturnValue(succeed([]));

      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const callArgs = mockKillerCombinationsPanel.mock.calls[0][0];
      expect(callArgs.combinations).toEqual([]);
    });

    test('should handle all combinations being eliminated', () => {
      mockUseCombinationElimination.mockReturnValue({
        eliminatedSignatures: new Set(['1,4', '2,3']),
        toggleElimination: mockToggleElimination,
        clearAll: jest.fn()
      });

      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const callArgs = mockKillerCombinationsPanel.mock.calls[0][0];
      expect(callArgs.combinations).toEqual([
        { combination: [1, 4], signature: '1,4', isEliminated: true },
        { combination: [2, 3], signature: '2,3', isEliminated: true }
      ]);
    });

    test('should handle transition from closed to open', () => {
      const cage = createMockCage();
      const { rerender } = render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={false}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('panel-mock')).not.toBeInTheDocument();

      rerender(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('panel-mock')).toBeInTheDocument();
    });

    test('should handle cage selection change while open', () => {
      const cage1 = createMockCage(2, 5, 'cage-1');
      const cage2 = createMockCage(3, 10, 'cage-2');

      const { rerender } = render(
        <KillerCombinationsExplorer
          selectedCage={cage1}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/cage-1/)).toBeInTheDocument();

      rerender(
        <KillerCombinationsExplorer
          selectedCage={cage2}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/cage-2/)).toBeInTheDocument();
    });

    test('should handle breakpoint exactly at threshold', () => {
      mockUseResponsiveLayout.mockReturnValue({
        deviceType: 'desktop',
        orientation: 'landscape',
        keypadLayoutMode: 'hidden',
        screenWidth: 1024,
        screenHeight: 768,
        isTouchDevice: false,
        isSmallScreen: false,
        hasSpaceForDualKeypads: true
      });

      const cage = createMockCage();
      render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
          mobileBreakpoint={1024}
        />
      );

      // 1024 >= 1024, should be panel
      expect(screen.getByTestId('panel-mock')).toBeInTheDocument();
    });
  });

  describe('memoization', () => {
    test('should memoize combinations display when elimination state unchanged', () => {
      const cage = createMockCage();
      const { rerender } = render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const firstCall = mockKillerCombinationsPanel.mock.calls[0][0].combinations;

      rerender(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const secondCall = mockKillerCombinationsPanel.mock.calls[1][0].combinations;

      // Should be the same array reference due to useMemo
      expect(firstCall).toBe(secondCall);
    });

    test('should recalculate combinations when elimination state changes', () => {
      mockUseCombinationElimination.mockReturnValue({
        eliminatedSignatures: new Set(),
        toggleElimination: mockToggleElimination,
        clearAll: jest.fn()
      });

      const cage = createMockCage();
      const { rerender } = render(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const firstCall = mockKillerCombinationsPanel.mock.calls[0][0].combinations;

      mockUseCombinationElimination.mockReturnValue({
        eliminatedSignatures: new Set(['1,4']),
        toggleElimination: mockToggleElimination,
        clearAll: jest.fn()
      });

      rerender(
        <KillerCombinationsExplorer
          selectedCage={cage}
          puzzleId="puzzle-1"
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const secondCall = mockKillerCombinationsPanel.mock.calls[1][0].combinations;

      // Should be different arrays
      expect(firstCall).not.toBe(secondCall);
      expect(secondCall[0].isEliminated).toBe(true);
    });
  });
});
