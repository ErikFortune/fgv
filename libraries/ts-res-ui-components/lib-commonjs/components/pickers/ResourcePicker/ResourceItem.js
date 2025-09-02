'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResourceItem = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importDefault(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
/**
 * Individual resource item with annotation support
 */
const ResourceItem = ({
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
}) => {
  const name = displayName || resourceId;
  // Highlight search term in the name
  const highlightedName = react_1.default.useMemo(() => {
    if (!searchTerm) {
      return react_1.default.createElement('span', null, name);
    }
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = name.split(regex);
    return react_1.default.createElement(
      'span',
      null,
      parts.map((part, index) =>
        regex.test(part)
          ? react_1.default.createElement('mark', { key: index, className: 'bg-yellow-200' }, part)
          : react_1.default.createElement('span', { key: index }, part)
      )
    );
  }, [name, searchTerm]);
  // Get badge styling based on variant
  const getBadgeClasses = (variant) => {
    const baseClasses = 'px-1.5 py-0.5 text-xs font-medium rounded';
    const variantClasses = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      edited: 'bg-purple-100 text-purple-800',
      new: 'bg-emerald-100 text-emerald-800'
    };
    return `${baseClasses} ${variantClasses[variant] || variantClasses.info}`;
  };
  return react_1.default.createElement(
    'div',
    {
      className: `
        flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 
        border-b border-gray-100 last:border-b-0
        ${isSelected ? 'bg-purple-50 border-l-2 border-purple-500' : ''}
        ${isPending ? 'opacity-70 italic' : ''}
        ${searchTerm && name.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bg-yellow-50' : ''}
        ${annotation?.className || ''}
        ${className}
      `,
      onClick: () =>
        onClick({
          resourceId,
          resourceData,
          isPending,
          pendingType
        }),
      title: resourceId
    },
    react_1.default.createElement(
      'div',
      { className: 'flex-shrink-0 mr-2' },
      isPending
        ? react_1.default.createElement(outline_1.PlusCircleIcon, { className: 'w-4 h-4 text-emerald-500' })
        : react_1.default.createElement(outline_1.DocumentTextIcon, { className: 'w-4 h-4 text-green-500' })
    ),
    react_1.default.createElement(
      'span',
      {
        className: `
          text-sm truncate flex-1
          ${isSelected ? 'font-medium text-purple-900' : 'text-gray-700'}
        `
      },
      highlightedName
    ),
    annotation &&
      react_1.default.createElement(
        'div',
        { className: 'flex items-center gap-2 ml-2' },
        annotation.indicator &&
          react_1.default.createElement(
            'span',
            { className: 'text-xs', title: annotation.indicator.tooltip },
            annotation.indicator.type === 'dot'
              ? react_1.default.createElement('span', { className: 'text-orange-500' }, '\u25CF')
              : annotation.indicator.value
          ),
        annotation.badge &&
          react_1.default.createElement(
            'span',
            { className: getBadgeClasses(annotation.badge.variant) },
            annotation.badge.text
          ),
        annotation.suffix &&
          react_1.default.createElement('span', { className: 'text-xs text-gray-500' }, annotation.suffix)
      )
  );
};
exports.ResourceItem = ResourceItem;
exports.default = exports.ResourceItem;
//# sourceMappingURL=ResourceItem.js.map
