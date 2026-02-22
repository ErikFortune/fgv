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
 * Bootstrap settings section — controls preload options (includeBuiltIn, localStorage).
 * Changes here require a page reload to take effect.
 * @packageDocumentation
 */

import React from 'react';

import type { Logging } from '@fgv/ts-utils';

import type { IBootstrapSettingsDraft } from '../useSettingsDraft';

// ============================================================================
// Log Level Options
// ============================================================================

const LOG_LEVEL_OPTIONS: ReadonlyArray<{ readonly value: Logging.ReporterLogLevel; readonly label: string }> =
  [
    { value: 'all', label: 'All (including detail)' },
    { value: 'detail', label: 'Detail' },
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error only' },
    { value: 'silent', label: 'Silent' }
  ];

// ============================================================================
// Log Level Row
// ============================================================================

function LogLevelRow({
  label,
  description,
  value,
  defaultLabel,
  onChange
}: {
  readonly label: string;
  readonly description: string;
  readonly value: Logging.ReporterLogLevel | undefined;
  readonly defaultLabel: string;
  readonly onChange: (value: Logging.ReporterLogLevel | undefined) => void;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <select
        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-choco-accent"
        value={value ?? ''}
        onChange={(e): void => {
          const v = e.target.value;
          onChange(v === '' ? undefined : (v as Logging.ReporterLogLevel));
        }}
      >
        <option value="">{defaultLabel}</option>
        {LOG_LEVEL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// Toggle Row
// ============================================================================

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}): React.ReactElement {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e): void => onChange(e.target.checked)}
        />
        <div
          className={`w-9 h-5 rounded-full transition-colors ${
            checked ? 'bg-choco-accent' : 'bg-gray-200 group-hover:bg-gray-300'
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
    </label>
  );
}

// ============================================================================
// Props
// ============================================================================

export interface IBootstrapSectionProps {
  readonly bootstrap: IBootstrapSettingsDraft;
  readonly onChange: (updates: Partial<IBootstrapSettingsDraft>) => void;
  readonly hasRestartPending: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function BootstrapSection(props: IBootstrapSectionProps): React.ReactElement {
  const { bootstrap, onChange, hasRestartPending } = props;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Startup Configuration</h2>
        <p className="text-xs text-gray-400">
          These settings control what data is loaded at startup. Changes take effect after a page reload.
        </p>
      </div>

      {/* Restart required banner */}
      {hasRestartPending && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-md">
          <svg
            className="w-4 h-4 text-amber-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <span className="text-xs text-amber-700 font-medium">
            Reload required — these changes will take effect after you reload the page.
          </span>
        </div>
      )}

      {/* Built-in library */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data Sources</p>
        <ToggleRow
          label="Include built-in library"
          description="Load the embedded built-in chocolate library data (ingredients, fillings, procedures, etc.)."
          checked={bootstrap.includeBuiltIn}
          onChange={(v): void => onChange({ includeBuiltIn: v })}
        />
      </div>

      {/* Local storage */}
      <div className="space-y-4 pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Browser Storage</p>
        <ToggleRow
          label="Load library data from browser storage"
          description="Load entity collections (ingredients, fillings, etc.) stored in browser local storage."
          checked={bootstrap.localStorageLibrary}
          onChange={(v): void => onChange({ localStorageLibrary: v })}
        />
        <ToggleRow
          label="Load user data from browser storage"
          description="Load journals, sessions, and inventory stored in browser local storage."
          checked={bootstrap.localStorageUserData}
          onChange={(v): void => onChange({ localStorageUserData: v })}
        />
      </div>

      {/* Logging */}
      <div className="space-y-4 pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Logging</p>
        <LogLevelRow
          label="Store level"
          description="Minimum severity admitted into the message log."
          value={bootstrap.storeLevel}
          defaultLabel="Default (info)"
          onChange={(v): void => onChange({ storeLevel: v })}
        />
        <LogLevelRow
          label="Display level"
          description="Initial minimum severity shown in the log panel (can be changed interactively)."
          value={bootstrap.displayLevel}
          defaultLabel="Default (info)"
          onChange={(v): void => onChange({ displayLevel: v })}
        />
        <LogLevelRow
          label="Toast level"
          description="Minimum severity that triggers a toast popup notification."
          value={bootstrap.toastLevel}
          defaultLabel="Default (warning)"
          onChange={(v): void => onChange({ toastLevel: v })}
        />
      </div>
    </div>
  );
}
