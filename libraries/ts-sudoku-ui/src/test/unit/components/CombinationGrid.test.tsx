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
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CombinationGrid } from '../../../components/CombinationGrid';
import { ICombinationDisplayInfo } from '../../../types';

describe('CombinationGrid', () => {
  const createCombination = (
    combination: number[],
    isEliminated: boolean = false
  ): ICombinationDisplayInfo => ({
    combination,
    signature: [...combination].sort((a, b) => a - b).join(','),
    isEliminated
  });

  const defaultProps = {
    combinations: [createCombination([1, 2]), createCombination([3, 4]), createCombination([5, 6])],
    onToggle: jest.fn(),
    mode: 'panel' as const,
    className: undefined
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('should render all combinations', () => {
      render(<CombinationGrid {...defaultProps} />);

      expect(screen.getByText('1, 2')).toBeInTheDocument();
      expect(screen.getByText('3, 4')).toBeInTheDocument();
      expect(screen.getByText('5, 6')).toBeInTheDocument();
    });

    test('should render as a grid', () => {
      const { container } = render(<CombinationGrid {...defaultProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    test('should apply panel mode grid classes', () => {
      const { container } = render(<CombinationGrid {...defaultProps} mode="panel" />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).toHaveClass('sm:grid-cols-3');
    });

    test('should apply modal mode grid classes', () => {
      const { container } = render(<CombinationGrid {...defaultProps} mode="modal" />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).not.toHaveClass('sm:grid-cols-3');
    });

    test('should apply common grid classes', () => {
      const { container } = render(<CombinationGrid {...defaultProps} />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-2');
      expect(grid).toHaveClass('p-4');
      expect(grid).toHaveClass('overflow-y-auto');
    });

    test('should apply custom className when provided', () => {
      const { container } = render(<CombinationGrid {...defaultProps} className="custom-grid-class" />);

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('custom-grid-class');
    });

    test('should display empty state when no combinations', () => {
      render(<CombinationGrid {...defaultProps} combinations={[]} />);

      expect(screen.getByText('No combinations available for this cage')).toBeInTheDocument();
    });

    test('should not render CombinationCards when no combinations', () => {
      render(<CombinationGrid {...defaultProps} combinations={[]} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('combination cards', () => {
    test('should render each combination as a CombinationCard', () => {
      render(<CombinationGrid {...defaultProps} />);

      const cards = screen.getAllByRole('button');
      expect(cards).toHaveLength(3);
    });

    test('should pass correct props to CombinationCard components', () => {
      const combinations = [createCombination([1, 2], false), createCombination([3, 4], true)];

      render(<CombinationGrid {...defaultProps} combinations={combinations} />);

      const activeCard = screen.getByLabelText('Combination 1, 2');
      expect(activeCard).toHaveAttribute('aria-pressed', 'false');

      const eliminatedCard = screen.getByLabelText('Combination 3, 4 (eliminated)');
      expect(eliminatedCard).toHaveAttribute('aria-pressed', 'true');
    });

    test('should use signature as key for cards', () => {
      const combinations = [createCombination([1, 2]), createCombination([3, 4])];

      const { container } = render(<CombinationGrid {...defaultProps} combinations={combinations} />);

      const cards = container.querySelectorAll('[role="button"]');
      expect(cards).toHaveLength(2);
    });
  });

  describe('interactions', () => {
    test('should call onToggle when a combination card is clicked', () => {
      const onToggle = jest.fn();
      render(<CombinationGrid {...defaultProps} onToggle={onToggle} />);

      const firstCard = screen.getByText('1, 2').closest('button');
      fireEvent.click(firstCard!);

      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith('1,2');
    });

    test('should call onToggle with correct signature for each card', () => {
      const onToggle = jest.fn();
      const combinations = [createCombination([1, 2]), createCombination([3, 4]), createCombination([5, 6])];

      render(<CombinationGrid {...defaultProps} combinations={combinations} onToggle={onToggle} />);

      const card1 = screen.getByText('1, 2').closest('button');
      const card2 = screen.getByText('3, 4').closest('button');
      const card3 = screen.getByText('5, 6').closest('button');

      fireEvent.click(card1!);
      fireEvent.click(card2!);
      fireEvent.click(card3!);

      expect(onToggle).toHaveBeenCalledWith('1,2');
      expect(onToggle).toHaveBeenCalledWith('3,4');
      expect(onToggle).toHaveBeenCalledWith('5,6');
      expect(onToggle).toHaveBeenCalledTimes(3);
    });
  });

  describe('empty state', () => {
    test('should display empty state message with proper styling', () => {
      render(<CombinationGrid {...defaultProps} combinations={[]} />);

      const emptyState = screen.getByText('No combinations available for this cage');
      expect(emptyState).toBeInTheDocument();

      const emptyContainer = emptyState.closest('div');
      expect(emptyContainer).toHaveClass('flex');
      expect(emptyContainer).toHaveClass('items-center');
      expect(emptyContainer).toHaveClass('justify-center');
      expect(emptyContainer).toHaveClass('p-8');
    });

    test('should not display grid when showing empty state', () => {
      const { container } = render(<CombinationGrid {...defaultProps} combinations={[]} />);

      const grid = container.querySelector('.grid');
      expect(grid).not.toBeInTheDocument();
    });
  });

  describe('mode variations', () => {
    test('should handle panel mode correctly', () => {
      const { container } = render(
        <CombinationGrid
          combinations={defaultProps.combinations}
          onToggle={defaultProps.onToggle}
          mode="panel"
        />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).toHaveClass('sm:grid-cols-3');
    });

    test('should handle modal mode correctly', () => {
      const { container } = render(
        <CombinationGrid
          combinations={defaultProps.combinations}
          onToggle={defaultProps.onToggle}
          mode="modal"
        />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).not.toHaveClass('sm:grid-cols-3');
    });
  });

  describe('updates', () => {
    test('should update when combinations change', () => {
      const combinations1 = [createCombination([1, 2])];
      const combinations2 = [createCombination([3, 4])];

      const { rerender } = render(<CombinationGrid {...defaultProps} combinations={combinations1} />);

      expect(screen.getByText('1, 2')).toBeInTheDocument();
      expect(screen.queryByText('3, 4')).not.toBeInTheDocument();

      rerender(<CombinationGrid {...defaultProps} combinations={combinations2} />);

      expect(screen.queryByText('1, 2')).not.toBeInTheDocument();
      expect(screen.getByText('3, 4')).toBeInTheDocument();
    });

    test('should update when mode changes', () => {
      const { container, rerender } = render(<CombinationGrid {...defaultProps} mode="panel" />);

      let grid = container.querySelector('.grid');
      expect(grid).toHaveClass('sm:grid-cols-3');

      rerender(<CombinationGrid {...defaultProps} mode="modal" />);

      grid = container.querySelector('.grid');
      expect(grid).not.toHaveClass('sm:grid-cols-3');
    });

    test('should handle transition from empty to filled', () => {
      const { rerender } = render(<CombinationGrid {...defaultProps} combinations={[]} />);

      expect(screen.getByText('No combinations available for this cage')).toBeInTheDocument();

      rerender(<CombinationGrid {...defaultProps} combinations={defaultProps.combinations} />);

      expect(screen.queryByText('No combinations available for this cage')).not.toBeInTheDocument();
      expect(screen.getByText('1, 2')).toBeInTheDocument();
    });

    test('should handle transition from filled to empty', () => {
      const { rerender } = render(<CombinationGrid {...defaultProps} />);

      expect(screen.getByText('1, 2')).toBeInTheDocument();

      rerender(<CombinationGrid {...defaultProps} combinations={[]} />);

      expect(screen.queryByText('1, 2')).not.toBeInTheDocument();
      expect(screen.getByText('No combinations available for this cage')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    test('should handle single combination', () => {
      const combinations = [createCombination([1, 2, 3])];

      render(<CombinationGrid {...defaultProps} combinations={combinations} />);

      expect(screen.getAllByRole('button')).toHaveLength(1);
      expect(screen.getByText('1, 2, 3')).toBeInTheDocument();
    });

    test('should handle many combinations', () => {
      const combinations = Array.from({ length: 20 }, (__unused, i) => createCombination([i + 1, i + 2]));

      render(<CombinationGrid {...defaultProps} combinations={combinations} />);

      expect(screen.getAllByRole('button')).toHaveLength(20);
    });

    test('should handle mix of eliminated and active combinations', () => {
      const combinations = [
        createCombination([1, 2], false),
        createCombination([3, 4], true),
        createCombination([5, 6], false),
        createCombination([7, 8], true)
      ];

      render(<CombinationGrid {...defaultProps} combinations={combinations} />);

      const activeCards = screen.getAllByRole('button', { pressed: false });
      const eliminatedCards = screen.getAllByRole('button', { pressed: true });

      expect(activeCards).toHaveLength(2);
      expect(eliminatedCards).toHaveLength(2);
    });

    test('should maintain scroll when combinations update', () => {
      const combinations1 = Array.from({ length: 10 }, (__unused, i) => createCombination([i + 1, i + 2]));
      const combinations2 = Array.from({ length: 10 }, (__unused, i) => createCombination([i + 10, i + 11]));

      const { container, rerender } = render(
        <CombinationGrid {...defaultProps} combinations={combinations1} />
      );

      const grid = container.querySelector('.overflow-y-auto');
      expect(grid).toBeInTheDocument();

      rerender(<CombinationGrid {...defaultProps} combinations={combinations2} />);

      expect(container.querySelector('.overflow-y-auto')).toBeInTheDocument();
    });
  });
});
