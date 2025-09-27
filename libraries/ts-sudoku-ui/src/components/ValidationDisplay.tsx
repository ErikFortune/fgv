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

import React, { useMemo } from 'react';
import { IValidationDisplayProps } from '../types';

/**
 * Component to display validation errors and puzzle status
 * @public
 */
export const ValidationDisplay: React.FC<IValidationDisplayProps> = ({
  errors,
  isValid,
  isSolved,
  className
}) => {
  // Calculate display classes
  const displayClasses = useMemo(() => {
    const classes = ['validation-display'];
    if (className) classes.push(className);
    return classes.join(' ');
  }, [className]);

  // Group errors by type for better display
  const errorsByType = useMemo(() => {
    const grouped = {
      'duplicate-row': [] as typeof errors,
      'duplicate-column': [] as typeof errors,
      'duplicate-section': [] as typeof errors,
      'invalid-value': [] as typeof errors
    };

    errors.forEach((error) => {
      if (error.type in grouped) {
        grouped[error.type].push(error);
      }
    });

    return grouped;
  }, [errors]);

  // Get status message
  const statusMessage = useMemo(() => {
    if (isSolved) return 'Puzzle solved! 🎉';
    if (isValid) return 'Puzzle is valid';
    return `${errors.length} validation error${errors.length === 1 ? '' : 's'}`;
  }, [isValid, isSolved, errors.length]);

  // Get status color
  const statusColor = useMemo(() => {
    if (isSolved) return '#4caf50'; // Green
    if (isValid) return '#2196f3'; // Blue
    return '#f44336'; // Red
  }, [isValid, isSolved]);

  if (errors.length === 0 && !isSolved) {
    return (
      <div className={displayClasses} data-testid="validation-display">
        <div
          style={{
            padding: '12px',
            borderRadius: '4px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            color: statusColor,
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          {statusMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={displayClasses} data-testid="validation-display">
      <div
        style={{
          padding: '12px',
          borderRadius: '4px',
          backgroundColor: isSolved ? '#e8f5e8' : isValid ? '#e3f2fd' : '#ffebee',
          border: `1px solid ${statusColor}`,
          marginBottom: errors.length > 0 ? '12px' : '0'
        }}
      >
        <div
          style={{
            color: statusColor,
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          {statusMessage}
        </div>
      </div>

      {errors.length > 0 && (
        <div
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Validation Errors:</div>

          {Object.entries(errorsByType).map(([type, typeErrors]) => {
            if (typeErrors.length === 0) return null;

            const typeLabel = type.replace('duplicate-', '').replace('-', ' ');

            return (
              <div key={type} style={{ marginBottom: '8px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#666',
                    textTransform: 'capitalize',
                    marginBottom: '4px'
                  }}
                >
                  {typeLabel} ({typeErrors.length})
                </div>
                <ul style={{ margin: '0', paddingLeft: '16px', fontSize: '12px' }}>
                  {typeErrors.map((error, index) => (
                    <li key={`${error.cellId}-${index}`} style={{ marginBottom: '2px' }}>
                      {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
