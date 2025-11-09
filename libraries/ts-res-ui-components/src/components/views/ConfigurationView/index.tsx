import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  CogIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { IConfigurationViewProps } from '../../../types';
import { useIConfigurationState } from '../../../hooks/useConfigurationState';
import { Config, QualifierTypes, Qualifiers, ResourceTypes } from '@fgv/ts-res';
import { QualifierTypeEditForm } from '../../forms/QualifierTypeEditForm';
import { GenericQualifierTypeEditForm } from '../../forms/GenericQualifierTypeEditForm';
import { QualifierEditForm } from '../../forms/QualifierEditForm';
import { ResourceTypeEditForm } from '../../forms/ResourceTypeEditForm';
import { useSmartObservability } from '../../../hooks/useSmartObservability';

// Panel component definitions - moved before main component to avoid use-before-define

// Comprehensive panel components with full editing capabilities
interface IQualifierTypesPanelProps {
  qualifierTypes: QualifierTypes.Config.IAnyQualifierTypeConfig[];
  onUpdateItem: (index: number, qualifierType: QualifierTypes.Config.IAnyQualifierTypeConfig) => void;
  onRemove: (index: number) => void;
  onShowAdd: () => void;
  onEdit: (item: QualifierTypes.Config.IAnyQualifierTypeConfig, index: number) => void;
}

