import React, { useState, useCallback } from 'react';
import { CogIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ResourcePickerOptions } from '../pickers/ResourcePicker/types';

/**
 * Props for the ResourcePickerOptionsControl component.
 * @public
 */
export interface ResourcePickerOptionsControlProps {
  /** Current picker options */
  options: ResourcePickerOptions;
  /** Callback when options change */
  onOptionsChange: (options: ResourcePickerOptions) => void;
  /** How to present the options control (default: 'hidden' for production use) */
  presentation?: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
  /** Custom class name */
  className?: string;
  /** Available quick branch paths for selection */
  quickBranchPaths?: string[];
  /** Whether to show advanced options like branch isolation */
  showAdvanced?: boolean;
  /** Title for the control section */
  title?: string;
}

/**
 * Reusable control for configuring ResourcePicker options.
 *
 * Provides a clean interface for adjusting picker behavior including:
 * - View mode selection (list/tree)
 * - Search and view toggle settings
 * - Branch isolation configuration
 * - Quick path selection buttons
 *
 * Can be rendered in multiple presentation modes:
 * - 'hidden': Not displayed (default for production)
 * - 'inline': Always expanded with full controls visible
 * - 'collapsible': Expandable/collapsible section
 * - 'popover': Small dropdown overlay
 * - 'popup': Full modal dialog
 *
 * @public
 */
export const ResourcePickerOptionsControl: React.FC<ResourcePickerOptionsControlProps> = ({
  options,
  onOptionsChange,
  presentation = 'hidden',
  className = '',
  quickBranchPaths = ['strings', 'app', 'images', 'app.ui'],
  showAdvanced = true,
  title = 'Picker Options'
}) => {
  // Early return for hidden presentation
  if (presentation === 'hidden') {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(presentation === 'inline');
  const [showPopover, setShowPopover] = useState(false);

  const handleOptionChange = useCallback(
    <K extends keyof ResourcePickerOptions>(key: K, value: ResourcePickerOptions[K]) => {
      onOptionsChange({
        ...options,
        [key]: value
      });
    },
    [options, onOptionsChange]
  );

  const handleQuickPathSelect = useCallback(
    (path: string) => {
      handleOptionChange('rootPath', path);
    },
    [handleOptionChange]
  );

  const clearRootPath = useCallback(() => {
    handleOptionChange('rootPath', undefined);
    handleOptionChange('hideRootNode', false);
  }, [handleOptionChange]);

  const renderControls = () => (
    <div className="space-y-4">
      {/* Basic Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">View Settings</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Default View</label>
            <select
              value={options.defaultView || 'list'}
              onChange={(e) => handleOptionChange('defaultView', e.target.value as 'list' | 'tree')}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="list">List</option>
              <option value="tree">Tree</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search Scope</label>
            <select
              value={options.searchScope || 'all'}
              onChange={(e) => handleOptionChange('searchScope', e.target.value as 'all' | 'current-branch')}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={!options.enableSearch}
            >
              <option value="all">All Resources</option>
              <option value="current-branch">Current Branch</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={options.enableSearch ?? true}
              onChange={(e) => handleOptionChange('enableSearch', e.target.checked)}
              className="mr-2 rounded"
            />
            Enable Search
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={options.showViewToggle ?? true}
              onChange={(e) => handleOptionChange('showViewToggle', e.target.checked)}
              className="mr-2 rounded"
            />
            Show View Toggle
          </label>
        </div>

        {options.enableSearch && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search Placeholder</label>
            <input
              type="text"
              value={options.searchPlaceholder || ''}
              onChange={(e) => handleOptionChange('searchPlaceholder', e.target.value || undefined)}
              placeholder="Search resources..."
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Branch Isolation */}
      {showAdvanced && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700">Branch Isolation</h4>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Root Path</label>
            <input
              type="text"
              value={options.rootPath || ''}
              onChange={(e) => handleOptionChange('rootPath', e.target.value || undefined)}
              placeholder="e.g., strings or app.ui"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Show only resources under this path</p>
          </div>

          <div>
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={options.hideRootNode ?? false}
                onChange={(e) => handleOptionChange('hideRootNode', e.target.checked)}
                className="mr-2 rounded"
                disabled={!options.rootPath}
              />
              Hide Root Node
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-5">
              Show only children of root path (requires Root Path)
            </p>
          </div>

          {/* Quick Branch Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Quick Paths</label>
            <div className="flex flex-wrap gap-1">
              {quickBranchPaths.map((path) => (
                <button
                  key={path}
                  onClick={() => handleQuickPathSelect(path)}
                  className={`px-2 py-1 text-xs rounded border ${
                    options.rootPath === path
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {path}
                </button>
              ))}
              <button
                onClick={clearRootPath}
                className={`px-2 py-1 text-xs rounded border ${
                  !options.rootPath
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Settings */}
      <div className="space-y-3 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">Display</h4>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Empty Message</label>
          <input
            type="text"
            value={options.emptyMessage || ''}
            onChange={(e) => handleOptionChange('emptyMessage', e.target.value || undefined)}
            placeholder="No resources available"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
          <input
            type="text"
            value={options.height || ''}
            onChange={(e) => handleOptionChange('height', e.target.value || undefined)}
            placeholder="600px"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">CSS height value (px, rem, %, etc.)</p>
        </div>
      </div>
    </div>
  );

  if (presentation === 'popover') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowPopover(!showPopover)}
          className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <CogIcon className="w-3 h-3 mr-1" />
          {title}
          <ChevronDownIcon className="w-3 h-3 ml-1" />
        </button>

        {showPopover && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setShowPopover(false)} />

            {/* Popover */}
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">{title}</h3>
                <button
                  onClick={() => setShowPopover(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              {renderControls()}
            </div>
          </>
        )}
      </div>
    );
  }

  if (presentation === 'collapsible') {
    return (
      <div className={`border border-gray-200 rounded-lg ${className}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
        >
          <span className="flex items-center">
            <CogIcon className="w-4 h-4 mr-2" />
            {title}
          </span>
          {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </button>

        {isExpanded && <div className="p-4 border-t border-gray-200">{renderControls()}</div>}
      </div>
    );
  }

  if (presentation === 'popup') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setShowPopover(!showPopover)}
          className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <CogIcon className="w-3 h-3 mr-1" />
          {title}
          <ChevronDownIcon className="w-3 h-3 ml-1" />
        </button>

        {showPopover && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowPopover(false)} />

            {/* Modal Popup */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                  <button
                    onClick={() => setShowPopover(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">{renderControls()}</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // presentation === 'inline'
  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
        <CogIcon className="w-4 h-4 mr-2" />
        {title}
      </h3>
      {renderControls()}
    </div>
  );
};

export default ResourcePickerOptionsControl;
