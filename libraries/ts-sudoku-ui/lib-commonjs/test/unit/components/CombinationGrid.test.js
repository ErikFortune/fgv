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
const CombinationGrid_1 = require('../../../components/CombinationGrid');
describe('CombinationGrid', () => {
  const createCombination = (combination, isEliminated = false) => ({
    combination,
    signature: [...combination].sort((a, b) => a - b).join(','),
    isEliminated
  });
  const defaultProps = {
    combinations: [createCombination([1, 2]), createCombination([3, 4]), createCombination([5, 6])],
    onToggle: jest.fn(),
    mode: 'panel',
    className: undefined
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('rendering', () => {
    test('should render all combinations', () => {
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, { ...defaultProps })
      );
      expect(react_2.screen.getByText('12')).toBeInTheDocument();
      expect(react_2.screen.getByText('34')).toBeInTheDocument();
      expect(react_2.screen.getByText('56')).toBeInTheDocument();
    });
    test('should render as a flex container', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, { ...defaultProps })
      );
      const gridContainer = container.querySelector('.flex');
      expect(gridContainer).toBeInTheDocument();
    });
    test('should apply panel mode flex classes', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, { ...defaultProps, mode: 'panel' })
      );
      const gridContainer = container.querySelector('.flex');
      expect(gridContainer).toHaveClass('flex-wrap');
      expect(gridContainer).toHaveClass('gap-2');
    });
    test('should apply modal mode flex classes', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, { ...defaultProps, mode: 'modal' })
      );
      const gridContainer = container.querySelector('.flex');
      expect(gridContainer).toHaveClass('flex-wrap');
      expect(gridContainer).toHaveClass('gap-2');
    });
    test('should apply common container classes', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, { ...defaultProps })
      );
      const gridContainer = container.querySelector('.flex');
      expect(gridContainer).toHaveClass('gap-2');
      expect(gridContainer).toHaveClass('p-4');
      expect(gridContainer).toHaveClass('overflow-y-auto');
    });
    test('should apply custom className when provided', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          className: 'custom-grid-class'
        })
      );
      const gridContainer = container.querySelector('.flex');
      expect(gridContainer).toHaveClass('custom-grid-class');
    });
    test('should display empty state when no combinations', () => {
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: []
        })
      );
      expect(react_2.screen.getByText('No combinations available for this cage')).toBeInTheDocument();
    });
    test('should not render CombinationCards when no combinations', () => {
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: []
        })
      );
      expect(react_2.screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
  describe('combination cards', () => {
    test('should render each combination as a CombinationCard', () => {
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, { ...defaultProps })
      );
      const cards = react_2.screen.getAllByRole('button');
      expect(cards).toHaveLength(3);
    });
    test('should pass correct props to CombinationCard components', () => {
      const combinations = [createCombination([1, 2], false), createCombination([3, 4], true)];
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: combinations
        })
      );
      const activeCard = react_2.screen.getByLabelText('Combination 1, 2');
      expect(activeCard).toHaveAttribute('aria-pressed', 'false');
      const eliminatedCard = react_2.screen.getByLabelText('Combination 3, 4 (eliminated)');
      expect(eliminatedCard).toHaveAttribute('aria-pressed', 'true');
    });
    test('should use signature as key for cards', () => {
      const combinations = [createCombination([1, 2]), createCombination([3, 4])];
      const { container } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: combinations
        })
      );
      const cards = container.querySelectorAll('[role="button"]');
      expect(cards).toHaveLength(2);
    });
  });
  describe('interactions', () => {
    test('should call onToggle when a combination card is clicked', () => {
      const onToggle = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          onToggle: onToggle
        })
      );
      const firstCard = react_2.screen.getByText('12').closest('button');
      react_2.fireEvent.click(firstCard);
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith('1,2');
    });
    test('should call onToggle with correct signature for each card', () => {
      const onToggle = jest.fn();
      const combinations = [createCombination([1, 2]), createCombination([3, 4]), createCombination([5, 6])];
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: combinations,
          onToggle: onToggle
        })
      );
      const card1 = react_2.screen.getByText('12').closest('button');
      const card2 = react_2.screen.getByText('34').closest('button');
      const card3 = react_2.screen.getByText('56').closest('button');
      react_2.fireEvent.click(card1);
      react_2.fireEvent.click(card2);
      react_2.fireEvent.click(card3);
      expect(onToggle).toHaveBeenCalledWith('1,2');
      expect(onToggle).toHaveBeenCalledWith('3,4');
      expect(onToggle).toHaveBeenCalledWith('5,6');
      expect(onToggle).toHaveBeenCalledTimes(3);
    });
  });
  describe('empty state', () => {
    test('should display empty state message with proper styling', () => {
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: []
        })
      );
      const emptyState = react_2.screen.getByText('No combinations available for this cage');
      expect(emptyState).toBeInTheDocument();
      const emptyContainer = emptyState.closest('div');
      expect(emptyContainer).toHaveClass('flex');
      expect(emptyContainer).toHaveClass('items-center');
      expect(emptyContainer).toHaveClass('justify-center');
      expect(emptyContainer).toHaveClass('p-8');
    });
    test('should not display flex container when showing empty state', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: []
        })
      );
      const flexContainer = container.querySelector('.flex-wrap');
      expect(flexContainer).not.toBeInTheDocument();
    });
  });
  describe('mode variations', () => {
    test('should handle panel mode correctly', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          combinations: defaultProps.combinations,
          onToggle: defaultProps.onToggle,
          mode: 'panel'
        })
      );
      const gridContainer = container.querySelector('.flex');
      expect(gridContainer).toHaveClass('flex-wrap');
      expect(gridContainer).toHaveClass('gap-2');
    });
    test('should handle modal mode correctly', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          combinations: defaultProps.combinations,
          onToggle: defaultProps.onToggle,
          mode: 'modal'
        })
      );
      const gridContainer = container.querySelector('.flex');
      expect(gridContainer).toHaveClass('flex-wrap');
      expect(gridContainer).toHaveClass('gap-2');
    });
  });
  describe('updates', () => {
    test('should update when combinations change', () => {
      const combinations1 = [createCombination([1, 2])];
      const combinations2 = [createCombination([3, 4])];
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: combinations1
        })
      );
      expect(react_2.screen.getByText('12')).toBeInTheDocument();
      expect(react_2.screen.queryByText('34')).not.toBeInTheDocument();
      rerender(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: combinations2
        })
      );
      expect(react_2.screen.queryByText('12')).not.toBeInTheDocument();
      expect(react_2.screen.getByText('34')).toBeInTheDocument();
    });
    test('should update when mode changes', () => {
      const { container, rerender } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, { ...defaultProps, mode: 'panel' })
      );
      let gridContainer = container.querySelector('.flex');
      expect(gridContainer).toHaveClass('flex-wrap');
      rerender(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, { ...defaultProps, mode: 'modal' })
      );
      gridContainer = container.querySelector('.flex');
      expect(gridContainer).toHaveClass('flex-wrap');
    });
    test('should handle transition from empty to filled', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: []
        })
      );
      expect(react_2.screen.getByText('No combinations available for this cage')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: defaultProps.combinations
        })
      );
      expect(react_2.screen.queryByText('No combinations available for this cage')).not.toBeInTheDocument();
      expect(react_2.screen.getByText('12')).toBeInTheDocument();
    });
    test('should handle transition from filled to empty', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, { ...defaultProps })
      );
      expect(react_2.screen.getByText('12')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: []
        })
      );
      expect(react_2.screen.queryByText('12')).not.toBeInTheDocument();
      expect(react_2.screen.getByText('No combinations available for this cage')).toBeInTheDocument();
    });
  });
  describe('edge cases', () => {
    test('should handle single combination', () => {
      const combinations = [createCombination([1, 2, 3])];
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: combinations
        })
      );
      expect(react_2.screen.getAllByRole('button')).toHaveLength(1);
      expect(react_2.screen.getByText('123')).toBeInTheDocument();
    });
    test('should handle many combinations', () => {
      const combinations = Array.from({ length: 20 }, (__unused, i) => createCombination([i + 1, i + 2]));
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: combinations
        })
      );
      expect(react_2.screen.getAllByRole('button')).toHaveLength(20);
    });
    test('should handle mix of eliminated and active combinations', () => {
      const combinations = [
        createCombination([1, 2], false),
        createCombination([3, 4], true),
        createCombination([5, 6], false),
        createCombination([7, 8], true)
      ];
      (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: combinations
        })
      );
      const activeCards = react_2.screen.getAllByRole('button', { pressed: false });
      const eliminatedCards = react_2.screen.getAllByRole('button', { pressed: true });
      expect(activeCards).toHaveLength(2);
      expect(eliminatedCards).toHaveLength(2);
    });
    test('should maintain scroll when combinations update', () => {
      const combinations1 = Array.from({ length: 10 }, (__unused, i) => createCombination([i + 1, i + 2]));
      const combinations2 = Array.from({ length: 10 }, (__unused, i) => createCombination([i + 10, i + 11]));
      const { container, rerender } = (0, react_2.render)(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: combinations1
        })
      );
      const grid = container.querySelector('.overflow-y-auto');
      expect(grid).toBeInTheDocument();
      rerender(
        react_1.default.createElement(CombinationGrid_1.CombinationGrid, {
          ...defaultProps,
          combinations: combinations2
        })
      );
      expect(container.querySelector('.overflow-y-auto')).toBeInTheDocument();
    });
  });
});
//# sourceMappingURL=CombinationGrid.test.js.map