const QualifierTypesPanel: React.FC<IQualifierTypesPanelProps> = ({
  qualifierTypes,
  onRemove,
  onShowAdd,
  onEdit
}) => {
  const getConfigurationSummary = (type: QualifierTypes.Config.IAnyQualifierTypeConfig): string => {
    if (!type.configuration) return 'No configuration';

    // Handle system qualifier types
    if (QualifierTypes.Config.isSystemQualifierTypeConfig(type)) {
      const config = type.configuration as Record<string, unknown>;
      const details: string[] = [];

      if (config?.allowContextList) details.push('Context List');
      if (type.systemType === 'literal') {
        if (config?.caseSensitive === false) details.push('Case Insensitive');
        const enumValues = config?.enumeratedValues as string[] | undefined;
        if (enumValues?.length) details.push(`${enumValues.length} values`);
      }
      if (type.systemType === 'territory') {
        if (config?.acceptLowercase) details.push('Accept Lowercase');
        const territories = config?.allowedTerritories as string[] | undefined;
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Qualifier Types</h3>
        <button
          onClick={onShowAdd}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Type
        </button>
      </div>

      {qualifierTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CogIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No qualifier types defined</p>
          <p className="text-sm">Add a qualifier type to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {qualifierTypes.map((type, index) => (
            <div
              key={index}
              className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        QualifierTypes.Config.isSystemQualifierTypeConfig(type)
                          ? type.systemType === 'language'
                            ? 'bg-blue-100 text-blue-800'
                            : type.systemType === 'territory'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                          : 'bg-orange-100 text-orange-800 border border-orange-300'
                      }`}
                    >
                      {QualifierTypes.Config.isSystemQualifierTypeConfig(type) ? type.systemType : 'custom'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{getConfigurationSummary(type)}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onEdit(type, index)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit qualifier type"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemove(index)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete qualifier type"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface IQualifiersPanelProps {
  qualifiers: Qualifiers.IQualifierDecl[];
  qualifierTypes: QualifierTypes.Config.IAnyQualifierTypeConfig[];
  onUpdateItem: (index: number, qualifier: Qualifiers.IQualifierDecl) => void;
  onRemove: (index: number) => void;
  onShowAdd: () => void;
  onEdit: (item: Qualifiers.IQualifierDecl, index: number) => void;
}

const QualifiersPanel: React.FC<IQualifiersPanelProps> = ({
  qualifiers,
  qualifierTypes,
  onRemove,
  onShowAdd,
  onEdit
}) => {
  // Sort qualifiers by priority (highest first)
  const sortedQualifiers = [...qualifiers].sort((a, b) => b.defaultPriority - a.defaultPriority);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Qualifiers</h3>
        <button
          onClick={onShowAdd}
          disabled={qualifierTypes.length === 0}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          title={qualifierTypes.length === 0 ? 'Add qualifier types first' : 'Add qualifier'}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Qualifier
        </button>
      </div>

      {qualifierTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <p>No qualifier types available</p>
          <p className="text-sm">Create qualifier types first before adding qualifiers</p>
        </div>
      ) : qualifiers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CogIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No qualifiers defined</p>
          <p className="text-sm">Add a qualifier to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedQualifiers.map((qualifier, index) => {
            const originalIndex = qualifiers.findIndex((q) => q === qualifier);
            const qualifierType = qualifierTypes.find((qt) => qt.name === qualifier.typeName);

            return (
              <div
                key={originalIndex}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Header line with name, type, and token */}
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{qualifier.name}</h4>
                      <span className="text-gray-600 text-sm">{qualifier.typeName}</span>
                      {qualifier.token && (
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                          token: {qualifier.token}
                        </span>
                      )}
                      {!qualifierType && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Missing Type
                        </span>
                      )}
                    </div>
                    {/* Bottom line with type and priority */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Type: {qualifier.typeName}</span>
                      <span>Priority: {qualifier.defaultPriority}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onEdit(qualifier, originalIndex)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit qualifier"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemove(originalIndex)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete qualifier"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface IResourceTypesPanelProps {
  resourceTypes: ResourceTypes.Config.IResourceTypeConfig[];
  onUpdateItem: (index: number, resourceType: ResourceTypes.Config.IResourceTypeConfig) => void;
  onRemove: (index: number) => void;
  onShowAdd: () => void;
  onEdit: (item: ResourceTypes.Config.IResourceTypeConfig, index: number) => void;
}

const ResourceTypesPanel: React.FC<IResourceTypesPanelProps> = ({
  resourceTypes,
  onRemove,
  onShowAdd,
  onEdit
}) => {
  const getTypeNameBadgeColor = (typeName: string): string => {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Resource Types</h3>
        <button
          onClick={onShowAdd}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Type
        </button>
      </div>

      {resourceTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CogIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No resource types defined</p>
          <p className="text-sm">Add a resource type to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resourceTypes.map((type, index) => (
            <div
              key={index}
              className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeNameBadgeColor(
                        type.typeName
                      )}`}
                    >
                      {type.typeName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Defines how resources of this type are processed and validated
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onEdit(type, index)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit resource type"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemove(index)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete resource type"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const ConfigurationView: React.FC<IConfigurationViewProps> = ({
  configuration,
  onConfigurationChange,
  onSave,
  hasUnsavedChanges,
  className = ''
}) => {
  const o11y = useSmartObservability();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingQualifierType, setEditingQualifierType] = useState<{
    item: QualifierTypes.Config.IAnyQualifierTypeConfig;
    index: number;
  } | null>(null);
  const [editingQualifier, setEditingQualifier] = useState<{
    item: Qualifiers.IQualifierDecl;
    index: number;
  } | null>(null);
  const [editingResourceType, setEditingResourceType] = useState<{
    item: ResourceTypes.Config.IResourceTypeConfig;
    index: number;
  } | null>(null);
  const [showAddQualifierType, setShowAddQualifierType] = useState(false);
  const [addQualifierTypeMode, setAddQualifierTypeMode] = useState<'system' | 'custom' | null>(null);
  const [showAddQualifier, setShowAddQualifier] = useState(false);
  const [showAddResourceType, setShowAddResourceType] = useState(false);

  const { state, actions, templates } = useIConfigurationState(
    configuration || undefined,
    onConfigurationChange,
    hasUnsavedChanges
      ? undefined
      : (changes: unknown) => {
          // Only notify if we weren't already told there are unsaved changes
        }
  );

  // Create instantiated qualifier types from configurations for validation
  const qualifierTypeInstances = useMemo(() => {
    const instances = new Map<string, QualifierTypes.QualifierType>();

    if (state.currentConfiguration.qualifierTypes) {
      state.currentConfiguration.qualifierTypes.forEach((typeConfig) => {
        // Only instantiate system qualifier types for now
        if (QualifierTypes.Config.isSystemQualifierTypeConfig(typeConfig)) {
          const result = QualifierTypes.createQualifierTypeFromSystemConfig(typeConfig);
          if (result.isSuccess()) {
            instances.set(typeConfig.name, result.value);
          }
        }
      });
    }

    return instances;
  }, [state.currentConfiguration.qualifierTypes]);

  // Handle file import
  const handleFileImport = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          const result = actions.importFromJson(content);
          if (result.isSuccess()) {
            o11y.user.success(`Configuration imported from ${file.name}`);
          } else {
            o11y.user.error(`Import failed: ${result.message}`);
          }
        }
      };

      reader.onerror = () => {
        o11y.user.error(`Failed to read file: ${file.name}`);
      };

      reader.readAsText(file);
    },
    [actions, o11y]
  );

  // Handle export
  const handleExport = useCallback(() => {
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
      o11y.user.success('Configuration exported successfully');
    } else {
      o11y.user.error(`Export failed: ${result.message}`);
    }
  }, [actions, o11y]);

  // Handle template loading
  const handleLoadTemplate = useCallback(
    (templateId: string) => {
      const result = actions.loadTemplate(templateId);
      if (result.isSuccess()) {
        const template = templates.find((t: { id: string; name?: string }) => t.id === templateId);
        o11y.user.success(`Loaded template: ${template?.name}`);
      } else {
        o11y.user.error(`Failed to load template: ${result.message}`);
      }
    },
    [actions, templates, o11y]
  );

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(state.currentConfiguration);
      actions.applyConfiguration();
      o11y.user.success('Configuration saved successfully');
    }
  }, [onSave, state.currentConfiguration, actions, o11y]);

  if (!configuration && !state.currentConfiguration) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <CogIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Configuration Available</h3>
            <p className="text-gray-600 mb-6">
              Load a configuration to manage qualifiers, qualifier types, and resource types.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Configuration Manager:</strong> Define and manage system configurations for resource
                management, including qualifiers, qualifier types, and resource types.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <CogIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
          {state.hasUnsavedChanges && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Unsaved Changes
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Template Selection */}
          <select
            onChange={(e) => e.target.value && handleLoadTemplate(e.target.value)}
            value=""
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Load Template...</option>
            {templates.map((template: { id: string; name: string }) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>

          {/* Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
            Import
          </button>

          {/* Export Button */}
          <button
            onClick={handleExport}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </button>

          {/* View Toggle */}
          <button
            onClick={actions.toggleJsonView}
            className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              state.isJsonView
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            {state.isJsonView ? (
              <>
                <PencilIcon className="w-4 h-4 mr-2" />
                Form View
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4 mr-2" />
                JSON View
              </>
            )}
          </button>

          {/* Save Button */}
          {onSave && (
            <button
              onClick={handleSave}
              disabled={!state.hasUnsavedChanges}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium ${
                state.hasUnsavedChanges
                  ? 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'text-gray-400 bg-gray-200 cursor-not-allowed'
              }`}
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Validation Status */}
      {!state.validation.isValid && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-600 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="font-medium">Configuration Issues</span>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {state.validation.errors.map((error: string, index: number) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {state.validation.warnings.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-yellow-600 mb-2">
            <InformationCircleIcon className="w-5 h-5" />
            <span className="font-medium">Configuration Warnings</span>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {state.validation.warnings.map((warning: string, index: number) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {state.isJsonView ? (
          // JSON Editor View
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">JSON Configuration</h3>
              <button
                onClick={() => {
                  const result = actions.applyJsonChanges();
                  if (result.isSuccess()) {
                    o11y.user.success('JSON changes applied');
                  } else {
                    o11y.user.error(`JSON error: ${result.message}`);
                  }
                }}
                disabled={!!state.jsonError}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  state.jsonError
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }`}
              >
                Apply Changes
              </button>
            </div>

            {state.jsonError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{state.jsonError}</p>
              </div>
            )}

            <textarea
              value={state.jsonString}
              onChange={(e) => actions.updateJsonString(e.target.value)}
              className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter JSON configuration..."
            />
          </div>
        ) : (
          // Form View
          <div>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  {
                    key: 'qualifiers' as const,
                    label: 'Qualifiers',
                    count: state.currentConfiguration.qualifiers?.length || 0
                  },
                  {
                    key: 'qualifierTypes' as const,
                    label: 'Qualifier Types',
                    count: state.currentConfiguration.qualifierTypes?.length || 0
                  },
                  {
                    key: 'resourceTypes' as const,
                    label: 'Resource Types',
                    count: state.currentConfiguration.resourceTypes?.length || 0
                  }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => actions.setActiveTab(tab.key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      state.activeTab === tab.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 bg-gray-100 text-gray-900 rounded-full px-2.5 py-0.5 text-xs font-medium">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {state.activeTab === 'qualifiers' && (
                <QualifiersPanel
                  qualifiers={state.currentConfiguration.qualifiers || []}
                  qualifierTypes={state.currentConfiguration.qualifierTypes || []}
                  onUpdateItem={actions.updateQualifier}
                  onRemove={actions.removeQualifier}
                  onShowAdd={() => setShowAddQualifier(true)}
                  onEdit={(item, index) => setEditingQualifier({ item, index })}
                />
              )}

              {state.activeTab === 'qualifierTypes' && (
                <QualifierTypesPanel
                  qualifierTypes={state.currentConfiguration.qualifierTypes || []}
                  onUpdateItem={actions.updateQualifierType}
                  onRemove={actions.removeQualifierType}
                  onShowAdd={() => setShowAddQualifierType(true)}
                  onEdit={(item, index) => setEditingQualifierType({ item, index })}
                />
              )}

              {state.activeTab === 'resourceTypes' && (
                <ResourceTypesPanel
                  resourceTypes={state.currentConfiguration.resourceTypes || []}
                  onUpdateItem={actions.updateResourceType}
                  onRemove={actions.removeResourceType}
                  onShowAdd={() => setShowAddResourceType(true)}
                  onEdit={(item, index) => setEditingResourceType({ item, index })}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={(e) => handleFileImport(e.target.files)}
        className="hidden"
      />

      {/* Edit Modals */}
      {/* Qualifier Type Choice Modal */}
      {showAddQualifierType && addQualifierTypeMode === null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add Qualifier Type</h3>
                <p className="text-sm text-gray-600 mt-1">Choose the type of qualifier to create</p>
              </div>
              <button
                onClick={() => {
                  setShowAddQualifierType(false);
                  setAddQualifierTypeMode(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={() => setAddQualifierTypeMode('system')}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">System Qualifier Type</h4>
                    <p className="text-sm text-gray-600">
                      Built-in types: language, territory, or literal with predefined configuration options
                    </p>
                  </div>
                  <CogIcon className="w-6 h-6 text-gray-400 ml-3" />
                </div>
              </button>

              <button
                onClick={() => setAddQualifierTypeMode('custom')}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">Custom Qualifier Type</h4>
                    <p className="text-sm text-gray-600">
                      Custom type with JSON configuration for specialized validation logic
                    </p>
                  </div>
                  <DocumentTextIcon className="w-6 h-6 text-gray-400 ml-3" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Qualifier Type Form */}
      {showAddQualifierType && addQualifierTypeMode === 'system' && (
        <QualifierTypeEditForm
          onSave={(qualifierType) => {
            actions.addQualifierType(qualifierType);
            setShowAddQualifierType(false);
            setAddQualifierTypeMode(null);
            o11y.user.success(`Added system qualifier type: ${qualifierType.name}`);
          }}
          onCancel={() => {
            setShowAddQualifierType(false);
            setAddQualifierTypeMode(null);
          }}
          existingNames={(state.currentConfiguration.qualifierTypes || []).map(
            (qt: QualifierTypes.Config.IAnyQualifierTypeConfig) => qt.name
          )}
        />
      )}

      {/* Custom Qualifier Type Form */}
      {showAddQualifierType && addQualifierTypeMode === 'custom' && (
        <GenericQualifierTypeEditForm
          onSave={(qualifierType) => {
            actions.addQualifierType(qualifierType);
            setShowAddQualifierType(false);
            setAddQualifierTypeMode(null);
            o11y.user.success(`Added custom qualifier type: ${qualifierType.name}`);
          }}
          onCancel={() => {
            setShowAddQualifierType(false);
            setAddQualifierTypeMode(null);
          }}
          existingNames={(state.currentConfiguration.qualifierTypes || []).map(
            (qt: QualifierTypes.Config.IAnyQualifierTypeConfig) => qt.name
          )}
        />
      )}

      {editingQualifierType &&
        (QualifierTypes.Config.isSystemQualifierTypeConfig(editingQualifierType.item) ? (
          <QualifierTypeEditForm
            qualifierType={editingQualifierType.item}
            onSave={(qualifierType) => {
              actions.updateQualifierType(editingQualifierType.index, qualifierType);
              setEditingQualifierType(null);
              o11y.user.success(`Updated qualifier type: ${qualifierType.name}`);
            }}
            onCancel={() => setEditingQualifierType(null)}
            existingNames={(state.currentConfiguration.qualifierTypes || [])
              .filter(
                (__: QualifierTypes.Config.IAnyQualifierTypeConfig, i: number) =>
                  i !== editingQualifierType.index
              )
              .map((qt: QualifierTypes.Config.IAnyQualifierTypeConfig) => qt.name)}
          />
        ) : (
          <GenericQualifierTypeEditForm
            qualifierType={editingQualifierType.item}
            onSave={(qualifierType) => {
              actions.updateQualifierType(editingQualifierType.index, qualifierType);
              setEditingQualifierType(null);
              o11y.user.success(`Updated custom qualifier type: ${qualifierType.name}`);
            }}
            onCancel={() => setEditingQualifierType(null)}
            existingNames={(state.currentConfiguration.qualifierTypes || [])
              .filter(
                (__: QualifierTypes.Config.IAnyQualifierTypeConfig, i: number) =>
                  i !== editingQualifierType.index
              )
              .map((qt: QualifierTypes.Config.IAnyQualifierTypeConfig) => qt.name)}
          />
        ))}

      {showAddQualifier && (
        <QualifierEditForm
          qualifierTypes={(state.currentConfiguration.qualifierTypes || []).filter(
            QualifierTypes.Config.isSystemQualifierTypeConfig
          )}
          qualifierTypeInstances={qualifierTypeInstances}
          onSave={(qualifier) => {
            actions.addQualifier(qualifier);
            setShowAddQualifier(false);
            o11y.user.success(`Added qualifier: ${qualifier.name}`);
          }}
          onCancel={() => setShowAddQualifier(false)}
          existingNames={(state.currentConfiguration.qualifiers || []).map(
            (q: Qualifiers.IQualifierDecl) => q.name
          )}
        />
      )}

      {editingQualifier && (
        <QualifierEditForm
          qualifier={editingQualifier.item}
          qualifierTypes={(state.currentConfiguration.qualifierTypes || []).filter(
            QualifierTypes.Config.isSystemQualifierTypeConfig
          )}
          qualifierTypeInstances={qualifierTypeInstances}
          onSave={(qualifier) => {
            actions.updateQualifier(editingQualifier.index, qualifier);
            setEditingQualifier(null);
            o11y.user.success(`Updated qualifier: ${qualifier.name}`);
          }}
          onCancel={() => setEditingQualifier(null)}
          existingNames={(state.currentConfiguration.qualifiers || [])
            .filter((__: Qualifiers.IQualifierDecl, i: number) => i !== editingQualifier.index)
            .map((q: Qualifiers.IQualifierDecl) => q.name)}
        />
      )}

      {showAddResourceType && (
        <ResourceTypeEditForm
          onSave={(resourceType) => {
            actions.addResourceType(resourceType);
            setShowAddResourceType(false);
            o11y.user.success(`Added resource type: ${resourceType.name}`);
          }}
          onCancel={() => setShowAddResourceType(false)}
          existingNames={(state.currentConfiguration.resourceTypes || []).map(
            (rt: ResourceTypes.Config.IResourceTypeConfig) => rt.name
          )}
        />
      )}

      {editingResourceType && (
        <ResourceTypeEditForm
          resourceType={editingResourceType.item}
          onSave={(resourceType) => {
            actions.updateResourceType(editingResourceType.index, resourceType);
            setEditingResourceType(null);
            o11y.user.success(`Updated resource type: ${resourceType.name}`);
          }}
          onCancel={() => setEditingResourceType(null)}
          existingNames={(state.currentConfiguration.resourceTypes || [])
            .filter(
              (__: ResourceTypes.Config.IResourceTypeConfig, i: number) => i !== editingResourceType.index
            )
            .map((rt: ResourceTypes.Config.IResourceTypeConfig) => rt.name)}
        />
      )}
    </div>
  );
};

export default ConfigurationView;
