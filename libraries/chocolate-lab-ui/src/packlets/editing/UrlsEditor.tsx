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
 * Editable list of categorized URLs (ICategorizedUrl[]).
 * @packageDocumentation
 */

import React, { useCallback } from 'react';

import { type Model as CommonModel, type UrlCategory, DefaultUrlCategory } from '@fgv/ts-chocolate';
import { EditSection } from '@fgv/ts-app-shell';

/**
 * Props for the UrlsEditor component.
 * @public
 */
export interface IUrlsEditorProps {
  /** Current URLs (undefined means no URLs) */
  readonly value: ReadonlyArray<CommonModel.ICategorizedUrl> | undefined;
  /** Called when URLs change (empty array → undefined) */
  readonly onChange: (value: ReadonlyArray<CommonModel.ICategorizedUrl> | undefined) => void;
  /** Section title (defaults to "URLs") */
  readonly title?: string;
}

/**
 * Editor for an array of categorized URLs.
 * Each URL has a category (free-form string) and a URL string.
 * Supports adding and removing individual URLs.
 * @public
 */
export function UrlsEditor({ value, onChange, title }: IUrlsEditorProps): React.ReactElement {
  const urls = value ?? [];

  const handleAdd = useCallback(() => {
    onChange([...urls, { category: DefaultUrlCategory, url: '' }]);
  }, [urls, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const updated = urls.filter((__url, i) => i !== index);
      onChange(updated.length > 0 ? updated : undefined);
    },
    [urls, onChange]
  );

  const handleCategoryChange = useCallback(
    (index: number, category: string) => {
      const updated = urls.map((u, i) => (i === index ? { ...u, category: category as UrlCategory } : u));
      onChange(updated);
    },
    [urls, onChange]
  );

  const handleUrlChange = useCallback(
    (index: number, url: string) => {
      const updated = urls.map((u, i) => (i === index ? { ...u, url } : u));
      onChange(updated);
    },
    [urls, onChange]
  );

  return (
    <EditSection title={title ?? 'URLs'}>
      {urls.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 py-1">
          <input
            type="text"
            value={entry.category}
            onChange={(e) => handleCategoryChange(index, e.target.value)}
            placeholder="category"
            className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
          />
          <input
            type="url"
            value={entry.url}
            onChange={(e) => handleUrlChange(index, e.target.value)}
            placeholder="https://..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="text-gray-400 hover:text-red-500 p-1"
            aria-label="Remove URL"
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
        + Add URL
      </button>
    </EditSection>
  );
}
