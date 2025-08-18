import React, { useState, useCallback } from 'react';
import { CogIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ResolutionContextOptions, QualifierControlOptions } from '../../types';

/**
 * Props for the ResolutionContextOptionsControl component.
 * @public
 */
export interface ResolutionContextOptionsControlProps {
  /** Current context options */
  options: ResolutionContextOptions;
  /** Callback when options change */
  onOptionsChange: (options: ResolutionContextOptions) => void;
  /** Available qualifiers for configuration */
  availableQualifiers?: string[];
  /** How to present the options control (default: 'hidden' for production use) */
  presentation?: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
  /** Custom class name */
  className?: string;
  /** Title for the control section */
  title?: string;
}

/**
 * Reusable control for configuring ResolutionView context options.
 *
 * Provides a clean interface for adjusting context behavior including:
 * - Visibility of context controls, current context display, and action buttons
 * - Per-qualifier options (visibility, editability, host values)
 * - Global defaults and appearance customization
 *
 * Can be rendered in multiple presentation modes:
 * - 'hidden': Not displayed (default for production)
 * - 'inline': Always expanded with full controls visible
 * - 'collapsible': Expandable/collapsible section
 * - 'popover': Small dropdown overlay
 * - 'popup': Full modal dialog
 *
 * @example
 * ```tsx
 * import { ResolutionContextOptionsControl } from '@fgv/ts-res-ui-components';
 *
 * function ContextConfiguration() {
 *   const [contextOptions, setContextOptions] = useState<ResolutionContextOptions>({});
 *
 *   return (
 *     <ResolutionContextOptionsControl
 *       options={contextOptions}
 *       onOptionsChange={setContextOptions}
 *       availableQualifiers={['language', 'platform', 'env']}
 *       presentation="collapsible"
 *       title="Context Configuration"
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const ResolutionContextOptionsControl: React.FC<ResolutionContextOptionsControlProps> = ({
  options,
  onOptionsChange,
  availableQualifiers = [],
  presentation = 'hidden',
  className = '',
  title = 'Context Options'
}) => {
  // Early return for hidden presentation
  if (presentation === 'hidden') {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(presentation === 'inline');
  const [showPopover, setShowPopover] = useState(false);

  const handleOptionChange = useCallback(
    <K extends keyof ResolutionContextOptions>(key: K, value: ResolutionContextOptions[K]) => {
      onOptionsChange({
        ...options,
        [key]: value
      });
    },
    [options, onOptionsChange]
  );

  const handleQualifierOptionChange = useCallback(
    (qualifierName: string, optionKey: keyof QualifierControlOptions, value: any) => {
      const currentQualifierOptions = options.qualifierOptions || {};
      const currentOptions = currentQualifierOptions[qualifierName] || {};

      const updatedQualifierOptions = {
        ...currentQualifierOptions,
        [qualifierName]: {
          ...currentOptions,
          [optionKey]: value
        }
      };

      handleOptionChange('qualifierOptions', updatedQualifierOptions);
    },
    [options.qualifierOptions, handleOptionChange]
  );

  const handleHostManagedValueChange = useCallback(
    (qualifierName: string, value: string | undefined) => {
      const currentHostValues = options.hostManagedValues || {};
      const updatedHostValues = {
        ...currentHostValues,
        [qualifierName]: value || undefined
      };

      // Remove undefined values to keep object clean
      if (value === undefined || value === '') {
        delete updatedHostValues[qualifierName];
      }

      handleOptionChange('hostManagedValues', updatedHostValues);
    },
    [options.hostManagedValues, handleOptionChange]
  );

  const renderControls = () => (
    <div className="space-y-4">
      {/* Visibility Settings */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Context Panel Visibility</h4>

        <div className="space-y-2">
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={options.showContextControls !== false}
              onChange={(e) => handleOptionChange('showContextControls', e.target.checked)}
              className="mr-2 rounded"
            />
            Show Context Controls
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={options.showCurrentContext !== false}
              onChange={(e) => handleOptionChange('showCurrentContext', e.target.checked)}
              className="mr-2 rounded"
            />
            Show Current Context Display
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={options.showContextActions !== false}
              onChange={(e) => handleOptionChange('showContextActions', e.target.checked)}
              className="mr-2 rounded"
            />
            Show Context Action Buttons
          </label>
        </div>
      </div>

      {/* Global Defaults */}
      <div className="space-y-3 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">Global Defaults</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={options.defaultQualifierVisible !== false}
              onChange={(e) => handleOptionChange('defaultQualifierVisible', e.target.checked)}
              className="mr-2 rounded"
            />
            Qualifiers Visible by Default
          </label>
          <label className="flex items-center text-xs">
            <input
              type="checkbox"
              checked={options.defaultQualifierEditable !== false}
              onChange={(e) => handleOptionChange('defaultQualifierEditable', e.target.checked)}
              className="mr-2 rounded"
            />
            Qualifiers Editable by Default
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Panel Title</label>
          <input
            type="text"
            value={options.contextPanelTitle || ''}
            onChange={(e) => handleOptionChange('contextPanelTitle', e.target.value || undefined)}
            placeholder="Context Configuration"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Global Placeholder</label>
          <input
            type="text"
            value={typeof options.globalPlaceholder === 'string' ? options.globalPlaceholder : ''}
            onChange={(e) => handleOptionChange('globalPlaceholder', e.target.value || undefined)}
            placeholder="Enter {qualifierName} value"
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Use {'{qualifierName}'} for dynamic qualifier names</p>
        </div>
      </div>

      {/* Per-Qualifier Configuration */}
      {availableQualifiers.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700">Per-Qualifier Settings</h4>

          <div className="space-y-3">
            {availableQualifiers.map((qualifierName) => {
              const qualifierOptions = options.qualifierOptions?.[qualifierName] || {};
              const hostValue = options.hostManagedValues?.[qualifierName];

              return (
                <div key={qualifierName} className="border border-gray-200 rounded p-3">
                  <h5 className="text-xs font-medium text-gray-800 mb-2">{qualifierName}</h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={qualifierOptions.visible !== false}
                        onChange={(e) =>
                          handleQualifierOptionChange(qualifierName, 'visible', e.target.checked)
                        }
                        className="mr-2 rounded"
                      />
                      Visible
                    </label>
                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={qualifierOptions.editable !== false}
                        onChange={(e) =>
                          handleQualifierOptionChange(qualifierName, 'editable', e.target.checked)
                        }
                        className="mr-2 rounded"
                      />
                      Editable
                    </label>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Custom Placeholder
                      </label>
                      <input
                        type="text"
                        value={qualifierOptions.placeholder || ''}
                        onChange={(e) =>
                          handleQualifierOptionChange(
                            qualifierName,
                            'placeholder',
                            e.target.value || undefined
                          )
                        }
                        placeholder={`Enter ${qualifierName} value`}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Host-Managed Value
                      </label>
                      <input
                        type="text"
                        value={hostValue || ''}
                        onChange={(e) => handleHostManagedValueChange(qualifierName, e.target.value)}
                        placeholder="Leave empty for user control"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        When set, overrides user input and makes field readonly
                      </p>
                    </div>

                    <label className="flex items-center text-xs">
                      <input
                        type="checkbox"
                        checked={qualifierOptions.showHostValue !== false}
                        onChange={(e) =>
                          handleQualifierOptionChange(qualifierName, 'showHostValue', e.target.checked)
                        }
                        className="mr-2 rounded"
                      />
                      Show Host-Managed Indicator
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
            <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 max-h-96 overflow-y-auto">
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
              <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
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

export default ResolutionContextOptionsControl;
