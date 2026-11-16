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
exports.KillerCombinationsExplorer = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const useKillerCombinations_1 = require('../hooks/useKillerCombinations');
const useCombinationElimination_1 = require('../hooks/useCombinationElimination');
const useResponsiveLayout_1 = require('../hooks/useResponsiveLayout');
const KillerCombinationsPanel_1 = require('./KillerCombinationsPanel');
const KillerCombinationsModal_1 = require('./KillerCombinationsModal');
/**
 * Main killer combinations explorer container component
 * Automatically switches between panel (desktop) and modal (mobile) based on screen size
 * @public
 */
const KillerCombinationsExplorer = ({
  selectedCage,
  puzzleId,
  isOpen,
  onClose,
  mobileBreakpoint = 1024,
  className
}) => {
  const { screenWidth } = (0, useResponsiveLayout_1.useResponsiveLayout)();
  // Determine display mode based on screen width
  const mode = screenWidth >= mobileBreakpoint ? 'panel' : 'modal';
  // Get combinations for the selected cage
  const combinationsResult = (0, useKillerCombinations_1.useKillerCombinations)(selectedCage);
  // Get cage ID for storage
  const cageId = selectedCage?.id;
  // Get elimination state
  const { eliminatedSignatures, toggleElimination } = (0,
  useCombinationElimination_1.useCombinationElimination)(puzzleId, cageId);
  // Merge combinations with elimination state
  const displayCombinations = (0, react_1.useMemo)(() => {
    if (combinationsResult.isFailure()) {
      return [];
    }
    return combinationsResult.value.map((combo) => ({
      ...combo,
      isEliminated: eliminatedSignatures.has(combo.signature)
    }));
  }, [combinationsResult, eliminatedSignatures]);
  // Don't render if not open or no cage selected
  if (!isOpen || !selectedCage) {
    return null;
  }
  // Don't render if combinations failed to load
  if (combinationsResult.isFailure()) {
    return null;
  }
  // Render panel or modal based on mode
  if (mode === 'panel') {
    return react_1.default.createElement(KillerCombinationsPanel_1.KillerCombinationsPanel, {
      cage: selectedCage,
      combinations: displayCombinations,
      onToggle: toggleElimination,
      onClose: onClose,
      isOpen: isOpen,
      className: className
    });
  }
  return react_1.default.createElement(KillerCombinationsModal_1.KillerCombinationsModal, {
    cage: selectedCage,
    combinations: displayCombinations,
    onToggle: toggleElimination,
    onClose: onClose,
    isOpen: isOpen,
    className: className
  });
};
exports.KillerCombinationsExplorer = KillerCombinationsExplorer;
//# sourceMappingURL=KillerCombinationsExplorer.js.map
