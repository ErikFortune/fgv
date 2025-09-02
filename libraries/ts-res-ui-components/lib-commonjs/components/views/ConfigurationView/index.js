'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConfigurationView = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const useConfigurationState_1 = require('../../../hooks/useConfigurationState');
const ts_res_1 = require('@fgv/ts-res');
const QualifierTypeEditForm_1 = require('../../forms/QualifierTypeEditForm');
const GenericQualifierTypeEditForm_1 = require('../../forms/GenericQualifierTypeEditForm');
const QualifierEditForm_1 = require('../../forms/QualifierEditForm');
const ResourceTypeEditForm_1 = require('../../forms/ResourceTypeEditForm');
/**
 * ConfigurationView component for managing ts-res system configurations.
 *
 * Provides a comprehensive interface for creating, editing, and managing ts-res
 * system configurations including qualifier types, qualifiers, and resource types.
 * Supports import/export functionality and real-time validation.
 *
 * **Key Features:**
 * - **Configuration editing**: Create and modify system configurations
 * - **Qualifier type management**: Add, edit, and remove qualifier types (language, territory, etc.)
 * - **Qualifier management**: Configure specific qualifiers with default values
 * - **Resource type management**: Define and manage resource types
 * - **Import/export**: Load configurations from files or export current settings
 * - **Real-time validation**: Validate configuration changes as you type
 * - **Change tracking**: Track unsaved changes with visual indicators
 *
 * @example
 * ```tsx
 * import { ConfigurationView } from '@fgv/ts-res-ui-components';
 *
 * function MyConfigurationEditor() {
 *   const [config, setConfig] = useState(defaultConfiguration);
 *   const [hasChanges, setHasChanges] = useState(false);
 *
 *   const handleSave = () => {
 *     console.log('Saving configuration...', config);
 *     setHasChanges(false);
 *   };
 *
 *   return (
 *     <ConfigurationView
 *       configuration={config}
 *       onConfigurationChange={(newConfig) => {
 *         setConfig(newConfig);
 *         setHasChanges(true);
 *       }}
 *       onSave={handleSave}
 *       hasUnsavedChanges={hasChanges}
 *       onMessage={(type, message) => console.log(`${type}: ${message}`)}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
const ConfigurationView = ({
  configuration,
  onConfigurationChange,
  onSave,
  hasUnsavedChanges,
  onMessage,
  className = ''
}) => {
  const fileInputRef = (0, react_1.useRef)(null);
  const [editingQualifierType, setEditingQualifierType] = (0, react_1.useState)(null);
  const [editingQualifier, setEditingQualifier] = (0, react_1.useState)(null);
  const [editingResourceType, setEditingResourceType] = (0, react_1.useState)(null);
  const [showAddQualifierType, setShowAddQualifierType] = (0, react_1.useState)(false);
  const [addQualifierTypeMode, setAddQualifierTypeMode] = (0, react_1.useState)(null);
  const [showAddQualifier, setShowAddQualifier] = (0, react_1.useState)(false);
  const [showAddResourceType, setShowAddResourceType] = (0, react_1.useState)(false);
  const { state, actions, templates } = (0, useConfigurationState_1.useConfigurationState)(
    configuration || undefined,
    onConfigurationChange,
    hasUnsavedChanges
      ? undefined
      : (changes) => {
          // Only notify if we weren't already told there are unsaved changes
        }
  );
  // Handle file import
  const handleFileImport = (0, react_1.useCallback)(
    (files) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (content) {
          const result = actions.importFromJson(content);
          if (result.isSuccess()) {
            onMessage?.('success', `Configuration imported from ${file.name}`);
          } else {
            onMessage?.('error', `Import failed: ${result.message}`);
          }
        }
      };
      reader.onerror = () => {
        onMessage?.('error', `Failed to read file: ${file.name}`);
      };
      reader.readAsText(file);
    },
    [actions, onMessage]
  );
  // Handle export
  const handleExport = (0, react_1.useCallback)(() => {
    const result = actions.exportToJson({ format: 'json', pretty: true });
    if (result.isSuccess()) {
      const blob = new Blob([result.value], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ts-res-configuration.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onMessage?.('success', 'Configuration exported successfully');
    } else {
      onMessage?.('error', `Export failed: ${result.message}`);
    }
  }, [actions, onMessage]);
  // Handle template loading
  const handleLoadTemplate = (0, react_1.useCallback)(
    (templateId) => {
      const result = actions.loadTemplate(templateId);
      if (result.isSuccess()) {
        const template = templates.find((t) => t.id === templateId);
        onMessage?.('success', `Loaded template: ${template?.name}`);
      } else {
        onMessage?.('error', `Failed to load template: ${result.message}`);
      }
    },
    [actions, templates, onMessage]
  );
  // Handle save
  const handleSave = (0, react_1.useCallback)(() => {
    if (onSave) {
      onSave(state.currentConfiguration);
      actions.applyConfiguration();
      onMessage?.('success', 'Configuration saved successfully');
    }
  }, [onSave, state.currentConfiguration, actions, onMessage]);
  if (!configuration && !state.currentConfiguration) {
    return react_1.default.createElement(
      'div',
      { className: `p-6 ${className}` },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.CogIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Configuration'
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center' },
        react_1.default.createElement(
          'div',
          { className: 'max-w-2xl mx-auto' },
          react_1.default.createElement(
            'h3',
            { className: 'text-xl font-semibold text-gray-900 mb-4' },
            'No Configuration Available'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-gray-600 mb-6' },
            'Load a configuration to manage qualifiers, qualifier types, and resource types.'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-blue-50 rounded-lg p-4' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-blue-800' },
              react_1.default.createElement('strong', null, 'Configuration Manager:'),
              ' Define and manage system configurations for resource management, including qualifiers, qualifier types, and resource types.'
            )
          )
        )
      )
    );
  }
  return react_1.default.createElement(
    'div',
    { className: `p-6 ${className}` },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-6' },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3' },
        react_1.default.createElement(outline_1.CogIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Configuration'
        ),
        state.hasUnsavedChanges &&
          react_1.default.createElement(
            'span',
            {
              className:
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'
            },
            'Unsaved Changes'
          )
      ),
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-2' },
        react_1.default.createElement(
          'select',
          {
            onChange: (e) => e.target.value && handleLoadTemplate(e.target.value),
            value: '',
            className:
              'px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
          },
          react_1.default.createElement('option', { value: '' }, 'Load Template...'),
          templates.map((template) =>
            react_1.default.createElement('option', { key: template.id, value: template.id }, template.name)
          )
        ),
        react_1.default.createElement(
          'button',
          {
            onClick: () => fileInputRef.current?.click(),
            className:
              'inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
          },
          react_1.default.createElement(outline_1.ArrowUpTrayIcon, { className: 'w-4 h-4 mr-2' }),
          'Import'
        ),
        react_1.default.createElement(
          'button',
          {
            onClick: handleExport,
            className:
              'inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500'
          },
          react_1.default.createElement(outline_1.ArrowDownTrayIcon, { className: 'w-4 h-4 mr-2' }),
          'Export'
        ),
        react_1.default.createElement(
          'button',
          {
            onClick: actions.toggleJsonView,
            className: `inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              state.isJsonView
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`
          },
          state.isJsonView
            ? react_1.default.createElement(
                react_1.default.Fragment,
                null,
                react_1.default.createElement(outline_1.PencilIcon, { className: 'w-4 h-4 mr-2' }),
                'Form View'
              )
            : react_1.default.createElement(
                react_1.default.Fragment,
                null,
                react_1.default.createElement(outline_1.EyeIcon, { className: 'w-4 h-4 mr-2' }),
                'JSON View'
              )
        ),
        onSave &&
          react_1.default.createElement(
            'button',
            {
              onClick: handleSave,
              disabled: !state.hasUnsavedChanges,
              className: `inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium ${
                state.hasUnsavedChanges
                  ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }`
            },
            'Save'
          )
      )
    ),
    !state.validation.isValid &&
      react_1.default.createElement(
        'div',
        { className: 'mb-6 bg-red-50 border border-red-200 rounded-lg p-4' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2 text-red-600 mb-2' },
          react_1.default.createElement(outline_1.ExclamationTriangleIcon, { className: 'w-5 h-5' }),
          react_1.default.createElement('span', { className: 'font-medium' }, 'Configuration Issues')
        ),
        react_1.default.createElement(
          'ul',
          { className: 'text-sm text-red-700 space-y-1' },
          state.validation.errors.map((error, index) =>
            react_1.default.createElement('li', { key: index }, '\u2022 ', error)
          )
        )
      ),
    state.validation.warnings.length > 0 &&
      react_1.default.createElement(
        'div',
        { className: 'mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2 text-yellow-600 mb-2' },
          react_1.default.createElement(outline_1.InformationCircleIcon, { className: 'w-5 h-5' }),
          react_1.default.createElement('span', { className: 'font-medium' }, 'Configuration Warnings')
        ),
        react_1.default.createElement(
          'ul',
          { className: 'text-sm text-yellow-700 space-y-1' },
          state.validation.warnings.map((warning, index) =>
            react_1.default.createElement('li', { key: index }, '\u2022 ', warning)
          )
        )
      ),
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-sm border border-gray-200' },
      state.isJsonView
        ? // JSON Editor View
          react_1.default.createElement(
            'div',
            { className: 'p-6' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-center justify-between mb-4' },
              react_1.default.createElement(
                'h3',
                { className: 'text-lg font-semibold text-gray-900' },
                'JSON Configuration'
              ),
              react_1.default.createElement(
                'button',
                {
                  onClick: () => {
                    const result = actions.applyJsonChanges();
                    if (result.isSuccess()) {
                      onMessage?.('success', 'JSON changes applied');
                    } else {
                      onMessage?.('error', `JSON error: ${result.message}`);
                    }
                  },
                  disabled: !!state.jsonError,
                  className: `px-4 py-2 rounded-md text-sm font-medium ${
                    state.jsonError
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  }`
                },
                'Apply Changes'
              )
            ),
            state.jsonError &&
              react_1.default.createElement(
                'div',
                { className: 'mb-4 bg-red-50 border border-red-200 rounded-lg p-3' },
                react_1.default.createElement('p', { className: 'text-sm text-red-700' }, state.jsonError)
              ),
            react_1.default.createElement('textarea', {
              value: state.jsonString,
              onChange: (e) => actions.updateJsonString(e.target.value),
              className:
                'w-full h-96 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              placeholder: 'Enter JSON configuration...'
            })
          )
        : // Form View
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement(
              'div',
              { className: 'border-b border-gray-200' },
              react_1.default.createElement(
                'nav',
                { className: '-mb-px flex space-x-8 px-6' },
                [
                  {
                    key: 'qualifiers',
                    label: 'Qualifiers',
                    count: state.currentConfiguration.qualifiers?.length || 0
                  },
                  {
                    key: 'qualifierTypes',
                    label: 'Qualifier Types',
                    count: state.currentConfiguration.qualifierTypes?.length || 0
                  },
                  {
                    key: 'resourceTypes',
                    label: 'Resource Types',
                    count: state.currentConfiguration.resourceTypes?.length || 0
                  }
                ].map((tab) =>
                  react_1.default.createElement(
                    'button',
                    {
                      key: tab.key,
                      onClick: () => actions.setActiveTab(tab.key),
                      className: `py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        state.activeTab === tab.key
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`
                    },
                    tab.label,
                    react_1.default.createElement(
                      'span',
                      {
                        className:
                          'ml-2 bg-gray-100 text-gray-900 rounded-full px-2.5 py-0.5 text-xs font-medium'
                      },
                      tab.count
                    )
                  )
                )
              )
            ),
            react_1.default.createElement(
              'div',
              { className: 'p-6' },
              state.activeTab === 'qualifiers' &&
                react_1.default.createElement(QualifiersPanel, {
                  qualifiers: state.currentConfiguration.qualifiers || [],
                  qualifierTypes: state.currentConfiguration.qualifierTypes || [],
                  onUpdateItem: actions.updateQualifier,
                  onRemove: actions.removeQualifier,
                  onShowAdd: () => setShowAddQualifier(true),
                  onEdit: (item, index) => setEditingQualifier({ item, index })
                }),
              state.activeTab === 'qualifierTypes' &&
                react_1.default.createElement(QualifierTypesPanel, {
                  qualifierTypes: state.currentConfiguration.qualifierTypes || [],
                  onUpdateItem: actions.updateQualifierType,
                  onRemove: actions.removeQualifierType,
                  onShowAdd: () => setShowAddQualifierType(true),
                  onEdit: (item, index) => setEditingQualifierType({ item, index })
                }),
              state.activeTab === 'resourceTypes' &&
                react_1.default.createElement(ResourceTypesPanel, {
                  resourceTypes: state.currentConfiguration.resourceTypes || [],
                  onUpdateItem: actions.updateResourceType,
                  onRemove: actions.removeResourceType,
                  onShowAdd: () => setShowAddResourceType(true),
                  onEdit: (item, index) => setEditingResourceType({ item, index })
                })
            )
          )
    ),
    react_1.default.createElement('input', {
      ref: fileInputRef,
      type: 'file',
      accept: '.json',
      onChange: (e) => handleFileImport(e.target.files),
      className: 'hidden'
    }),
    showAddQualifierType &&
      addQualifierTypeMode === null &&
      react_1.default.createElement(
        'div',
        { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50' },
        react_1.default.createElement(
          'div',
          { className: 'bg-white rounded-lg shadow-xl max-w-md w-full' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between p-6 border-b border-gray-200' },
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement(
                'h3',
                { className: 'text-lg font-semibold text-gray-900' },
                'Add Qualifier Type'
              ),
              react_1.default.createElement(
                'p',
                { className: 'text-sm text-gray-600 mt-1' },
                'Choose the type of qualifier to create'
              )
            ),
            react_1.default.createElement(
              'button',
              {
                onClick: () => {
                  setShowAddQualifierType(false);
                  setAddQualifierTypeMode(null);
                },
                className: 'p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100'
              },
              react_1.default.createElement(outline_1.XMarkIcon, { className: 'w-6 h-6' })
            )
          ),
          react_1.default.createElement(
            'div',
            { className: 'p-6 space-y-4' },
            react_1.default.createElement(
              'button',
              {
                onClick: () => setAddQualifierTypeMode('system'),
                className:
                  'w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex-1' },
                  react_1.default.createElement(
                    'h4',
                    { className: 'font-medium text-gray-900 mb-1' },
                    'System Qualifier Type'
                  ),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-sm text-gray-600' },
                    'Built-in types: language, territory, or literal with predefined configuration options'
                  )
                ),
                react_1.default.createElement(outline_1.CogIcon, { className: 'w-6 h-6 text-gray-400 ml-3' })
              )
            ),
            react_1.default.createElement(
              'button',
              {
                onClick: () => setAddQualifierTypeMode('custom'),
                className:
                  'w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex-1' },
                  react_1.default.createElement(
                    'h4',
                    { className: 'font-medium text-gray-900 mb-1' },
                    'Custom Qualifier Type'
                  ),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-sm text-gray-600' },
                    'Custom type with JSON configuration for specialized validation logic'
                  )
                ),
                react_1.default.createElement(outline_1.DocumentTextIcon, {
                  className: 'w-6 h-6 text-gray-400 ml-3'
                })
              )
            )
          )
        )
      ),
    showAddQualifierType &&
      addQualifierTypeMode === 'system' &&
      react_1.default.createElement(QualifierTypeEditForm_1.QualifierTypeEditForm, {
        onSave: (qualifierType) => {
          actions.addQualifierType(qualifierType);
          setShowAddQualifierType(false);
          setAddQualifierTypeMode(null);
          onMessage?.('success', `Added system qualifier type: ${qualifierType.name}`);
        },
        onCancel: () => {
          setShowAddQualifierType(false);
          setAddQualifierTypeMode(null);
        },
        existingNames: (state.currentConfiguration.qualifierTypes || []).map((qt) => qt.name)
      }),
    showAddQualifierType &&
      addQualifierTypeMode === 'custom' &&
      react_1.default.createElement(GenericQualifierTypeEditForm_1.GenericQualifierTypeEditForm, {
        onSave: (qualifierType) => {
          actions.addQualifierType(qualifierType);
          setShowAddQualifierType(false);
          setAddQualifierTypeMode(null);
          onMessage?.('success', `Added custom qualifier type: ${qualifierType.name}`);
        },
        onCancel: () => {
          setShowAddQualifierType(false);
          setAddQualifierTypeMode(null);
        },
        existingNames: (state.currentConfiguration.qualifierTypes || []).map((qt) => qt.name)
      }),
    editingQualifierType &&
      (ts_res_1.QualifierTypes.Config.isSystemQualifierTypeConfig(editingQualifierType.item)
        ? react_1.default.createElement(QualifierTypeEditForm_1.QualifierTypeEditForm, {
            qualifierType: editingQualifierType.item,
            onSave: (qualifierType) => {
              actions.updateQualifierType(editingQualifierType.index, qualifierType);
              setEditingQualifierType(null);
              onMessage?.('success', `Updated qualifier type: ${qualifierType.name}`);
            },
            onCancel: () => setEditingQualifierType(null),
            existingNames: (state.currentConfiguration.qualifierTypes || [])
              .filter((_, i) => i !== editingQualifierType.index)
              .map((qt) => qt.name)
          })
        : react_1.default.createElement(GenericQualifierTypeEditForm_1.GenericQualifierTypeEditForm, {
            qualifierType: editingQualifierType.item,
            onSave: (qualifierType) => {
              actions.updateQualifierType(editingQualifierType.index, qualifierType);
              setEditingQualifierType(null);
              onMessage?.('success', `Updated custom qualifier type: ${qualifierType.name}`);
            },
            onCancel: () => setEditingQualifierType(null),
            existingNames: (state.currentConfiguration.qualifierTypes || [])
              .filter((_, i) => i !== editingQualifierType.index)
              .map((qt) => qt.name)
          })),
    showAddQualifier &&
      react_1.default.createElement(QualifierEditForm_1.QualifierEditForm, {
        qualifierTypes: (state.currentConfiguration.qualifierTypes || []).filter(
          ts_res_1.QualifierTypes.Config.isSystemQualifierTypeConfig
        ),
        onSave: (qualifier) => {
          actions.addQualifier(qualifier);
          setShowAddQualifier(false);
          onMessage?.('success', `Added qualifier: ${qualifier.name}`);
        },
        onCancel: () => setShowAddQualifier(false),
        existingNames: (state.currentConfiguration.qualifiers || []).map((q) => q.name)
      }),
    editingQualifier &&
      react_1.default.createElement(QualifierEditForm_1.QualifierEditForm, {
        qualifier: editingQualifier.item,
        qualifierTypes: (state.currentConfiguration.qualifierTypes || []).filter(
          ts_res_1.QualifierTypes.Config.isSystemQualifierTypeConfig
        ),
        onSave: (qualifier) => {
          actions.updateQualifier(editingQualifier.index, qualifier);
          setEditingQualifier(null);
          onMessage?.('success', `Updated qualifier: ${qualifier.name}`);
        },
        onCancel: () => setEditingQualifier(null),
        existingNames: (state.currentConfiguration.qualifiers || [])
          .filter((_, i) => i !== editingQualifier.index)
          .map((q) => q.name)
      }),
    showAddResourceType &&
      react_1.default.createElement(ResourceTypeEditForm_1.ResourceTypeEditForm, {
        onSave: (resourceType) => {
          actions.addResourceType(resourceType);
          setShowAddResourceType(false);
          onMessage?.('success', `Added resource type: ${resourceType.name}`);
        },
        onCancel: () => setShowAddResourceType(false),
        existingNames: (state.currentConfiguration.resourceTypes || []).map((rt) => rt.name)
      }),
    editingResourceType &&
      react_1.default.createElement(ResourceTypeEditForm_1.ResourceTypeEditForm, {
        resourceType: editingResourceType.item,
        onSave: (resourceType) => {
          actions.updateResourceType(editingResourceType.index, resourceType);
          setEditingResourceType(null);
          onMessage?.('success', `Updated resource type: ${resourceType.name}`);
        },
        onCancel: () => setEditingResourceType(null),
        existingNames: (state.currentConfiguration.resourceTypes || [])
          .filter((_, i) => i !== editingResourceType.index)
          .map((rt) => rt.name)
      })
  );
};
exports.ConfigurationView = ConfigurationView;
const QualifierTypesPanel = ({ qualifierTypes, onRemove, onShowAdd, onEdit }) => {
  const getConfigurationSummary = (type) => {
    if (!type.configuration) return 'No configuration';
    // Handle system qualifier types
    if (ts_res_1.QualifierTypes.Config.isSystemQualifierTypeConfig(type)) {
      const config = type.configuration;
      const details = [];
      if (config?.allowContextList) details.push('Context List');
      if (type.systemType === 'literal') {
        if (config?.caseSensitive === false) details.push('Case Insensitive');
        const enumValues = config?.enumeratedValues;
        if (enumValues?.length) details.push(`${enumValues.length} values`);
      }
      if (type.systemType === 'territory') {
        if (config?.acceptLowercase) details.push('Accept Lowercase');
        const territories = config?.allowedTerritories;
        if (territories?.length) details.push(`${territories.length} territories`);
      }
      return details.length > 0 ? details.join(', ') : 'Default settings';
    }
    // Handle custom qualifier types
    const config = type.configuration;
    if (typeof config === 'object' && config !== null) {
      const keys = Object.keys(config);
      return keys.length > 0 ? `${keys.length} properties` : 'Empty configuration';
    }
    return 'Custom configuration';
  };
  return react_1.default.createElement(
    'div',
    null,
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-4' },
      react_1.default.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900' },
        'Qualifier Types'
      ),
      react_1.default.createElement(
        'button',
        {
          onClick: onShowAdd,
          className:
            'inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
        },
        react_1.default.createElement(outline_1.PlusIcon, { className: 'w-4 h-4 mr-2' }),
        'Add Type'
      )
    ),
    qualifierTypes.length === 0
      ? react_1.default.createElement(
          'div',
          { className: 'text-center py-8 text-gray-500' },
          react_1.default.createElement(outline_1.CogIcon, {
            className: 'w-12 h-12 mx-auto mb-4 text-gray-400'
          }),
          react_1.default.createElement('p', null, 'No qualifier types defined'),
          react_1.default.createElement('p', { className: 'text-sm' }, 'Add a qualifier type to get started')
        )
      : react_1.default.createElement(
          'div',
          { className: 'space-y-3' },
          qualifierTypes.map((type, index) =>
            react_1.default.createElement(
              'div',
              {
                key: index,
                className:
                  'bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-start justify-between' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex-1' },
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-2 mb-2' },
                    react_1.default.createElement(
                      'h4',
                      { className: 'font-medium text-gray-900' },
                      type.name
                    ),
                    react_1.default.createElement(
                      'span',
                      {
                        className: `px-2 py-1 text-xs font-medium rounded-full ${
                          ts_res_1.QualifierTypes.Config.isSystemQualifierTypeConfig(type)
                            ? type.systemType === 'language'
                              ? 'bg-blue-100 text-blue-800'
                              : type.systemType === 'territory'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-purple-100 text-purple-800'
                            : 'bg-orange-100 text-orange-800 border border-orange-300'
                        }`
                      },
                      ts_res_1.QualifierTypes.Config.isSystemQualifierTypeConfig(type)
                        ? type.systemType
                        : 'custom'
                    )
                  ),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-sm text-gray-600 mb-2' },
                    getConfigurationSummary(type)
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-center space-x-2 ml-4' },
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: () => onEdit(type, index),
                      className: 'p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded',
                      title: 'Edit qualifier type'
                    },
                    react_1.default.createElement(outline_1.PencilIcon, { className: 'w-4 h-4' })
                  ),
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: () => onRemove(index),
                      className: 'p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded',
                      title: 'Delete qualifier type'
                    },
                    react_1.default.createElement(outline_1.TrashIcon, { className: 'w-4 h-4' })
                  )
                )
              )
            )
          )
        )
  );
};
const QualifiersPanel = ({ qualifiers, qualifierTypes, onRemove, onShowAdd, onEdit }) => {
  // Sort qualifiers by priority (highest first)
  const sortedQualifiers = [...qualifiers].sort((a, b) => b.defaultPriority - a.defaultPriority);
  const getQualifierSummary = (qualifier) => {
    const qualifierType = qualifierTypes.find((qt) => qt.name === qualifier.typeName);
    const details = [];
    if (qualifier.token) details.push(`Token: ${qualifier.token}`);
    if (qualifier.defaultValue) details.push(`Default: ${qualifier.defaultValue}`);
    if (qualifier.tokenIsOptional) details.push('Optional Token');
    if (qualifierType) details.push(`System: ${qualifierType.systemType}`);
    return details.join(' • ');
  };
  return react_1.default.createElement(
    'div',
    null,
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-4' },
      react_1.default.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Qualifiers'),
      react_1.default.createElement(
        'button',
        {
          onClick: onShowAdd,
          disabled: qualifierTypes.length === 0,
          className:
            'inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed',
          title: qualifierTypes.length === 0 ? 'Add qualifier types first' : 'Add qualifier'
        },
        react_1.default.createElement(outline_1.PlusIcon, { className: 'w-4 h-4 mr-2' }),
        'Add Qualifier'
      )
    ),
    qualifierTypes.length === 0
      ? react_1.default.createElement(
          'div',
          { className: 'text-center py-8 text-gray-500' },
          react_1.default.createElement(outline_1.ExclamationTriangleIcon, {
            className: 'w-12 h-12 mx-auto mb-4 text-amber-400'
          }),
          react_1.default.createElement('p', null, 'No qualifier types available'),
          react_1.default.createElement(
            'p',
            { className: 'text-sm' },
            'Create qualifier types first before adding qualifiers'
          )
        )
      : qualifiers.length === 0
      ? react_1.default.createElement(
          'div',
          { className: 'text-center py-8 text-gray-500' },
          react_1.default.createElement(outline_1.CogIcon, {
            className: 'w-12 h-12 mx-auto mb-4 text-gray-400'
          }),
          react_1.default.createElement('p', null, 'No qualifiers defined'),
          react_1.default.createElement('p', { className: 'text-sm' }, 'Add a qualifier to get started')
        )
      : react_1.default.createElement(
          'div',
          { className: 'space-y-3' },
          sortedQualifiers.map((qualifier, index) => {
            const originalIndex = qualifiers.findIndex((q) => q === qualifier);
            const qualifierType = qualifierTypes.find((qt) => qt.name === qualifier.typeName);
            return react_1.default.createElement(
              'div',
              {
                key: originalIndex,
                className:
                  'bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center justify-between' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex-1' },
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-3 mb-2' },
                    react_1.default.createElement(
                      'h4',
                      { className: 'font-medium text-gray-900' },
                      qualifier.name
                    ),
                    react_1.default.createElement(
                      'span',
                      { className: 'text-gray-600 text-sm' },
                      qualifier.typeName
                    ),
                    qualifier.token &&
                      react_1.default.createElement(
                        'span',
                        { className: 'px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded' },
                        'token: ',
                        qualifier.token
                      ),
                    !qualifierType &&
                      react_1.default.createElement(
                        'span',
                        { className: 'px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full' },
                        'Missing Type'
                      )
                  ),
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center justify-between text-sm text-gray-600' },
                    react_1.default.createElement('span', null, 'Type: ', qualifier.typeName),
                    react_1.default.createElement('span', null, 'Priority: ', qualifier.defaultPriority)
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-center space-x-2 ml-4' },
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: () => onEdit(qualifier, originalIndex),
                      className: 'p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded',
                      title: 'Edit qualifier'
                    },
                    react_1.default.createElement(outline_1.PencilIcon, { className: 'w-4 h-4' })
                  ),
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: () => onRemove(originalIndex),
                      className: 'p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded',
                      title: 'Delete qualifier'
                    },
                    react_1.default.createElement(outline_1.TrashIcon, { className: 'w-4 h-4' })
                  )
                )
              )
            );
          })
        )
  );
};
const ResourceTypesPanel = ({ resourceTypes, onRemove, onShowAdd, onEdit }) => {
  const getTypeNameBadgeColor = (typeName) => {
    switch (typeName) {
      case 'string':
        return 'bg-blue-100 text-blue-800';
      case 'object':
        return 'bg-green-100 text-green-800';
      case 'array':
        return 'bg-purple-100 text-purple-800';
      case 'number':
        return 'bg-yellow-100 text-yellow-800';
      case 'boolean':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return react_1.default.createElement(
    'div',
    null,
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-4' },
      react_1.default.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900' },
        'Resource Types'
      ),
      react_1.default.createElement(
        'button',
        {
          onClick: onShowAdd,
          className:
            'inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
        },
        react_1.default.createElement(outline_1.PlusIcon, { className: 'w-4 h-4 mr-2' }),
        'Add Type'
      )
    ),
    resourceTypes.length === 0
      ? react_1.default.createElement(
          'div',
          { className: 'text-center py-8 text-gray-500' },
          react_1.default.createElement(outline_1.CogIcon, {
            className: 'w-12 h-12 mx-auto mb-4 text-gray-400'
          }),
          react_1.default.createElement('p', null, 'No resource types defined'),
          react_1.default.createElement('p', { className: 'text-sm' }, 'Add a resource type to get started')
        )
      : react_1.default.createElement(
          'div',
          { className: 'space-y-3' },
          resourceTypes.map((type, index) =>
            react_1.default.createElement(
              'div',
              {
                key: index,
                className:
                  'bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors'
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-start justify-between' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex-1' },
                  react_1.default.createElement(
                    'div',
                    { className: 'flex items-center space-x-2 mb-2' },
                    react_1.default.createElement(
                      'h4',
                      { className: 'font-medium text-gray-900' },
                      type.name
                    ),
                    react_1.default.createElement(
                      'span',
                      {
                        className: `px-2 py-1 text-xs font-medium rounded-full ${getTypeNameBadgeColor(
                          type.typeName
                        )}`
                      },
                      type.typeName
                    )
                  ),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-sm text-gray-600' },
                    'Defines how resources of this type are processed and validated'
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-center space-x-2 ml-4' },
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: () => onEdit(type, index),
                      className: 'p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded',
                      title: 'Edit resource type'
                    },
                    react_1.default.createElement(outline_1.PencilIcon, { className: 'w-4 h-4' })
                  ),
                  react_1.default.createElement(
                    'button',
                    {
                      onClick: () => onRemove(index),
                      className: 'p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded',
                      title: 'Delete resource type'
                    },
                    react_1.default.createElement(outline_1.TrashIcon, { className: 'w-4 h-4' })
                  )
                )
              )
            )
          )
        )
  );
};
exports.default = exports.ConfigurationView;
//# sourceMappingURL=index.js.map
