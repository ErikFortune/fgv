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

/**
 * Clipboard JSON import helper for tab list header paste actions.
 *
 * Standardizes the common workflow used in multiple tabs:
 * - read text from clipboard
 * - strip markdown code fences
 * - parse JSON
 * - run converter validation
 * - invoke caller-provided entity handler
 * - log consistent diagnostics
 *
 * @packageDocumentation
 */

import { useCallback } from 'react';

import type { Result } from '@fgv/ts-utils';

import { useWorkspace } from '../workspace';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for {@link useClipboardJsonImport}.
 * @public
 */
export interface IClipboardJsonImportOptions<TEntity> {
  /** Human-friendly entity label for log messages. */
  readonly entityLabel: string;

  /** Converter/validator for parsed JSON payload. */
  readonly convert: (from: unknown) => Result<TEntity>;

  /** Called with validated entity payload. May be async. */
  readonly onValid: (entity: TEntity) => void | Promise<void>;

  /** Optional info message logged after successful onValid callback. */
  readonly onValidSuccessMessage?: (entity: TEntity) => string;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Returns a callback that imports validated JSON from the clipboard.
 * @public
 */
export function useClipboardJsonImport<TEntity>(options: IClipboardJsonImportOptions<TEntity>): () => void {
  const { entityLabel, convert, onValid, onValidSuccessMessage } = options;
  const workspace = useWorkspace();

  return useCallback((): void => {
    navigator.clipboard.readText().then(
      (text) => {
        if (!text.trim()) {
          workspace.data.logger.info('Clipboard is empty');
          return;
        }

        const stripped = text
          .trim()
          .replace(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?\s*```$/, '$1')
          .trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(stripped);
        } catch (err: unknown) {
          const detail = err instanceof Error ? err.message : String(err);
          workspace.data.logger.error(`Clipboard does not contain valid JSON: ${detail}`);
          return;
        }

        const result = convert(parsed);
        if (result.isFailure()) {
          workspace.data.logger.error(`${entityLabel} validation failed: ${result.message}`);
          return;
        }

        Promise.resolve(onValid(result.value))
          .then(() => {
            if (onValidSuccessMessage) {
              workspace.data.logger.info(onValidSuccessMessage(result.value));
            }
          })
          .catch((err: unknown) => {
            const detail = err instanceof Error ? err.message : String(err);
            workspace.data.logger.error(`Failed to apply ${entityLabel} from clipboard: ${detail}`);
          });
      },
      (err: unknown) => {
        const detail = err instanceof Error ? err.message : String(err);
        workspace.data.logger.error(`Failed to read clipboard: ${detail}`);
      }
    );
  }, [workspace, entityLabel, convert, onValid, onValidSuccessMessage]);
}
