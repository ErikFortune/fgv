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

import React, { useCallback } from 'react';
import { ICombinationCardProps } from '../types';

/**
 * Individual combination card component with toggle functionality
 * @public
 */
export const CombinationCard: React.NamedExoticComponent<ICombinationCardProps> =
  React.memo<ICombinationCardProps>(
    ({ combination, onToggle, className }) => {
      const { combination: numbers, signature, isEliminated } = combination;

      const handleClick = useCallback(() => {
        onToggle(signature);
      }, [onToggle, signature]);

      const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            onToggle(signature);
          }
        },
        [onToggle, signature]
      );

      const cardClasses: string = [
        'px-3 py-1',
        'rounded border',
        'transition-all duration-200',
        'cursor-pointer select-none',
        'hover:shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        'inline-flex items-center justify-center',
        isEliminated
          ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 opacity-60'
          : 'border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700',
        className
      ]
        .filter(Boolean)
        .join(' ');

      const numberDisplay = numbers.join('');
      const ariaLabel = numbers.join(', ');

      return (
        <button
          type="button"
          className={cardClasses}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-pressed={isEliminated}
          aria-label={`Combination ${ariaLabel}${isEliminated ? ' (eliminated)' : ''}`}
          role="button"
        >
          <span
            className={`text-sm font-mono font-bold ${
              isEliminated ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'
            }`}
          >
            {numberDisplay}
          </span>
        </button>
      );
    },
    (prev, next) => {
      return (
        prev.combination.signature === next.combination.signature &&
        prev.combination.isEliminated === next.combination.isEliminated
      );
    }
  );

CombinationCard.displayName = 'CombinationCard';
