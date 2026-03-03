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
 * Gate component shown when the user attempts to edit a read-only entity.
 * Instead of rendering a full editor with disabled fields, this provides a clear
 * message and a "Save Copy" action to create an editable copy in a writable collection.
 * @packageDocumentation
 */

import React from 'react';
import { LockClosedIcon, DocumentDuplicateIcon } from '@heroicons/react/20/solid';

/**
 * Props for the ReadOnlyEditGate component.
 * @public
 */
export interface IReadOnlyEditGateProps {
  /** Display name of the entity being edited */
  readonly entityName: string;
  /** Callback to save a copy to a writable collection */
  readonly onSaveCopy?: () => void;
  /** Callback to cancel and return to the detail view */
  readonly onCancel: () => void;
}

/**
 * Informational panel shown when a user tries to edit an entity from a read-only collection.
 * Provides a clear message and actions to either save a copy or cancel.
 * @public
 */
export function ReadOnlyEditGate({
  entityName,
  onSaveCopy,
  onCancel
}: IReadOnlyEditGateProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50">
        <LockClosedIcon className="w-6 h-6 text-amber-500" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-800">{entityName} is in a read-only collection</h3>
        <p className="text-xs text-gray-500 max-w-xs">
          {onSaveCopy
            ? 'Save a copy to a writable collection to edit it.'
            : 'No writable collection is available. Create a collection first.'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
        >
          Cancel
        </button>
        {onSaveCopy && (
          <button
            type="button"
            onClick={onSaveCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded transition-colors"
          >
            <DocumentDuplicateIcon className="w-3.5 h-3.5" />
            Save Copy
          </button>
        )}
      </div>
    </div>
  );
}
