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
 * Editable list of categorized notes (ICategorizedNote[]).
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/20/solid';

import { type Model as CommonModel, type NoteCategory, DefaultNoteCategory } from '@fgv/ts-chocolate';

/**
 * Props for the NotesEditor component.
 * @public
 */
export interface INotesEditorProps {
  /** Current notes (undefined means no notes) */
  readonly value: ReadonlyArray<CommonModel.ICategorizedNote> | undefined;
  /** Called when notes change (empty array → undefined) */
  readonly onChange: (value: ReadonlyArray<CommonModel.ICategorizedNote> | undefined) => void;
  /** Section title (defaults to "Notes") */
  readonly title?: string;
}

/**
 * Editor for an array of categorized notes.
 * Each note has a category (free-form string) and a note text.
 * Supports adding and removing individual notes.
 * @public
 */
export function NotesEditor({ value, onChange, title }: INotesEditorProps): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const notes = value ?? [];

  const handleAdd = useCallback(() => {
    onChange([...notes, { category: DefaultNoteCategory, note: '' }]);
  }, [notes, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const updated = notes.filter((__note, i) => i !== index);
      onChange(updated.length > 0 ? updated : undefined);
    },
    [notes, onChange]
  );

  const handleCategoryChange = useCallback(
    (index: number, category: string) => {
      const updated = notes.map((n, i) => (i === index ? { ...n, category: category as NoteCategory } : n));
      onChange(updated);
    },
    [notes, onChange]
  );

  const handleNoteChange = useCallback(
    (index: number, note: string) => {
      const updated = notes.map((n, i) => (i === index ? { ...n, note } : n));
      onChange(updated);
    },
    [notes, onChange]
  );

  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase mb-0.5">{title ?? 'Notes'}</div>
      {!editing ? (
        <div className="py-0.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(): void => setEditing(true)}
              title={`Edit ${(title ?? 'notes').toLowerCase()}`}
              className="text-gray-400 hover:text-choco-primary p-0.5 shrink-0"
            >
              <ArrowPathIcon className="h-3 w-3" />
            </button>
            {notes.length === 0 ? (
              <span className="text-sm text-gray-400 italic">None</span>
            ) : (
              <div className="space-y-0.5">
                {notes.map((note, index) => (
                  <div key={index} className="text-sm text-gray-700">
                    {note.category !== DefaultNoteCategory && (
                      <span className="text-gray-500">{note.category}: </span>
                    )}
                    {note.note || <span className="text-gray-400 italic">empty</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <button
              type="button"
              onClick={(): void => setEditing(false)}
              title="Done editing"
              className="text-green-600 hover:text-green-700 p-0.5 shrink-0"
            >
              <CheckIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          {notes.map((note, index) => (
            <div key={index} className="flex items-start gap-2 py-1">
              <input
                type="text"
                value={note.category}
                onChange={(e): void => handleCategoryChange(index, e.target.value)}
                placeholder="category"
                className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
              />
              <textarea
                value={note.note}
                onChange={(e): void => handleNoteChange(index, e.target.value)}
                placeholder="note text"
                rows={2}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary resize-y"
              />
              <button
                type="button"
                onClick={(): void => handleRemove(index)}
                className="text-gray-400 hover:text-red-500 p-1"
                aria-label="Remove note"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAdd}
            className="text-xs text-choco-primary hover:text-choco-primary/80 mt-1"
          >
            + Add note
          </button>
        </div>
      )}
    </div>
  );
}
