/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import type { Runtime, ConfectionId } from '@fgv/ts-chocolate';
import { CollectionBadge, TagBadge } from '../common';
import { ConfectionTypeBadge } from './ConfectionTypeBadge';

/**
 * Extract source ID from composite confection ID
 * Inlined to avoid importing Helpers which pulls in crypto module
 * @internal
 */
function getConfectionSourceId(id: ConfectionId): string {
  return id.split('.')[0] ?? '';
}

/**
 * Props for the ConfectionCard component
 * @public
 */
export interface IConfectionCardProps {
  /** Confection to display */
  confection: Runtime.AnyRuntimeConfection;
  /** Whether to show collection badge */
  showCollection?: boolean;
  /** Optional additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether this card is currently selected */
  isSelected?: boolean;
}

/**
 * Displays a confection as a summary card for browse views
 * @public
 */
export function ConfectionCard({
  confection,
  showCollection = true,
  className = '',
  onClick,
  isSelected = false
}: IConfectionCardProps): React.ReactElement {
  const sourceId = getConfectionSourceId(confection.id);
  const isClickable = onClick !== undefined;

  const baseClasses = 'block rounded-lg border p-4 transition-all duration-150 bg-white dark:bg-gray-800';

  const borderClasses = isSelected
    ? 'border-chocolate-500 ring-2 ring-chocolate-500 dark:border-chocolate-400 dark:ring-chocolate-400'
    : 'border-gray-200 dark:border-gray-700';

  const interactiveClasses = isClickable
    ? 'cursor-pointer hover:border-chocolate-300 hover:shadow-md dark:hover:border-chocolate-600'
    : '';

  const combinedClasses = `${baseClasses} ${borderClasses} ${interactiveClasses} ${className}`;

  // Get filling slots count for display
  const goldenVersion = confection.goldenVersion;
  const fillingSlotCount = goldenVersion.fillings?.length ?? 0;

  const content = (
    <>
      {/* Header row with name and confection type */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-base leading-tight">
          {confection.name}
        </h3>
        <ConfectionTypeBadge confectionType={confection.confectionType} size="sm" />
      </div>

      {/* Description if available */}
      {confection.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{confection.description}</p>
      )}

      {/* Confection stats */}
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-2">
        {fillingSlotCount > 0 && (
          <span>
            {fillingSlotCount} filling{fillingSlotCount > 1 ? 's' : ''}
          </span>
        )}
        <span>Yields {confection.yield.count}</span>
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-2 flex-wrap">
        {showCollection && <CollectionBadge name={sourceId} size="sm" />}
        {confection.versions.length > 1 && (
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {confection.versions.length} versions
          </span>
        )}
      </div>

      {/* Tags preview */}
      {confection.effectiveTags && confection.effectiveTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {confection.effectiveTags.slice(0, 3).map((tag: string) => (
            <TagBadge key={tag} tag={tag} size="sm" />
          ))}
          {confection.effectiveTags.length > 3 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              +{confection.effectiveTags.length - 3} more
            </span>
          )}
        </div>
      )}
    </>
  );

  if (isClickable) {
    return (
      <button type="button" className={`${combinedClasses} text-left w-full`} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={combinedClasses}>{content}</div>;
}
