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

import React from 'react';

/**
 * Configuration for a single mode in the mode selector.
 * @public
 */
export interface IModeConfig<TMode extends string> {
  /** Mode identifier */
  readonly id: TMode;
  /** Display label */
  readonly label: string;
}

/**
 * Props for the ModeSelector component.
 * @public
 */
export interface IModeSelectorProps<TMode extends string> {
  /** Available modes */
  readonly modes: ReadonlyArray<IModeConfig<TMode>>;
  /** Currently active mode */
  readonly activeMode: TMode;
  /** Callback when a mode is selected */
  readonly onModeChange: (mode: TMode) => void;
  /** Optional right-side content (e.g., settings gear icon) */
  readonly rightContent?: React.ReactNode;
  /** Application title */
  readonly title: string;
}

/**
 * Top-level mode selector bar.
 * Renders the application title, mode toggle buttons, and optional right-side content.
 * @public
 */
export function ModeSelector<TMode extends string>(props: IModeSelectorProps<TMode>): React.ReactElement {
  const { modes, activeMode, onModeChange, rightContent, title } = props;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-choco-primary text-white">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-semibold whitespace-nowrap">{title}</h1>
        <div className="flex gap-1">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={(): void => onModeChange(mode.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeMode === mode.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-current={activeMode === mode.id ? 'true' : undefined}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
      {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
    </div>
  );
}
