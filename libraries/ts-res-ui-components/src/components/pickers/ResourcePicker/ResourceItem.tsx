import React from 'react';
import { DocumentTextIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { IResourceItemProps } from './types';

/**
 * Individual resource item with annotation support
 */
export const ResourceItem = <T = unknown,>({
  resourceId,
  displayName,
  isSelected,
  isPending = false,
  annotation,
  onClick,
  searchTerm = '',
  className = '',
  resourceData,
  pendingType
}: IResourceItemProps<T>): React.ReactElement => {
  const name = displayName || resourceId;

  // Highlight search term in the name
  const highlightedName = React.useMemo(() => {
    if (!searchTerm) {
      return <span>{name}</span>;
    }

    // eslint-disable-next-line @rushstack/security/no-unsafe-regexp
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = name.split(regex);

    return (
      <span>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-yellow-200">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  }, [name, searchTerm]);

  // Get badge styling based on variant
  const getBadgeClasses = (variant: string): string => {
    const baseClasses = 'px-1.5 py-0.5 text-xs font-medium rounded';
    const variantClasses = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      edited: 'bg-purple-100 text-purple-800',
      new: 'bg-emerald-100 text-emerald-800'
    };
    return `${baseClasses} ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.info}`;
  };

  return (
    <div
      className={`
        flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 
        border-b border-gray-100 last:border-b-0
        ${isSelected ? 'bg-purple-50 border-l-2 border-purple-500' : ''}
        ${isPending ? 'opacity-70 italic' : ''}
        ${searchTerm && name.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bg-yellow-50' : ''}
        ${annotation?.className || ''}
        ${className}
      `}
      onClick={() =>
        onClick({
          resourceId,
          resourceData,
          isPending,
          pendingType
        })
      }
      title={resourceId}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mr-2">
        {isPending ? (
          <PlusCircleIcon className="w-4 h-4 text-emerald-500" />
        ) : (
          <DocumentTextIcon className="w-4 h-4 text-green-500" />
        )}
      </div>

      {/* Resource name */}
      <span
        className={`
          text-sm truncate flex-1
          ${isSelected ? 'font-medium text-purple-900' : 'text-gray-700'}
        `}
      >
        {highlightedName}
      </span>

      {/* Annotations */}
      {annotation && (
        <div className="flex items-center gap-2 ml-2">
          {/* Indicator */}
          {annotation.indicator && (
            <span className="text-xs" title={annotation.indicator.tooltip}>
              {annotation.indicator.type === 'dot' ? (
                <span className="text-orange-500">●</span>
              ) : (
                annotation.indicator.value
              )}
            </span>
          )}

          {/* Badge */}
          {annotation.badge && (
            <span className={getBadgeClasses(annotation.badge.variant)}>{annotation.badge.text}</span>
          )}

          {/* Suffix */}
          {annotation.suffix && <span className="text-xs text-gray-500">{annotation.suffix}</span>}
        </div>
      )}
    </div>
  );
};

export default ResourceItem;
