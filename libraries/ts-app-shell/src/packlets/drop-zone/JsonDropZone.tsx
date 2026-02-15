/*
 * Copyright (c) 2026 Erik Fortune
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

import React, { useCallback, useState } from 'react';
import { Converter } from '@fgv/ts-utils';

/**
 * Strips markdown code fences from text.
 * AI agents often wrap JSON in code fences.
 * @param text - Raw text that may contain code fences
 * @returns Text with outer code fences removed
 * @internal
 */
export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fencePattern = /^```(?:\w+)?\s*\n?([\s\S]*?)\n?\s*```$/;
  const match = fencePattern.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

/**
 * Props for the JsonDropZone component.
 * @typeParam T - The expected validated type
 * @public
 */
export interface IJsonDropZoneProps<T> {
  /** Converter to validate parsed JSON against */
  readonly converter: Converter<T>;
  /** Called with the validated value on successful drop/paste */
  readonly onValueReceived: (value: T) => void;
  /** Called with an error message on parse/validation failure */
  readonly onError?: (message: string) => void;
  /** Externally-controlled error message to display */
  readonly error?: string;
  /** Placeholder hint text */
  readonly hint?: string;
  /** Additional CSS class names */
  readonly className?: string;
}

/**
 * Generic JSON drop/paste target with converter-based validation.
 * Accepts text via drag-and-drop or paste, strips markdown code fences,
 * parses as JSON, validates through the provided converter, and calls
 * the appropriate callback.
 *
 * @typeParam T - The expected validated type
 * @public
 */
export function JsonDropZone<T>(props: IJsonDropZoneProps<T>): React.ReactElement {
  const { converter, onValueReceived, onError, error, hint, className } = props;
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalError, setInternalError] = useState<string | undefined>(undefined);

  const displayError = error ?? internalError;

  const processText = useCallback(
    (rawText: string): void => {
      setInternalError(undefined);

      const stripped = stripCodeFences(rawText);

      let parsed: unknown;
      try {
        parsed = JSON.parse(stripped);
      } catch {
        const message = 'Invalid JSON: could not parse the dropped text.';
        setInternalError(message);
        onError?.(message);
        return;
      }

      const result = converter.convert(parsed);
      if (result.isSuccess()) {
        setInternalError(undefined);
        onValueReceived(result.value);
      } else {
        const message = `Validation failed: ${result.message}`;
        setInternalError(message);
        onError?.(message);
      }
    },
    [converter, onValueReceived, onError]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text');
      if (text) {
        processText(text);
      } else {
        const message = 'No text data found in the dropped content.';
        setInternalError(message);
        onError?.(message);
      }
    },
    [processText, onError]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>): void => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain') || e.clipboardData.getData('text');
      if (text) {
        processText(text);
      }
    },
    [processText]
  );

  const borderClass = displayError
    ? 'border-red-400 bg-red-50'
    : isDragOver
    ? 'border-blue-400 bg-blue-50'
    : 'border-gray-300 bg-gray-50';

  return (
    <div
      className={`border-2 border-dashed rounded-md p-3 text-center text-sm transition-colors cursor-default ${borderClass} ${
        className ?? ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
      role="region"
      aria-label={hint ?? 'Drop or paste JSON here'}
    >
      {displayError ? (
        <span className="text-red-600 text-xs">{displayError}</span>
      ) : (
        <span className="text-gray-500">{hint ?? 'Drop or paste JSON here'}</span>
      )}
    </div>
  );
}
