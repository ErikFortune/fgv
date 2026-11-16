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
const user_event_1 = tslib_1.__importDefault(require('@testing-library/user-event'));
require('@testing-library/jest-dom');
const CombinationCard_1 = require('../../../components/CombinationCard');
describe('CombinationCard', () => {
  const createCombination = (combination, isEliminated = false) => ({
    combination,
    signature: [...combination].sort((a, b) => a - b).join(','),
    isEliminated
  });
  const defaultProps = {
    combination: createCombination([1, 2, 3]),
    onToggle: jest.fn(),
    className: undefined
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('rendering', () => {
    test('should render combination numbers correctly', () => {
      const combo = createCombination([1, 2, 3]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      expect(react_2.screen.getByText('123')).toBeInTheDocument();
    });
    test('should render active (not eliminated) combination correctly', () => {
      const combo = createCombination([4, 5], false);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'false');
      expect(card).toHaveAttribute('aria-label', 'Combination 4, 5');
      expect(card).not.toHaveClass('line-through');
      expect(card).not.toHaveClass('opacity-50');
    });
    test('should render eliminated combination correctly', () => {
      const combo = createCombination([6, 7, 8], true);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(card).toHaveAttribute('aria-label', 'Combination 6, 7, 8 (eliminated)');
      expect(card).toHaveClass('opacity-60');
      // line-through is applied to the span, not the button
      const numberSpan = card.querySelector('span');
      expect(numberSpan).toHaveClass('line-through');
    });
    test('should apply custom className when provided', () => {
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          ...defaultProps,
          className: 'custom-test-class'
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveClass('custom-test-class');
    });
    test('should render as a button element', () => {
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, { ...defaultProps })
      );
      const card = react_2.screen.getByRole('button');
      expect(card.tagName).toBe('BUTTON');
      expect(card).toHaveAttribute('type', 'button');
    });
    test('should display numbers in order as provided', () => {
      const combo = createCombination([9, 1, 5]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      // Numbers should be displayed in the order they appear in the array (as continuous string)
      expect(react_2.screen.getByText('915')).toBeInTheDocument();
    });
  });
  describe('mouse interactions', () => {
    test('should call onToggle with signature when clicked', () => {
      const onToggle = jest.fn();
      const combo = createCombination([1, 2, 3]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: onToggle
        })
      );
      const card = react_2.screen.getByRole('button');
      react_2.fireEvent.click(card);
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith('1,2,3');
    });
    test('should call onToggle when eliminated combination is clicked', () => {
      const onToggle = jest.fn();
      const combo = createCombination([4, 5], true);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: onToggle
        })
      );
      const card = react_2.screen.getByRole('button');
      react_2.fireEvent.click(card);
      expect(onToggle).toHaveBeenCalledWith('4,5');
    });
    test('should handle multiple clicks correctly', () => {
      const onToggle = jest.fn();
      const combo = createCombination([1, 2]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: onToggle
        })
      );
      const card = react_2.screen.getByRole('button');
      react_2.fireEvent.click(card);
      react_2.fireEvent.click(card);
      react_2.fireEvent.click(card);
      expect(onToggle).toHaveBeenCalledTimes(3);
    });
  });
  describe('keyboard interactions', () => {
    test('should trigger onToggle when Space key is pressed', async () => {
      const user = user_event_1.default.setup();
      const onToggle = jest.fn();
      const combo = createCombination([1, 2, 3]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: onToggle
        })
      );
      const card = react_2.screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith('1,2,3');
    });
    test('should trigger onToggle when Enter key is pressed', async () => {
      const user = user_event_1.default.setup();
      const onToggle = jest.fn();
      const combo = createCombination([4, 5, 6]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: onToggle
        })
      );
      const card = react_2.screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith('4,5,6');
    });
    test('should prevent default for Space key', () => {
      const combo = createCombination([1, 2]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      (0, react_2.fireEvent)(card, event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
    test('should prevent default for Enter key', () => {
      const combo = createCombination([1, 2]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
      (0, react_2.fireEvent)(card, event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
    test('should not trigger onToggle for other keys', async () => {
      const user = user_event_1.default.setup();
      const onToggle = jest.fn();
      const combo = createCombination([1, 2, 3]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: onToggle
        })
      );
      const card = react_2.screen.getByRole('button');
      card.focus();
      await user.keyboard('a');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Escape}');
      expect(onToggle).not.toHaveBeenCalled();
    });
  });
  describe('accessibility', () => {
    test('should have proper ARIA attributes for active combination', () => {
      const combo = createCombination([1, 2, 3], false);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'false');
      expect(card).toHaveAttribute('aria-label', 'Combination 1, 2, 3');
      expect(card).toHaveAttribute('role', 'button');
    });
    test('should have proper ARIA attributes for eliminated combination', () => {
      const combo = createCombination([4, 5], true);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveAttribute('aria-pressed', 'true');
      expect(card).toHaveAttribute('aria-label', 'Combination 4, 5 (eliminated)');
    });
    test('should be keyboard focusable', () => {
      const combo = createCombination([1, 2]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      card.focus();
      expect(document.activeElement).toBe(card);
    });
    test('should have focus styles', () => {
      const combo = createCombination([1, 2]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveClass('focus:outline-none');
      expect(card).toHaveClass('focus:ring-2');
      expect(card).toHaveClass('focus:ring-blue-500');
    });
  });
  describe('visual styling', () => {
    test('should apply correct base classes', () => {
      const combo = createCombination([1, 2]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveClass('px-3');
      expect(card).toHaveClass('py-1');
      expect(card).toHaveClass('rounded');
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveClass('select-none');
    });
    test('should apply active combination styles', () => {
      const combo = createCombination([1, 2], false);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveClass('border-blue-500');
      expect(card).toHaveClass('bg-white');
      expect(card).not.toHaveClass('line-through');
      expect(card).not.toHaveClass('opacity-60');
    });
    test('should apply eliminated combination styles', () => {
      const combo = createCombination([1, 2], true);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveClass('border-gray-300');
      expect(card).toHaveClass('bg-gray-50');
      expect(card).toHaveClass('opacity-60');
      // line-through is on the span element
      const numberSpan = card.querySelector('span');
      expect(numberSpan).toHaveClass('line-through');
    });
    test('should have hover effect classes', () => {
      const combo = createCombination([1, 2]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveClass('hover:shadow-sm');
    });
    test('should have transition classes', () => {
      const combo = createCombination([1, 2]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      const card = react_2.screen.getByRole('button');
      expect(card).toHaveClass('transition-all');
      expect(card).toHaveClass('duration-200');
    });
  });
  describe('memoization', () => {
    test('should not re-render when signature and eliminated state are the same', () => {
      const combo1 = createCombination([1, 2, 3], false);
      const combo2 = createCombination([1, 2, 3], false);
      const onToggle = jest.fn();
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo1,
          onToggle: onToggle
        })
      );
      const card1 = react_2.screen.getByRole('button');
      rerender(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo2,
          onToggle: onToggle
        })
      );
      const card2 = react_2.screen.getByRole('button');
      // Should be the same element since memo prevents re-render
      expect(card1).toBe(card2);
    });
    test('should re-render when eliminated state changes', () => {
      const combo1 = createCombination([1, 2, 3], false);
      const combo2 = createCombination([1, 2, 3], true);
      const onToggle = jest.fn();
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo1,
          onToggle: onToggle
        })
      );
      expect(react_2.screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
      rerender(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo2,
          onToggle: onToggle
        })
      );
      expect(react_2.screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
    });
    test('should re-render when combination signature changes', () => {
      const combo1 = createCombination([1, 2, 3], false);
      const combo2 = createCombination([4, 5, 6], false);
      const onToggle = jest.fn();
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo1,
          onToggle: onToggle
        })
      );
      expect(react_2.screen.getByText('123')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo2,
          onToggle: onToggle
        })
      );
      expect(react_2.screen.queryByText('123')).not.toBeInTheDocument();
      expect(react_2.screen.getByText('456')).toBeInTheDocument();
    });
  });
  describe('edge cases', () => {
    test('should handle single-number combination', () => {
      const combo = createCombination([9]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      expect(react_2.screen.getByText('9')).toBeInTheDocument();
    });
    test('should handle large combinations', () => {
      const combo = createCombination([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      expect(react_2.screen.getByText('123456789')).toBeInTheDocument();
    });
    test('should handle combinations with repeated numbers', () => {
      // Even though this shouldn't happen in valid killer sudoku, test handling
      const combo = createCombination([5, 5, 5]);
      (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: jest.fn()
        })
      );
      expect(react_2.screen.getByText('555')).toBeInTheDocument();
    });
    test('should not re-render when only callback changes due to memo', () => {
      const combo = createCombination([1, 2, 3]);
      const onToggle1 = jest.fn();
      const onToggle2 = jest.fn();
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: onToggle1
        })
      );
      const card = react_2.screen.getByRole('button');
      react_2.fireEvent.click(card);
      expect(onToggle1).toHaveBeenCalledTimes(1);
      expect(onToggle2).not.toHaveBeenCalled();
      rerender(
        react_1.default.createElement(CombinationCard_1.CombinationCard, {
          combination: combo,
          onToggle: onToggle2
        })
      );
      // Component memoization prevents re-render when signature and isEliminated are the same
      // So the old callback is still used
      react_2.fireEvent.click(react_2.screen.getByRole('button'));
      // Both callbacks get called because memo doesn't prevent the callback prop update
      expect(onToggle1).toHaveBeenCalledTimes(2);
      expect(onToggle2).not.toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=CombinationCard.test.js.map
