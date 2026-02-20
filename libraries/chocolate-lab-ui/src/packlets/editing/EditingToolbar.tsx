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
 * Toolbar component for entity editors with undo/redo/save/cancel buttons.
 *
 * Renders a compact horizontal bar that sits above the editor form.
 * Buttons are disabled when their action is unavailable (e.g., undo when
 * there is nothing to undo).
 *
 * @packageDocumentation
 */

import React from 'react';

import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CheckIcon,
  XMarkIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/20/solid';

import { MultiActionButton } from '@fgv/ts-app-shell';
import type { IMultiActionButtonAction } from '@fgv/ts-app-shell';

import type { IEditable, IEditingContext } from './useEditingContext';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the EditingToolbar component.
 * @public
 */
export interface IEditingToolbarProps<TWrapper extends IEditable> {
  /** The editing context from useEditingContext. */
  readonly context: IEditingContext<TWrapper>;
  /** Optional extra class name for the toolbar container. */
  readonly className?: string;
  /** Optional extra buttons to render in the toolbar (e.g. Preview). */
  readonly extraButtons?: React.ReactNode;
  /** Optional custom save button to replace the default save/saveAs buttons. */
  readonly customSaveButton?: React.ReactNode;
}

// ============================================================================
// Toolbar Button Helper
// ============================================================================

function ToolbarButton({
  onClick,
  disabled,
  title,
  variant,
  children
}: {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly title: string;
  readonly variant: 'default' | 'primary' | 'danger';
  readonly children: React.ReactNode;
}): React.ReactElement {
  const baseClasses =
    'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  const variantClasses: Record<string, string> = {
    default: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
    primary: 'text-white bg-choco-primary hover:bg-choco-primary/90',
    danger: 'text-gray-600 hover:text-red-600 hover:bg-red-50'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
}

// ============================================================================
// EditingToolbar Component
// ============================================================================

/**
 * Compact editing toolbar with undo, redo, save, and cancel buttons.
 *
 * Usage:
 * ```tsx
 * const ctx = useEditingContext({ wrapper, onSave, onCancel });
 * return <EditingToolbar context={ctx} />;
 * ```
 *
 * @public
 */
export function EditingToolbar<TWrapper extends IEditable>(
  props: IEditingToolbarProps<TWrapper>
): React.ReactElement {
  const { context, className, extraButtons, customSaveButton } = props;

  return (
    <div className={`flex flex-col border-b border-gray-200 bg-gray-50 ${className ?? ''}`}>
      {/* Read-only info banner */}
      {context.readOnly && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs">
          <span>Read-only source — use &ldquo;Save to&hellip;&rdquo; to save to a writable collection.</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5">
        {/* Undo / Redo group */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={context.undo}
            disabled={!context.canUndo}
            title="Undo (Ctrl+Z)"
            variant="default"
          >
            <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={context.redo}
            disabled={!context.canRedo}
            title="Redo (Ctrl+Shift+Z)"
            variant="default"
          >
            <ArrowUturnRightIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Extra buttons (e.g. Preview) */}
        {extraButtons}

        {/* Save / Cancel group */}
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={context.cancel} title="Cancel editing" variant="danger">
            <XMarkIcon className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </ToolbarButton>
          {(() => {
            if (customSaveButton) return customSaveButton;
            const actions: IMultiActionButtonAction[] = [];
            if (!context.readOnly) {
              actions.push({
                id: 'save',
                label: 'Save',
                icon: <CheckIcon className="h-3.5 w-3.5" />,
                onSelect: context.save
              });
            }
            if (context.saveAs) {
              actions.push({
                id: 'save-to',
                label: 'Save to\u2026',
                icon: <DocumentDuplicateIcon className="h-3.5 w-3.5" />,
                onSelect: context.saveAs
              });
            }
            if (actions.length === 0) return null;
            return (
              <MultiActionButton
                primaryAction={actions[0]!}
                alternativeActions={actions.slice(1)}
                variant="primary"
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}
