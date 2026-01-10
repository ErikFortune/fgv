/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';

/* eslint-disable @rushstack/typedef-var */

/**
 * A segment in the percentage bar
 * @public
 */
export interface IPercentageSegment {
  /** Segment label */
  label: string;
  /** Percentage value (0-100) */
  value: number;
  /** Tailwind color class for the segment (e.g., 'bg-amber-500') */
  color: string;
  /** Dark mode color class (e.g., 'dark:bg-amber-600') */
  darkColor?: string;
}

/**
 * Props for the PercentageBar component
 * @public
 */
export interface IPercentageBarProps {
  /** Segments to display in the bar */
  segments: IPercentageSegment[];
  /** Optional additional CSS classes */
  className?: string;
  /** Height variant */
  height?: 'sm' | 'md' | 'lg';
  /** Whether to show value labels */
  showLabels?: boolean;
  /** Whether to show a legend below the bar */
  showLegend?: boolean;
}

const heightClasses = {
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6'
};

/**
 * Displays a horizontal stacked percentage bar with colored segments
 * @public
 */
export function PercentageBar({
  segments,
  className = '',
  height = 'md',
  showLabels = false,
  showLegend = false
}: IPercentageBarProps): React.ReactElement {
  // Filter out zero-value segments and normalize if total exceeds 100
  const nonZeroSegments = segments.filter((s) => s.value > 0);
  const total = nonZeroSegments.reduce((sum, s) => sum + s.value, 0);

  // Normalize values if they exceed 100%
  const normalizedSegments =
    total > 100 ? nonZeroSegments.map((s) => ({ ...s, value: (s.value / total) * 100 })) : nonZeroSegments;

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`w-full ${heightClasses[height]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex`}
        role="img"
        aria-label="Percentage breakdown"
      >
        {normalizedSegments.map((segment, index) => {
          const colorClass = segment.darkColor ? `${segment.color} ${segment.darkColor}` : segment.color;

          return (
            <div
              key={segment.label}
              className={`${colorClass} ${index === 0 ? '' : ''} relative group`}
              style={{ width: `${segment.value}%` }}
              title={`${segment.label}: ${segment.value.toFixed(1)}%`}
            >
              {showLabels && height === 'lg' && segment.value >= 10 && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white truncate px-1">
                  {segment.value.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {normalizedSegments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-1.5 text-sm">
              <div
                className={`w-3 h-3 rounded-sm ${segment.color} ${segment.darkColor ?? ''}`}
                aria-hidden="true"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {segment.label}: {segment.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
