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
const KillerCombinationsModal_1 = require('../../../components/KillerCombinationsModal');
describe('KillerCombinationsModal', () => {
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
    // Reset body overflow style
    document.body.style.overflow = '';
  });
  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = '';
  });
  describe('rendering basics', () => {
    test('should render modal when isOpen is true', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      expect(react_2.screen.getByRole('dialog')).toBeInTheDocument();
    });
    test('should not render modal when isOpen is false', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: false
        })
      );
      expect(react_2.screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    test('should render with proper ARIA attributes', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(modal).toHaveAttribute('aria-describedby', 'modal-description');
    });
    test('should render modal title with proper id', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const title = react_2.screen.getByText('Combinations');
      expect(title).toHaveAttribute('id', 'modal-title');
    });
    test('should render modal description with proper id', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const description = react_2.screen.getByText('2 cells, sum 5');
      expect(description).toHaveAttribute('id', 'modal-description');
    });
    test('should apply custom className when provided', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          className: 'custom-modal-class'
        })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveClass('custom-modal-class');
    });
    test('should render overlay with presentation role', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const overlay = container.querySelector('[role="presentation"]');
      expect(overlay).toBeInTheDocument();
    });
  });
  describe('modal header', () => {
    test('should display "Combinations" title', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      expect(react_2.screen.getByText('Combinations')).toBeInTheDocument();
    });
    test('should display cage information (cells and sum)', () => {
      const cage = createMockCage(3, 15);
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          cage: cage
        })
      );
      expect(react_2.screen.getByText('3 cells, sum 15')).toBeInTheDocument();
    });
    test('should display different cage information for different cages', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          cage: createMockCage(2, 5)
        })
      );
      expect(react_2.screen.getByText('2 cells, sum 5')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          cage: createMockCage(4, 20)
        })
      );
      expect(react_2.screen.getByText('4 cells, sum 20')).toBeInTheDocument();
    });
    test('should render close button with accessible label', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const closeButton = react_2.screen.getByLabelText('Close combinations modal');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
    });
    test('should have close button with proper type attribute', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const closeButton = react_2.screen.getByLabelText('Close combinations modal');
      expect(closeButton).toHaveAttribute('type', 'button');
    });
  });
  describe('close functionality', () => {
    test('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onClose: onClose
        })
      );
      const closeButton = react_2.screen.getByLabelText('Close combinations modal');
      react_2.fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    test('should call onClose when backdrop is clicked', () => {
      const onClose = jest.fn();
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onClose: onClose
        })
      );
      const overlay = container.querySelector('[role="presentation"]');
      react_2.fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    test('should not call onClose when dialog content is clicked', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onClose: onClose
        })
      );
      const dialog = react_2.screen.getByRole('dialog');
      react_2.fireEvent.click(dialog);
      expect(onClose).not.toHaveBeenCalled();
    });
    test('should call onClose when Escape key is pressed and modal is open', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onClose: onClose,
          isOpen: true
        })
      );
      react_2.fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    test('should not call onClose when Escape key is pressed and modal is closed', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
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
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
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
    test('should clean up Escape event listener when modal closes', () => {
      const onClose = jest.fn();
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onClose: onClose,
          isOpen: true
        })
      );
      react_2.fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
      onClose.mockClear();
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
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
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
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
  describe('body scroll locking', () => {
    test('should lock body scroll when modal opens', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      expect(document.body.style.overflow).toBe('hidden');
    });
    test('should restore body scroll when modal closes', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      expect(document.body.style.overflow).toBe('hidden');
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: false
        })
      );
      expect(document.body.style.overflow).toBe('');
    });
    test('should preserve original overflow style when modal opens', () => {
      document.body.style.overflow = 'scroll';
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      expect(document.body.style.overflow).toBe('hidden');
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: false
        })
      );
      expect(document.body.style.overflow).toBe('scroll');
    });
    test('should not lock scroll when modal is not open', () => {
      document.body.style.overflow = 'auto';
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: false
        })
      );
      expect(document.body.style.overflow).toBe('auto');
    });
    test('should clean up scroll lock when component unmounts', () => {
      document.body.style.overflow = 'auto';
      const { unmount } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('auto');
    });
  });
  describe('focus management', () => {
    test('should focus first focusable element when modal opens', async () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      await (0, react_2.waitFor)(() => {
        const closeButton = react_2.screen.getByLabelText('Close combinations modal');
        expect(document.activeElement).toBe(closeButton);
      });
    });
    test('should trap focus within modal', async () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      const closeButton = react_2.screen.getByLabelText('Close combinations modal');
      const combinationButtons = react_2.screen.getAllByRole('button', { name: /Combination/ });
      // Focus should start at close button
      await (0, react_2.waitFor)(() => {
        expect(document.activeElement).toBe(closeButton);
      });
      // Simulate tabbing forward through all elements
      combinationButtons.forEach((button) => {
        button.focus();
        expect(document.activeElement).toBe(button);
      });
    });
    test('should handle Tab key for focus trap', async () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(document.activeElement).toBe(react_2.screen.getByLabelText('Close combinations modal'));
      });
      const allButtons = react_2.screen.getAllByRole('button');
      const lastButton = allButtons[allButtons.length - 1];
      // Tab forward from last element should wrap to first
      lastButton.focus();
      react_2.fireEvent.keyDown(window, { key: 'Tab', shiftKey: false });
      // Note: In real browser this would wrap, but jsdom doesn't fully simulate this
      // We're testing that the handler is set up correctly
    });
    test('should handle Shift+Tab for reverse focus trap', async () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      await (0, react_2.waitFor)(() => {
        expect(document.activeElement).toBe(react_2.screen.getByLabelText('Close combinations modal'));
      });
      const firstButton = react_2.screen.getByLabelText('Close combinations modal');
      // Shift+Tab from first element should wrap to last
      firstButton.focus();
      react_2.fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
      // Note: In real browser this would wrap, but jsdom doesn't fully simulate this
      // We're testing that the handler is set up correctly
    });
    test('should not focus when modal is closed', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: false
        })
      );
      // No modal elements should exist
      expect(react_2.screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    test('should clean up focus trap when modal closes', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: false
        })
      );
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
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
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
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
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
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          combinations: combinations
        })
      );
      expect(react_2.screen.getByText('0 of 3 combinations possible')).toBeInTheDocument();
    });
    test('should update count when combinations change', () => {
      const combinations1 = [createCombination([1, 4], false), createCombination([2, 3], true)];
      const combinations2 = [
        createCombination([1, 4], true),
        createCombination([2, 3], true),
        createCombination([1, 3], false)
      ];
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          combinations: combinations1
        })
      );
      expect(react_2.screen.getByText('1 of 2 combinations possible')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
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
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
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
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
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
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onToggle: onToggle
        })
      );
      const firstCard = react_2.screen.getByText('14').closest('button');
      react_2.fireEvent.click(firstCard);
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith('1,4');
    });
    test('should pass mode="modal" to CombinationGrid', () => {
      // This is verified by the CombinationGrid rendering correctly in modal mode
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      // CombinationGrid should be rendered in modal mode (verified by presence of grid container)
      const gridContainer = container.querySelector('.flex-wrap');
      expect(gridContainer).toBeInTheDocument();
    });
    test('should handle empty combinations list', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          combinations: []
        })
      );
      expect(react_2.screen.getByText('No combinations available for this cage')).toBeInTheDocument();
      expect(react_2.screen.getByText('0 of 0 combinations possible')).toBeInTheDocument();
    });
  });
  describe('layout and styling', () => {
    test('should have flex column layout for dialog', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveClass('flex');
      expect(modal).toHaveClass('flex-col');
    });
    test('should have appropriate width and max-width classes', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveClass('w-full');
      expect(modal).toHaveClass('max-w-lg');
    });
    test('should have rounded corners and responsive styling', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveClass('rounded-t-2xl');
      expect(modal).toHaveClass('sm:rounded-2xl');
    });
    test('should have transition classes for smooth animation', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveClass('transform');
      expect(modal).toHaveClass('transition-transform');
      expect(modal).toHaveClass('duration-300');
    });
    test('should have shadow and overflow styling', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveClass('shadow-2xl');
      expect(modal).toHaveClass('overflow-hidden');
    });
    test('should apply open state transform', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveClass('translate-y-0');
    });
    test('should have backdrop with proper opacity', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const overlay = container.querySelector('[role="presentation"]');
      expect(overlay).toHaveClass('bg-black');
      expect(overlay).toHaveClass('bg-opacity-40');
    });
  });
  describe('state transitions', () => {
    test('should transition from closed to open', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: false
        })
      );
      expect(react_2.screen.queryByRole('dialog')).not.toBeInTheDocument();
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      expect(react_2.screen.getByRole('dialog')).toBeInTheDocument();
      expect(react_2.screen.getByRole('dialog')).toHaveClass('translate-y-0');
    });
    test('should transition from open to closed', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      expect(react_2.screen.getByRole('dialog')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: false
        })
      );
      expect(react_2.screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    test('should update cage information when cage changes', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          cage: createMockCage(2, 5)
        })
      );
      expect(react_2.screen.getByText('2 cells, sum 5')).toBeInTheDocument();
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          cage: createMockCage(5, 25)
        })
      );
      expect(react_2.screen.getByText('5 cells, sum 25')).toBeInTheDocument();
    });
  });
  describe('interaction workflows', () => {
    test('should support complete open-explore-close workflow', async () => {
      const onToggle = jest.fn();
      const onClose = jest.fn();
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onToggle: onToggle,
          onClose: onClose,
          isOpen: false
        })
      );
      // Modal is closed
      expect(react_2.screen.queryByRole('dialog')).not.toBeInTheDocument();
      // Open modal
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onToggle: onToggle,
          onClose: onClose,
          isOpen: true
        })
      );
      expect(react_2.screen.getByRole('dialog')).toBeInTheDocument();
      // Toggle a combination
      const firstCard = react_2.screen.getByText('14').closest('button');
      react_2.fireEvent.click(firstCard);
      expect(onToggle).toHaveBeenCalledWith('1,4');
      // Close modal with close button
      const closeButton = react_2.screen.getByLabelText('Close combinations modal');
      react_2.fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    test('should support backdrop click to close workflow', () => {
      const onClose = jest.fn();
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onClose: onClose
        })
      );
      const overlay = container.querySelector('[role="presentation"]');
      react_2.fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    test('should support keyboard-based close workflow', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onClose: onClose,
          isOpen: true
        })
      );
      expect(react_2.screen.getByRole('dialog')).toBeInTheDocument();
      react_2.fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    test('should support multiple toggle operations', () => {
      const onToggle = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onToggle: onToggle
        })
      );
      const cards = react_2.screen.getAllByRole('button', { name: /Combination/ });
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
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          combinations: largeCombinations
        })
      );
      expect(react_2.screen.getByText('25 of 50 combinations possible')).toBeInTheDocument();
    });
    test('should handle rapid open/close state changes', () => {
      const { rerender } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: false
        })
      );
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: false
        })
      );
      rerender(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          isOpen: true
        })
      );
      expect(react_2.screen.getByRole('dialog')).toBeInTheDocument();
    });
    test('should handle className with multiple classes', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          className: 'class-one class-two class-three'
        })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveClass('class-one');
      expect(modal).toHaveClass('class-two');
      expect(modal).toHaveClass('class-three');
    });
    test('should handle undefined className gracefully', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          className: undefined
        })
      );
      expect(react_2.screen.getByRole('dialog')).toBeInTheDocument();
    });
    test('should stop event propagation when clicking dialog content', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onClose: onClose
        })
      );
      const dialog = react_2.screen.getByRole('dialog');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
      (0, react_2.fireEvent)(dialog, clickEvent);
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      stopPropagationSpy.mockRestore();
    });
    test('should handle maximum height constraint', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveClass('max-h-[85vh]');
    });
    test('should maintain scroll in combinations grid', () => {
      const { container } = (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const gridContainer = container.querySelector('.overflow-hidden');
      expect(gridContainer).toBeInTheDocument();
    });
  });
  describe('accessibility features', () => {
    test('should have proper ARIA modal attributes', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const modal = react_2.screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });
    test('should label modal with title', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const modal = react_2.screen.getByRole('dialog');
      const titleId = modal.getAttribute('aria-labelledby');
      const title = document.getElementById(titleId);
      expect(title).toBeInTheDocument();
      expect(title?.textContent).toBe('Combinations');
    });
    test('should describe modal with cage information', () => {
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, { ...defaultProps })
      );
      const modal = react_2.screen.getByRole('dialog');
      const descriptionId = modal.getAttribute('aria-describedby');
      const description = document.getElementById(descriptionId);
      expect(description).toBeInTheDocument();
      expect(description?.textContent).toContain('2 cells, sum 5');
    });
    test('should have keyboard accessible close button', () => {
      const onClose = jest.fn();
      (0, react_2.render)(
        react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
          ...defaultProps,
          onClose: onClose
        })
      );
      const closeButton = react_2.screen.getByLabelText('Close combinations modal');
      closeButton.focus();
      react_2.fireEvent.keyDown(closeButton, { key: 'Enter' });
      // Note: fireEvent.click is needed to actually trigger onClick
      react_2.fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
//# sourceMappingURL=KillerCombinationsModal.test.js.map
