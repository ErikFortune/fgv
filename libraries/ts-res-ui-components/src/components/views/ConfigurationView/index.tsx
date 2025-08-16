import React, { useState, useCallback, useRef } from 'react';
import {
  CogIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { ConfigurationViewProps } from '../../../types';
import { useConfigurationState } from '../../../hooks/useConfigurationState';
import { Config, QualifierTypes, Qualifiers, ResourceTypes } from '@fgv/ts-res';
import { QualifierTypeEditForm } from '../../forms/QualifierTypeEditForm';
import { QualifierEditForm } from '../../forms/QualifierEditForm';
import { ResourceTypeEditForm } from '../../forms/ResourceTypeEditForm';

/** @public */
export const ConfigurationView: React.FC<ConfigurationViewProps> = ({
  configuration,
  onConfigurationChange,
  onSave,
  hasUnsavedChanges,
  onMessage,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingQualifierType, setEditingQualifierType] = useState<{
    item: QualifierTypes.Config.ISystemQualifierTypeConfig;
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
  const [showAddQualifier, setShowAddQualifier] = useState(false);
  const [showAddResourceType, setShowAddResourceType] = useState(false);

  const { state, actions, templates } = useConfigurationState(
    configuration || undefined,
    onConfigurationChange,
    hasUnsavedChanges
      ? undefined
      : (changes) => {
          // Only notify if we weren't already told there are unsaved changes
        }
  );

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
      onMessage?.('success', 'Configuration exported successfully');
    } else {
      onMessage?.('error', `Export failed: ${result.message}`);
    }
  }, [actions, onMessage]);

  // Handle template loading
  const handleLoadTemplate = useCallback(
    (templateId: string) => {
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
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(state.currentConfiguration);
      actions.applyConfiguration();
      onMessage?.('success', 'Configuration saved successfully');
    }
  }, [onSave, state.currentConfiguration, actions, onMessage]);

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
            {templates.map((template) => (
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
            {state.validation.errors.map((error, index) => (
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
            {state.validation.warnings.map((warning, index) => (
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
                    onMessage?.('success', 'JSON changes applied');
                  } else {
                    onMessage?.('error', `JSON error: ${result.message}`);
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
      {showAddQualifierType && (
        <QualifierTypeEditForm
          onSave={(qualifierType) => {
            actions.addQualifierType(qualifierType);
            setShowAddQualifierType(false);
            onMessage?.('success', `Added qualifier type: ${qualifierType.name}`);
          }}
          onCancel={() => setShowAddQualifierType(false)}
          existingNames={(state.currentConfiguration.qualifierTypes || []).map((qt) => qt.name)}
        />
      )}

      {editingQualifierType && (
        <QualifierTypeEditForm
          qualifierType={editingQualifierType.item}
          onSave={(qualifierType) => {
            actions.updateQualifierType(editingQualifierType.index, qualifierType);
            setEditingQualifierType(null);
            onMessage?.('success', `Updated qualifier type: ${qualifierType.name}`);
          }}
          onCancel={() => setEditingQualifierType(null)}
          existingNames={(state.currentConfiguration.qualifierTypes || [])
            .filter((_, i) => i !== editingQualifierType.index)
            .map((qt) => qt.name)}
        />
      )}

      {showAddQualifier && (
        <QualifierEditForm
          qualifierTypes={state.currentConfiguration.qualifierTypes || []}
          onSave={(qualifier) => {
            actions.addQualifier(qualifier);
            setShowAddQualifier(false);
            onMessage?.('success', `Added qualifier: ${qualifier.name}`);
          }}
          onCancel={() => setShowAddQualifier(false)}
          existingNames={(state.currentConfiguration.qualifiers || []).map((q) => q.name)}
        />
      )}

      {editingQualifier && (
        <QualifierEditForm
          qualifier={editingQualifier.item}
          qualifierTypes={state.currentConfiguration.qualifierTypes || []}
          onSave={(qualifier) => {
            actions.updateQualifier(editingQualifier.index, qualifier);
            setEditingQualifier(null);
            onMessage?.('success', `Updated qualifier: ${qualifier.name}`);
          }}
          onCancel={() => setEditingQualifier(null)}
          existingNames={(state.currentConfiguration.qualifiers || [])
            .filter((_, i) => i !== editingQualifier.index)
            .map((q) => q.name)}
        />
      )}

      {showAddResourceType && (
        <ResourceTypeEditForm
          onSave={(resourceType) => {
            actions.addResourceType(resourceType);
            setShowAddResourceType(false);
            onMessage?.('success', `Added resource type: ${resourceType.name}`);
          }}
          onCancel={() => setShowAddResourceType(false)}
          existingNames={(state.currentConfiguration.resourceTypes || []).map((rt) => rt.name)}
        />
      )}

      {editingResourceType && (
        <ResourceTypeEditForm
          resourceType={editingResourceType.item}
          onSave={(resourceType) => {
            actions.updateResourceType(editingResourceType.index, resourceType);
            setEditingResourceType(null);
            onMessage?.('success', `Updated resource type: ${resourceType.name}`);
          }}
          onCancel={() => setEditingResourceType(null)}
          existingNames={(state.currentConfiguration.resourceTypes || [])
            .filter((_, i) => i !== editingResourceType.index)
            .map((rt) => rt.name)}
        />
      )}
    </div>
  );
};

// Comprehensive panel components with full editing capabilities
interface QualifierTypesPanelProps {
  qualifierTypes: QualifierTypes.Config.ISystemQualifierTypeConfig[];
  onUpdateItem: (index: number, qualifierType: QualifierTypes.Config.ISystemQualifierTypeConfig) => void;
  onRemove: (index: number) => void;
  onShowAdd: () => void;
  onEdit: (item: QualifierTypes.Config.ISystemQualifierTypeConfig, index: number) => void;
}

const QualifierTypesPanel: React.FC<QualifierTypesPanelProps> = ({
  qualifierTypes,
  onRemove,
  onShowAdd,
  onEdit
}) => {
  const getConfigurationSummary = (type: QualifierTypes.Config.ISystemQualifierTypeConfig): string => {
    if (!type.configuration) return 'No configuration';
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
                        type.systemType === 'language'
                          ? 'bg-blue-100 text-blue-800'
                          : type.systemType === 'territory'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {type.systemType}
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

interface QualifiersPanelProps {
  qualifiers: Qualifiers.IQualifierDecl[];
  qualifierTypes: QualifierTypes.Config.ISystemQualifierTypeConfig[];
  onUpdateItem: (index: number, qualifier: Qualifiers.IQualifierDecl) => void;
  onRemove: (index: number) => void;
  onShowAdd: () => void;
  onEdit: (item: Qualifiers.IQualifierDecl, index: number) => void;
}

const QualifiersPanel: React.FC<QualifiersPanelProps> = ({
  qualifiers,
  qualifierTypes,
  onRemove,
  onShowAdd,
  onEdit
}) => {
  // Sort qualifiers by priority (highest first)
  const sortedQualifiers = [...qualifiers].sort((a, b) => b.defaultPriority - a.defaultPriority);

  const getQualifierSummary = (qualifier: Qualifiers.IQualifierDecl): string => {
    const qualifierType = qualifierTypes.find((qt) => qt.name === qualifier.typeName);
    const details: string[] = [];

    if (qualifier.token) details.push(`Token: ${qualifier.token}`);
    if (qualifier.defaultValue) details.push(`Default: ${qualifier.defaultValue}`);
    if (qualifier.tokenIsOptional) details.push('Optional Token');
    if (qualifierType) details.push(`System: ${qualifierType.systemType}`);

    return details.join(' • ');
  };

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

interface ResourceTypesPanelProps {
  resourceTypes: ResourceTypes.Config.IResourceTypeConfig[];
  onUpdateItem: (index: number, resourceType: ResourceTypes.Config.IResourceTypeConfig) => void;
  onRemove: (index: number) => void;
  onShowAdd: () => void;
  onEdit: (item: ResourceTypes.Config.IResourceTypeConfig, index: number) => void;
}

const ResourceTypesPanel: React.FC<ResourceTypesPanelProps> = ({
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

export default ConfigurationView;
