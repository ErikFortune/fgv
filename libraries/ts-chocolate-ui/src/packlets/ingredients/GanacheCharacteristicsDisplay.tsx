/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { Entities } from '@fgv/ts-chocolate';
import { PercentageBar } from '../common';
import type { IPercentageSegment } from '../common';

/**
 * Props for the GanacheCharacteristicsDisplay component
 * @public
 */
export interface IGanacheCharacteristicsDisplayProps {
  /** Ganache characteristics to display */
  characteristics: Entities.Ingredients.IGanacheCharacteristics;
  /** Optional additional CSS classes */
  className?: string;
  /** Whether to show a legend */
  showLegend?: boolean;
  /** Display mode */
  mode?: 'bar' | 'detailed';
}

/**
 * Builds segments for the percentage bar from ganache characteristics
 */
function buildSegments(characteristics: Entities.Ingredients.IGanacheCharacteristics): IPercentageSegment[] {
  const segments: IPercentageSegment[] = [];

  if (characteristics.cacaoFat > 0) {
    segments.push({
      label: 'Cacao Fat',
      value: characteristics.cacaoFat,
      color: 'bg-amber-700',
      darkColor: 'dark:bg-amber-600'
    });
  }

  if (characteristics.sugar > 0) {
    segments.push({
      label: 'Sugar',
      value: characteristics.sugar,
      color: 'bg-pink-400',
      darkColor: 'dark:bg-pink-500'
    });
  }

  if (characteristics.milkFat > 0) {
    segments.push({
      label: 'Milk Fat',
      value: characteristics.milkFat,
      color: 'bg-yellow-300',
      darkColor: 'dark:bg-yellow-400'
    });
  }

  if (characteristics.water > 0) {
    segments.push({
      label: 'Water',
      value: characteristics.water,
      color: 'bg-blue-400',
      darkColor: 'dark:bg-blue-500'
    });
  }

  if (characteristics.solids > 0) {
    segments.push({
      label: 'Solids',
      value: characteristics.solids,
      color: 'bg-stone-500',
      darkColor: 'dark:bg-stone-400'
    });
  }

  if (characteristics.otherFats > 0) {
    segments.push({
      label: 'Other Fats',
      value: characteristics.otherFats,
      color: 'bg-orange-400',
      darkColor: 'dark:bg-orange-500'
    });
  }

  return segments;
}

/**
 * Displays ganache characteristics as a visual breakdown
 * @public
 */
export function GanacheCharacteristicsDisplay({
  characteristics,
  className = '',
  showLegend = true,
  mode = 'bar'
}: IGanacheCharacteristicsDisplayProps): React.ReactElement {
  const segments = buildSegments(characteristics);

  if (mode === 'detailed') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Cacao Fat:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {characteristics.cacaoFat.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Sugar:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {characteristics.sugar.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Milk Fat:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {characteristics.milkFat.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Water:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {characteristics.water.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Solids:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {characteristics.solids.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Other Fats:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {characteristics.otherFats.toFixed(1)}%
            </span>
          </div>
        </div>
        <PercentageBar segments={segments} height="md" showLegend={false} />
      </div>
    );
  }

  return (
    <PercentageBar
      segments={segments}
      className={className}
      height="lg"
      showLabels={true}
      showLegend={showLegend}
    />
  );
}
