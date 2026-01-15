import * as React from 'react';
import { useCallback } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export interface IKeyValueRow {
  key: string;
  value: string;
}

export interface IKeyValueTableEditorProps {
  rows: ReadonlyArray<IKeyValueRow>;
  onChange: (rows: IKeyValueRow[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

export function KeyValueTableEditor({
  rows,
  onChange,
  keyPlaceholder = 'key',
  valuePlaceholder = 'value',
  emptyMessage = 'No entries',
  disabled = false
}: IKeyValueTableEditorProps): React.ReactElement {
  const updateRow = useCallback(
    (index: number, patch: Partial<IKeyValueRow>): void => {
      const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r));
      onChange(next);
    },
    [onChange, rows]
  );

  const removeRow = useCallback(
    (index: number): void => {
      const next = rows.filter((_, i) => i !== index);
      onChange(next);
    },
    [onChange, rows]
  );

  const addRow = useCallback((): void => {
    onChange([...(rows as IKeyValueRow[]), { key: '', value: '' }]);
  }, [onChange, rows]);

  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <input
                type="text"
                value={row.key}
                onChange={(e) => updateRow(index, { key: e.target.value })}
                placeholder={keyPlaceholder}
                disabled={disabled}
                className="col-span-5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <input
                type="text"
                value={row.value}
                onChange={(e) => updateRow(index, { value: e.target.value })}
                placeholder={valuePlaceholder}
                disabled={disabled}
                className="col-span-6 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={disabled}
                className="col-span-1 flex items-center justify-center h-10 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                aria-label="Remove row"
                title="Remove"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        disabled={disabled}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
      >
        <PlusIcon className="w-4 h-4" />
        Add row
      </button>
    </div>
  );
}
