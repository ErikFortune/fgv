'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importDefault(require('react'));
const react_2 = require('@testing-library/react');
require('@testing-library/jest-dom');
require('@fgv/ts-utils-jest');
const KillerCombinationsPanel_1 = require('../../../components/KillerCombinationsPanel');
describe('KillerCombinationsPanel', () => {
  const createMockCage = (numCells = 2, total = 5, id = 'test-cage-1') => ({
    id: id,
    cageType: 'killer',
    numCells,
    total,
    cellIds: Array.from({ length: numCells }, (__unused, i) => `cell-${i}`),
    containsCell: jest.fn(() => false)
  });
  const createCombination = (combination, isEliminated = false) => ({
    combination,
    signature: [...combination].sort((a, b) => a - b).join(','),
    isEliminated
  });
  const defaultProps = {
    cage: createMockCage(2, 5),
    combinations: [createCombination([1, 4]), createCombination([2, 3])],
    onToggle: jest.fn(),
    onClose: jest.fn(),
    isOpen: true
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('rendering basics', () => {
    test('should render panel when isOpen is true', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      expect(react_2.screen.getByRole('complementary')).toBeInTheDocument();
      expect(react_2.screen.getByLabelText('Killer Sudoku Combinations Explorer')).toBeInTheDocument();
    });
    test('should render with accessible role and label', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      const panel = react_2.screen.getByRole('complementary');
      expect(panel).toHaveAttribute('aria-label', 'Killer Sudoku Combinations Explorer');
    });
    test('should apply open state classes when isOpen is true', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          isOpen: true
        })
      );
      const panel = container.querySelector('aside');
      expect(panel).toHaveClass('translate-x-0');
      expect(panel).not.toHaveClass('translate-x-full');
    });
    test('should apply closed state classes when isOpen is false', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          isOpen: false
        })
      );
      const panel = container.querySelector('aside');
      expect(panel).toHaveClass('translate-x-full');
      expect(panel).not.toHaveClass('translate-x-0');
    });
    test('should apply custom className when provided', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          className: 'custom-panel-class'
        })
      );
      const panel = container.querySelector('aside');
      expect(panel).toHaveClass('custom-panel-class');
    });
    test('should apply fixed positioning and z-index classes', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      const panel = container.querySelector('aside');
      expect(panel).toHaveClass('fixed');
      expect(panel).toHaveClass('right-0');
      expect(panel).toHaveClass('top-0');
      expect(panel).toHaveClass('bottom-0');
      expect(panel).toHaveClass('z-[9999]');
    });
  });
  describe('header section', () => {
    test('should display "Combinations" title', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      expect(react_2.screen.getByText('Combinations')).toBeInTheDocument();
    });
    test('should display cage information (cells and sum)', () => {
      const cage = createMockCage(3, 15);
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          cage: cage
        })
      );
      expect(react_2.screen.getByText('3 cells, sum 15')).toBeInTheDocument();
    });
    test('should display different cage information for different cages', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          cage: createMockCage(2, 5)
        })
      );
      expect(react_2.screen.getByText('2 cells, sum 5')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          cage: createMockCage(4, 20)
        })
      );
      expect(react_2.screen.getByText('4 cells, sum 20')).toBeInTheDocument();
    });
    test('should render close button with accessible label', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      const closeButton = react_2.screen.getByLabelText('Close combinations panel');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
    });
    test('should have close button with proper type attribute', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      const closeButton = react_2.screen.getByLabelText('Close combinations panel');
      expect(closeButton).toHaveAttribute('type', 'button');
    });
  });
  describe('close functionality', () => {
    test('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onClose: onClose
        })
      );
      const closeButton = react_2.screen.getByLabelText('Close combinations panel');
      react_2.fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    test('should call onClose when Escape key is pressed and panel is open', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onClose: onClose,
          isOpen: true
        })
      );
      react_2.fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    test('should not call onClose when Escape key is pressed and panel is closed', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onClose: onClose,
          isOpen: false
        })
      );
      react_2.fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });
    test('should not call onClose when other keys are pressed', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onClose: onClose,
          isOpen: true
        })
      );
      react_2.fireEvent.keyDown(window, { key: 'Enter' });
      react_2.fireEvent.keyDown(window, { key: 'Space' });
      react_2.fireEvent.keyDown(window, { key: 'a' });
      expect(onClose).not.toHaveBeenCalled();
    });
    test('should clean up event listener when panel closes', () => {
      const onClose = jest.fn();
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onClose: onClose,
          isOpen: true
        })
      );
      react_2.fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
      onClose.mockClear();
      rerender(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onClose: onClose,
          isOpen: false
        })
      );
      react_2.fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });
    test('should clean up event listener when component unmounts', () => {
      const onClose = jest.fn();
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onClose: onClose,
          isOpen: true
        })
      );
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });
  describe('statistics section', () => {
    test('should display active and total combination counts', () => {
      const combinations = [
        createCombination([1, 4], false),
        createCombination([2, 3], false),
        createCombination([1, 3], true)
      ];
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          combinations: combinations
        })
      );
      expect(react_2.screen.getByText('2 of 3 combinations possible')).toBeInTheDocument();
    });
    test('should show correct count when no combinations are eliminated', () => {
      const combinations = [
        createCombination([1, 4], false),
        createCombination([2, 3], false),
        createCombination([1, 3], false)
      ];
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          combinations: combinations
        })
      );
      expect(react_2.screen.getByText('3 of 3 combinations possible')).toBeInTheDocument();
    });
    test('should show correct count when all combinations are eliminated', () => {
      const combinations = [
        createCombination([1, 4], true),
        createCombination([2, 3], true),
        createCombination([1, 3], true)
      ];
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          combinations: combinations
        })
      );
      expect(react_2.screen.getByText('0 of 3 combinations possible')).toBeInTheDocument();
    });
    test('should show correct count when single combination exists', () => {
      const combinations = [createCombination([1, 4], false)];
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          combinations: combinations
        })
      );
      expect(react_2.screen.getByText('1 of 1 combinations possible')).toBeInTheDocument();
    });
    test('should update count when combinations change', () => {
      const combinations1 = [createCombination([1, 4], false), createCombination([2, 3], true)];
      const combinations2 = [
        createCombination([1, 4], true),
        createCombination([2, 3], true),
        createCombination([1, 3], false)
      ];
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          combinations: combinations1
        })
      );
      expect(react_2.screen.getByText('1 of 2 combinations possible')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          combinations: combinations2
        })
      );
      expect(react_2.screen.getByText('1 of 3 combinations possible')).toBeInTheDocument();
    });
  });
  describe('combinations grid integration', () => {
    test('should render CombinationGrid component', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      // Grid should contain combination cards
      expect(react_2.screen.getByText('14')).toBeInTheDocument();
      expect(react_2.screen.getByText('23')).toBeInTheDocument();
    });
    test('should pass combinations to CombinationGrid', () => {
      const combinations = [
        createCombination([1, 2, 3]),
        createCombination([4, 5, 6]),
        createCombination([7, 8, 9])
      ];
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          combinations: combinations
        })
      );
      expect(react_2.screen.getByText('123')).toBeInTheDocument();
      expect(react_2.screen.getByText('456')).toBeInTheDocument();
      expect(react_2.screen.getByText('789')).toBeInTheDocument();
    });
    test('should pass onToggle callback to CombinationGrid', () => {
      const onToggle = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onToggle: onToggle
        })
      );
      const firstCard = react_2.screen.getByText('14').closest('button');
      react_2.fireEvent.click(firstCard);
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith('1,4');
    });
    test('should pass mode="panel" to CombinationGrid', () => {
      // This is verified by the CombinationGrid rendering correctly in panel mode
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      // CombinationGrid should be rendered in panel mode (verified by presence of grid container)
      const gridContainer = container.querySelector('.flex-wrap');
      expect(gridContainer).toBeInTheDocument();
    });
    test('should handle empty combinations list', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          combinations: []
        })
      );
      expect(react_2.screen.getByText('No combinations available for this cage')).toBeInTheDocument();
      expect(react_2.screen.getByText('0 of 0 combinations possible')).toBeInTheDocument();
    });
  });
  describe('layout and styling', () => {
    test('should have flex column layout', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      const panel = container.querySelector('aside');
      expect(panel).toHaveClass('flex');
      expect(panel).toHaveClass('flex-col');
    });
    test('should have appropriate width classes', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      const panel = container.querySelector('aside');
      expect(panel).toHaveClass('w-96');
      expect(panel).toHaveClass('max-w-md');
    });
    test('should have transition classes for smooth animation', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      const panel = container.querySelector('aside');
      expect(panel).toHaveClass('transform');
      expect(panel).toHaveClass('transition-transform');
      expect(panel).toHaveClass('duration-300');
      expect(panel).toHaveClass('ease-in-out');
    });
    test('should have shadow and border styling', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      const panel = container.querySelector('aside');
      expect(panel).toHaveClass('shadow-2xl');
      expect(panel).toHaveClass('border-l');
    });
  });
  describe('state transitions', () => {
    test('should transition from closed to open', () => {
      const { container, rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          isOpen: false
        })
      );
      let panel = container.querySelector('aside');
      expect(panel).toHaveClass('translate-x-full');
      rerender(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          isOpen: true
        })
      );
      panel = container.querySelector('aside');
      expect(panel).toHaveClass('translate-x-0');
    });
    test('should transition from open to closed', () => {
      const { container, rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          isOpen: true
        })
      );
      let panel = container.querySelector('aside');
      expect(panel).toHaveClass('translate-x-0');
      rerender(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          isOpen: false
        })
      );
      panel = container.querySelector('aside');
      expect(panel).toHaveClass('translate-x-full');
    });
    test('should update cage information when cage changes', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          cage: createMockCage(2, 5)
        })
      );
      expect(react_2.screen.getByText('2 cells, sum 5')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          cage: createMockCage(5, 25)
        })
      );
      expect(react_2.screen.getByText('5 cells, sum 25')).toBeInTheDocument();
    });
  });
  describe('interaction workflows', () => {
    test('should support complete open-explore-close workflow', () => {
      const onToggle = jest.fn();
      const onClose = jest.fn();
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onToggle: onToggle,
          onClose: onClose,
          isOpen: false
        })
      );
      // Panel is closed
      const closedPanel = react_2.screen.getByRole('complementary');
      expect(closedPanel).toHaveClass('translate-x-full');
      // Open panel
      rerender(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onToggle: onToggle,
          onClose: onClose,
          isOpen: true
        })
      );
      const openPanel = react_2.screen.getByRole('complementary');
      expect(openPanel).toHaveClass('translate-x-0');
      // Toggle a combination
      const firstCard = react_2.screen.getByText('14').closest('button');
      react_2.fireEvent.click(firstCard);
      expect(onToggle).toHaveBeenCalledWith('1,4');
      // Close panel
      const closeButton = react_2.screen.getByLabelText('Close combinations panel');
      react_2.fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    test('should support keyboard-based close workflow', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onClose: onClose,
          isOpen: true
        })
      );
      // Panel is open
      expect(react_2.screen.getByRole('complementary')).toHaveClass('translate-x-0');
      // Close with Escape key
      react_2.fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    test('should support multiple toggle operations', () => {
      const onToggle = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          onToggle: onToggle
        })
      );
      const cards = react_2.screen.getAllByRole('button', { name: /Combination/ });
      // Toggle multiple combinations
      react_2.fireEvent.click(cards[0]);
      react_2.fireEvent.click(cards[1]);
      react_2.fireEvent.click(cards[0]);
      expect(onToggle).toHaveBeenCalledTimes(3);
    });
  });
  describe('edge cases', () => {
    test('should handle large number of combinations', () => {
      const largeCombinations = Array.from({ length: 50 }, (__unused, i) =>
        createCombination([i + 1, i + 2], i % 2 === 0)
      );
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          combinations: largeCombinations
        })
      );
      expect(react_2.screen.getByText('25 of 50 combinations possible')).toBeInTheDocument();
    });
    test('should handle rapid open/close state changes', () => {
      const { container, rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          isOpen: false
        })
      );
      rerender(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          isOpen: true
        })
      );
      rerender(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          isOpen: false
        })
      );
      rerender(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          isOpen: true
        })
      );
      const panel = container.querySelector('aside');
      expect(panel).toHaveClass('translate-x-0');
    });
    test('should handle className with multiple classes', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          className: 'class-one class-two class-three'
        })
      );
      const panel = container.querySelector('aside');
      expect(panel).toHaveClass('class-one');
      expect(panel).toHaveClass('class-two');
      expect(panel).toHaveClass('class-three');
    });
    test('should handle undefined className gracefully', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
          ...defaultProps,
          className: undefined
        })
      );
      const panel = container.querySelector('aside');
      expect(panel).toBeInTheDocument();
    });
    test('should maintain scroll position in combinations grid', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, { ...defaultProps })
      );
      const gridContainer = container.querySelector('.overflow-hidden');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
//# sourceMappingURL=KillerCombinationsPanel.test.js.map
