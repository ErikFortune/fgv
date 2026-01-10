/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { Ingredients } from '@fgv/ts-chocolate';

/**
 * Props for the TemperatureCurveDisplay component
 * @public
 */
export interface ITemperatureCurveDisplayProps {
  /** Temperature curve to display */
  curve: Ingredients.ITemperatureCurve;
  /** Optional additional CSS classes */
  className?: string;
  /** Whether to show Fahrenheit conversion */
  showFahrenheit?: boolean;
  /** Display mode */
  mode?: 'inline' | 'vertical';
}

/**
 * Converts Celsius to Fahrenheit
 */
function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/**
 * Formats a temperature for display
 */
function formatTemp(celsius: number, showFahrenheit: boolean): string {
  if (showFahrenheit) {
    return `${celsius}°C / ${celsiusToFahrenheit(celsius).toFixed(0)}°F`;
  }
  return `${celsius}°C`;
}

/**
 * Displays chocolate tempering temperature curve
 * @public
 */
export function TemperatureCurveDisplay({
  curve,
  className = '',
  showFahrenheit = false,
  mode = 'inline'
}: ITemperatureCurveDisplayProps): React.ReactElement {
  const tempPoints = [
    { label: 'Melt', temp: curve.melt, color: 'text-red-600 dark:text-red-400' },
    { label: 'Cool', temp: curve.cool, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Work', temp: curve.working, color: 'text-green-600 dark:text-green-400' }
  ];

  if (mode === 'vertical') {
    return (
      <div className={`space-y-2 ${className}`}>
        {tempPoints.map((point) => (
          <div key={point.label} className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400 text-sm">{point.label}:</span>
            <span className={`font-medium ${point.color}`}>{formatTemp(point.temp, showFahrenheit)}</span>
          </div>
        ))}
      </div>
    );
  }

  // Inline mode - horizontal display with visual temperature scale
  const minTemp = Math.min(curve.cool, curve.working) - 5;
  const maxTemp = curve.melt + 5;
  const range = maxTemp - minTemp;

  const getPosition = (temp: number): number => {
    return ((temp - minTemp) / range) * 100;
  };

  return (
    <div className={`${className}`}>
      {/* Temperature scale */}
      <div className="relative h-8 bg-gradient-to-r from-blue-200 via-yellow-200 to-red-200 dark:from-blue-900 dark:via-yellow-900 dark:to-red-900 rounded-lg mb-2">
        {/* Temperature markers */}
        {tempPoints.map((point) => (
          <div
            key={point.label}
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${getPosition(point.temp)}%`, transform: 'translateX(-50%)' }}
          >
            <div className={`w-0.5 h-4 bg-gray-800 dark:bg-gray-200`} />
            <span className={`text-xs font-medium mt-0.5 ${point.color}`}>{point.temp}°</span>
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        {tempPoints.map((point) => (
          <div key={point.label} className="text-center">
            <span className={`font-medium ${point.color}`}>{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
