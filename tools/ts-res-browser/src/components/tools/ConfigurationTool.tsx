import React, { useState, useMemo, useCallback } from 'react';
import {
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderOpenIcon,
  DocumentArrowDownIcon,
  CodeBracketIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import { Message } from '../../types/app';
import { Config } from '@fgv/ts-res';
import { DEFAULT_SYSTEM_CONFIGURATION } from '../../utils/tsResIntegration';
import { fileImporter } from '../../utils/fileImport';
import { Result } from '@fgv/ts-utils';

interface ConfigurationToolProps {
  onMessage?: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
  onUnsavedChanges?: (hasChanges: boolean) => void;
  onSaveHandlerRef?: React.MutableRefObject<(() => void) | null>;
}

type ActivePanel = 'qualifier-types' | 'qualifiers' | 'resource-types';

const ConfigurationTool: React.FC<ConfigurationToolProps> = ({
  onMessage,
  resourceManager,
  onUnsavedChanges,
  onSaveHandlerRef
}) => {
  const { state: resourceState } = resourceManager;
  const [activePanel, setActivePanel] = useState<ActivePanel>('qualifier-types');

  // Check if we have processed resources
  const hasProcessedResources = !!resourceState.processedResources;

  // Check if we have an active configuration
  const hasActiveConfiguration = !!resourceState.activeConfiguration;

  // Get current system configuration
  const systemConfiguration = useMemo(() => {
    // Always use active configuration if available, regardless of processed resources
    // This preserves the user's configuration context even after importing resources
    return resourceState.activeConfiguration || DEFAULT_SYSTEM_CONFIGURATION;
  }, [resourceState.activeConfiguration]);

  // State for configuration edits
  const [currentConfig, setCurrentConfig] = useState<Config.Model.ISystemConfiguration>(systemConfiguration);

  // Update currentConfig when systemConfiguration changes
  React.useEffect(() => {
    setCurrentConfig(systemConfiguration);
  }, [systemConfiguration]);

  // State for editing items
  const [editingQualifierType, setEditingQualifierType] = useState<string | null>(null);
  const [editingQualifier, setEditingQualifier] = useState<string | null>(null);
  const [editingMetadata, setEditingMetadata] = useState(false);

  // Check if current config has changes compared to system configuration
  const hasChanges = useMemo(() => {
    return JSON.stringify(currentConfig) !== JSON.stringify(systemConfiguration);
  }, [currentConfig, systemConfiguration]);

  // Notify parent about unsaved changes
  React.useEffect(() => {
    onUnsavedChanges?.(hasChanges);
  }, [hasChanges, onUnsavedChanges]);

  // State for JSON view
  const [showJsonView, setShowJsonView] = useState(false);

  // Load configuration from file
  const handleLoadConfiguration = useCallback(async () => {
    try {
      const fileResult = await fileImporter.pickFiles({
        acceptedTypes: ['.json'],
        multiple: false
      });

      if (fileResult.isFailure()) {
        onMessage?.('error', `Failed to load configuration file: ${fileResult.message}`);
        return;
      }

      const files = fileResult.value;
      if (files.length === 0) {
        onMessage?.('warning', 'No configuration file selected');
        return;
      }

      const file = files[0];
      let parsedConfig: Config.Model.ISystemConfiguration;

      try {
        parsedConfig = JSON.parse(file.content);
      } catch (parseError) {
        onMessage?.(
          'error',
          `Failed to parse configuration file: ${
            parseError instanceof Error ? parseError.message : String(parseError)
          }`
        );
        return;
      }

      // Validate the configuration structure
      if (!parsedConfig.qualifierTypes || !parsedConfig.qualifiers || !parsedConfig.resourceTypes) {
        onMessage?.(
          'error',
          'Invalid configuration file: missing required sections (qualifierTypes, qualifiers, resourceTypes)'
        );
        return;
      }

      // Update the local config state for preview
      setCurrentConfig(parsedConfig);
      onMessage?.(
        'success',
        `Configuration loaded successfully from ${file.name}${
          parsedConfig.name ? ` (${parsedConfig.name})` : ''
        }. Click "Apply Configuration" to activate it.`
      );
    } catch (error) {
      onMessage?.(
        'error',
        `Unexpected error loading configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [resourceManager.actions, onMessage]);

  // Apply configuration handler
  const handleApplyConfiguration = useCallback(
    (newConfig: Config.Model.ISystemConfiguration) => {
      try {
        // Apply the configuration through the resource manager
        resourceManager.actions.applyConfiguration(newConfig);

        // Update local state
        setCurrentConfig(newConfig);

        // Provide user feedback
        const configName = newConfig.name || 'Unnamed configuration';
        onMessage?.(
          'success',
          `Configuration "${configName}" applied successfully. Resources will use this configuration when loaded.`
        );
      } catch (error) {
        onMessage?.(
          'error',
          `Failed to apply configuration: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
    [resourceManager.actions, onMessage]
  );

  // Handle save and navigate (called from navigation warning modal)
  const handleSaveAndNavigate = useCallback(() => {
    if (hasChanges) {
      handleApplyConfiguration(currentConfig);
    }
  }, [hasChanges, currentConfig, handleApplyConfiguration]);

  // Set the save handler reference for the parent component
  React.useEffect(() => {
    if (onSaveHandlerRef) {
      onSaveHandlerRef.current = handleSaveAndNavigate;
    }
    return () => {
      if (onSaveHandlerRef) {
        onSaveHandlerRef.current = null;
      }
    };
  }, [handleSaveAndNavigate, onSaveHandlerRef]);

  // Restore defaults handler
  const handleRestoreDefaults = useCallback(() => {
    try {
      // Apply the default configuration
      resourceManager.actions.applyConfiguration(DEFAULT_SYSTEM_CONFIGURATION);

      // Update local state
      setCurrentConfig(DEFAULT_SYSTEM_CONFIGURATION);

      // Provide user feedback
      onMessage?.('success', 'Default configuration restored successfully.');
    } catch (error) {
      onMessage?.(
        'error',
        `Failed to restore defaults: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [resourceManager.actions, onMessage]);

  // Handle metadata editing
  const handleSaveMetadata = useCallback(
    (name: string, description: string) => {
      const updatedConfig = {
        ...currentConfig,
        name: name || undefined,
        description: description || undefined
      };
      setCurrentConfig(updatedConfig);
      setEditingMetadata(false);
      onMessage?.('info', 'Configuration metadata updated');
    },
    [currentConfig, onMessage]
  );

  const handleCancelMetadataEdit = useCallback(() => {
    setEditingMetadata(false);
  }, []);

  // Export configuration to JSON file
  const handleExportConfiguration = useCallback(() => {
    try {
      const configJson = JSON.stringify(currentConfig, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentConfig.name || 'configuration'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onMessage?.('success', 'Configuration exported successfully');
    } catch (error) {
      onMessage?.(
        'error',
        `Failed to export configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [currentConfig, onMessage]);

  const handleAddQualifierType = useCallback(() => {
    const newQualifierType: Config.Model.ISystemConfiguration['qualifierTypes'][0] = {
      name: `newType${currentConfig.qualifierTypes.length + 1}`,
      systemType: 'literal',
      configuration: {
        allowContextList: true,
        caseSensitive: true,
        enumeratedValues: ['value1', 'value2']
      }
    };

    const updatedConfig = {
      ...currentConfig,
      qualifierTypes: [...currentConfig.qualifierTypes, newQualifierType]
    };

    setCurrentConfig(updatedConfig);
    onMessage?.('info', `Added qualifier type: ${newQualifierType.name}`);
  }, [currentConfig, onMessage]);

  const handleEditQualifierType = useCallback((typeName: string) => {
    setEditingQualifierType(typeName);
  }, []);

  const handleSaveQualifierType = useCallback(
    (typeName: string, updatedType: Config.Model.ISystemConfiguration['qualifierTypes'][0]) => {
      const updatedConfig = {
        ...currentConfig,
        qualifierTypes: currentConfig.qualifierTypes.map((type) =>
          type.name === typeName ? updatedType : type
        )
      };
      setCurrentConfig(updatedConfig);
      setEditingQualifierType(null);
      onMessage?.('info', `Updated qualifier type: ${updatedType.name}`);
    },
    [currentConfig, onMessage]
  );

  const handleCancelEditQualifierType = useCallback(() => {
    setEditingQualifierType(null);
  }, []);

  const handleDeleteQualifierType = useCallback(
    (typeId: string) => {
      onMessage?.('warning', `Deleting qualifier type ${typeId} will clear all loaded resources`);
      // TODO: Implement qualifier type deletion with confirmation
    },
    [onMessage]
  );

  const renderQualifierTypesPanel = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Qualifier Types</h3>
          <button
            onClick={handleAddQualifierType}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Type
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {hasProcessedResources
            ? 'Qualifier types from loaded configuration'
            : 'Default qualifier types that will be used for resource loading'}
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {currentConfig.qualifierTypes.map((type) => (
          <div key={type.name} className="p-4">
            {editingQualifierType === type.name ? (
              <QualifierTypeEditForm
                qualifierType={type}
                onSave={(updatedType) => handleSaveQualifierType(type.name, updatedType)}
                onCancel={handleCancelEditQualifierType}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">{type.name}</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {type.systemType}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Built-in
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>Context List: {type.configuration?.allowContextList === false ? 'No' : 'Yes'}</div>
                      <div>
                        Case Sensitive:{' '}
                        {type.systemType === 'literal' && type.configuration?.caseSensitive !== false
                          ? 'Yes'
                          : 'No'}
                      </div>
                    </div>
                    {type.systemType === 'literal' && type.configuration?.enumeratedValues && (
                      <div className="mt-1">Values: {type.configuration.enumeratedValues.join(', ')}</div>
                    )}
                    {type.systemType === 'literal' && type.configuration?.hierarchy && (
                      <div className="mt-1">
                        Hierarchy: {Object.keys(type.configuration.hierarchy).length} relationship(s)
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditQualifierType(type.name)}
                    className="p-1.5 text-gray-400 hover:text-blue-600"
                    title="Edit qualifier type"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQualifierType(type.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600"
                    title="Delete qualifier type"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const handleAddQualifier = useCallback(() => {
    // Find an available qualifier type for the new qualifier
    const availableType = currentConfig.qualifierTypes[0]; // Default to first type
    if (!availableType) {
      onMessage?.('error', 'No qualifier types available. Add a qualifier type first.');
      return;
    }

    const newQualifier: Config.Model.ISystemConfiguration['qualifiers'][0] = {
      name: `newQualifier${currentConfig.qualifiers.length + 1}`,
      typeName: availableType.name,
      defaultPriority: 100 + currentConfig.qualifiers.length * 10
    };

    const updatedConfig = {
      ...currentConfig,
      qualifiers: [...currentConfig.qualifiers, newQualifier]
    };

    setCurrentConfig(updatedConfig);
    onMessage?.('info', `Added qualifier: ${newQualifier.name}`);
  }, [currentConfig, onMessage]);

  const handleEditQualifier = useCallback((qualifierName: string) => {
    setEditingQualifier(qualifierName);
  }, []);

  const handleSaveQualifier = useCallback(
    (qualifierName: string, updatedQualifier: Config.Model.ISystemConfiguration['qualifiers'][0]) => {
      const updatedConfig = {
        ...currentConfig,
        qualifiers: currentConfig.qualifiers.map((qualifier) =>
          qualifier.name === qualifierName ? updatedQualifier : qualifier
        )
      };
      setCurrentConfig(updatedConfig);
      setEditingQualifier(null);
      onMessage?.('info', `Updated qualifier: ${updatedQualifier.name}`);
    },
    [currentConfig, onMessage]
  );

  const handleCancelEditQualifier = useCallback(() => {
    setEditingQualifier(null);
  }, []);

  const handleDeleteQualifier = useCallback(
    (qualifierId: string) => {
      onMessage?.('warning', `Deleting qualifier ${qualifierId} will clear all loaded resources`);
      // TODO: Implement qualifier deletion with confirmation
    },
    [onMessage]
  );

  const renderQualifiersPanel = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Qualifiers</h3>
          <button
            onClick={handleAddQualifier}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Qualifier
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {hasProcessedResources
            ? 'Qualifiers from loaded configuration'
            : 'Default qualifiers that will be available for resource resolution'}
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {currentConfig.qualifiers
          .slice()
          .sort((a, b) => b.defaultPriority - a.defaultPriority)
          .map((qualifier) => {
            const qualifierType = currentConfig.qualifierTypes.find((qt) => qt.name === qualifier.typeName);
            return (
              <div key={qualifier.name} className="p-4">
                {editingQualifier === qualifier.name ? (
                  <QualifierEditForm
                    qualifier={qualifier}
                    qualifierTypes={currentConfig.qualifierTypes}
                    onSave={(updatedQualifier) => handleSaveQualifier(qualifier.name, updatedQualifier)}
                    onCancel={handleCancelEditQualifier}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-medium text-gray-900">{qualifier.name}</h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {qualifier.typeName}
                        </span>
                        {qualifier.token && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            token: {qualifier.token}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <div className="grid grid-cols-2 gap-4">
                          <div>Type: {qualifierType?.systemType || 'unknown'}</div>
                          <div>Priority: {qualifier.defaultPriority}</div>
                        </div>
                        {qualifier.tokenIsOptional && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-500">Token is optional</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditQualifier(qualifier.name)}
                        className="p-1.5 text-gray-400 hover:text-blue-600"
                        title="Edit qualifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQualifier(qualifier.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                        title="Delete qualifier"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderResourceTypesPanel = () => {
    const totalResources = resourceState.processedResources?.summary.totalResources || 0;
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resource Types</h3>
          <p className="text-sm text-gray-600 mt-1">
            {hasProcessedResources
              ? 'Resource types from loaded configuration'
              : 'Default resource types available for use'}
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {currentConfig.resourceTypes.map((resourceType) => (
            <div key={resourceType.name} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">{resourceType.name}</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {resourceType.typeName}
                    </span>
                    {hasProcessedResources && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {totalResources} resources
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    JSON object resources for internationalization
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const panels = [
    { id: 'qualifier-types', name: 'Qualifier Types', component: renderQualifierTypesPanel },
    { id: 'qualifiers', name: 'Qualifiers', component: renderQualifiersPanel },
    { id: 'resource-types', name: 'Resource Types', component: renderResourceTypesPanel }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CogIcon className="h-6 w-6 text-gray-400" />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-gray-900">Configuration</h1>
              {(currentConfig.name || currentConfig.description) && (
                <div className="text-sm text-gray-600">
                  {currentConfig.name && <span className="font-medium">{currentConfig.name}</span>}
                  {currentConfig.name && currentConfig.description && (
                    <span className="text-gray-400 mx-1">•</span>
                  )}
                  {currentConfig.description && <span>{currentConfig.description}</span>}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingMetadata(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit Metadata
            </button>
            <button
              onClick={handleLoadConfiguration}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FolderOpenIcon className="h-4 w-4 mr-1" />
              Load Configuration
            </button>
            <button
              onClick={handleRestoreDefaults}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Restore Defaults
            </button>
            <button
              onClick={handleExportConfiguration}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              Export JSON
            </button>
            <button
              onClick={() => handleApplyConfiguration(currentConfig)}
              disabled={!hasChanges}
              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                hasChanges
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-gray-400 bg-gray-300 cursor-not-allowed'
              }`}
            >
              Apply Configuration
            </button>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                hasProcessedResources
                  ? 'bg-green-100 text-green-800'
                  : hasActiveConfiguration
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {hasProcessedResources
                ? 'Loaded Configuration'
                : hasActiveConfiguration
                ? 'Active Configuration'
                : 'Default Configuration'}
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {hasProcessedResources
            ? 'Configuration from loaded resources - editing will clear loaded data'
            : hasActiveConfiguration
            ? `Custom configuration is active - resources will use this configuration when loaded${
                hasChanges ? ' (unsaved changes)' : ''
              }`
            : `Default configuration - will be used when importing resources${
                hasChanges ? ' (unsaved changes)' : ''
              }`}
        </p>
      </div>

      {/* Metadata Edit Modal */}
      {editingMetadata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Configuration Metadata</h3>
            <MetadataEditForm
              name={currentConfig.name || ''}
              description={currentConfig.description || ''}
              onSave={handleSaveMetadata}
              onCancel={handleCancelMetadataEdit}
            />
          </div>
        </div>
      )}

      {/* JSON View Toggle */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-2">
        <button
          onClick={() => setShowJsonView(!showJsonView)}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <CodeBracketIcon className="h-4 w-4 mr-2" />
          {showJsonView ? 'Hide' : 'Show'} JSON Configuration
          {showJsonView ? (
            <ChevronUpIcon className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 ml-2" />
          )}
        </button>
      </div>

      {/* JSON View */}
      {showJsonView && (
        <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Current Configuration (JSON)</h3>
              <button
                onClick={handleExportConfiguration}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                Export
              </button>
            </div>
            <pre className="text-xs text-gray-800 bg-gray-50 p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(currentConfig, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Panel Navigation */}
      <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id as ActivePanel)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activePanel === panel.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {panel.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {panels.find((p) => p.id === activePanel)?.component()}
      </div>
    </div>
  );
};

// Hierarchy Editor Component
interface HierarchyEditorProps {
  hierarchy: Record<string, string>;
  onChange: (hierarchy: Record<string, string>) => void;
  availableValues: string[];
}

const HierarchyEditor: React.FC<HierarchyEditorProps> = ({ hierarchy, onChange, availableValues }) => {
  const [newChild, setNewChild] = useState('');
  const [newParent, setNewParent] = useState('');

  const handleAddRelationship = () => {
    if (newChild && newParent && newChild !== newParent) {
      const updatedHierarchy = { ...hierarchy, [newChild]: newParent };
      onChange(updatedHierarchy);
      setNewChild('');
      setNewParent('');
    }
  };

  const handleRemoveRelationship = (child: string) => {
    const updatedHierarchy = { ...hierarchy };
    delete updatedHierarchy[child];
    onChange(updatedHierarchy);
  };

  const getHierarchyTree = () => {
    const roots = new Set(availableValues);
    const children = new Set(Object.keys(hierarchy));
    const parents = new Set(Object.values(hierarchy));

    // Remove children from roots (they have parents)
    children.forEach((child) => roots.delete(child));

    // Add parents that aren't in available values (for display purposes)
    parents.forEach((parent) => {
      if (!availableValues.includes(parent)) {
        roots.add(parent);
      }
    });

    const buildTree = (value: string, level = 0): any => {
      const childrenOfValue = Object.entries(hierarchy).filter(([, parent]) => parent === value);
      return {
        value,
        level,
        children: childrenOfValue.map(([child]) => buildTree(child, level + 1))
      };
    };

    return Array.from(roots).map((root) => buildTree(root));
  };

  const renderTree = (nodes: any[]): React.ReactNode => {
    return nodes.map((node) => (
      <div key={node.value} className="ml-4">
        <div className="flex items-center space-x-2 py-1">
          <span className="text-sm text-gray-700" style={{ marginLeft: `${node.level * 20}px` }}>
            {node.level > 0 && '└─ '}
            {node.value}
          </span>
          {hierarchy[node.value] && <span className="text-xs text-gray-500">→ {hierarchy[node.value]}</span>}
        </div>
        {node.children.length > 0 && renderTree(node.children)}
      </div>
    ));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Value Hierarchy</label>
      <div className="border border-gray-300 rounded-md p-3 bg-white">
        {/* Add new relationship form */}
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <div className="text-sm font-medium text-gray-700 mb-2">Add Parent-Child Relationship</div>
          <div className="grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600">Child Value</label>
              <select
                value={newChild}
                onChange={(e) => setNewChild(e.target.value)}
                className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select child...</option>
                {availableValues.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Parent Value</label>
              <input
                type="text"
                value={newParent}
                onChange={(e) => setNewParent(e.target.value)}
                placeholder="Enter parent value"
                className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <button
                onClick={handleAddRelationship}
                disabled={!newChild || !newParent || newChild === newParent}
                className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Define which values are children of other values. The parent doesn't need to be in the enumerated
            values list.
          </div>
        </div>

        {/* Current relationships */}
        {Object.keys(hierarchy).length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Current Relationships</div>
            <div className="space-y-1">
              {Object.entries(hierarchy).map(([child, parent]) => (
                <div key={child} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                  <span className="text-sm">
                    <span className="font-medium">{child}</span> →{' '}
                    <span className="text-gray-600">{parent}</span>
                  </span>
                  <button
                    onClick={() => handleRemoveRelationship(child)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hierarchy visualization */}
        {(availableValues.length > 0 || Object.keys(hierarchy).length > 0) && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Hierarchy Tree</div>
            <div className="bg-gray-50 p-2 rounded border text-sm font-mono">
              {getHierarchyTree().length > 0 ? (
                renderTree(getHierarchyTree())
              ) : (
                <div className="text-gray-500 text-center py-2">
                  No hierarchy defined. Add relationships above to see the tree structure.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Edit form components
interface QualifierTypeEditFormProps {
  qualifierType: Config.Model.ISystemConfiguration['qualifierTypes'][0];
  onSave: (updatedType: Config.Model.ISystemConfiguration['qualifierTypes'][0]) => void;
  onCancel: () => void;
}

const QualifierTypeEditForm: React.FC<QualifierTypeEditFormProps> = ({ qualifierType, onSave, onCancel }) => {
  const [name, setName] = useState(qualifierType.name);
  const [systemType, setSystemType] = useState<'language' | 'territory' | 'literal'>(
    qualifierType.systemType
  );
  const [allowContextList, setAllowContextList] = useState(
    qualifierType.configuration?.allowContextList !== false
  );
  const [caseSensitive, setCaseSensitive] = useState(
    qualifierType.systemType === 'literal' && qualifierType.configuration?.caseSensitive !== false
  );
  const [enumeratedValues, setEnumeratedValues] = useState(
    qualifierType.systemType === 'literal' && qualifierType.configuration?.enumeratedValues
      ? qualifierType.configuration.enumeratedValues.join(', ')
      : ''
  );
  const [hierarchy, setHierarchy] = useState<Record<string, string>>(
    qualifierType.systemType === 'literal' && qualifierType.configuration?.hierarchy
      ? (qualifierType.configuration.hierarchy as Record<string, string>)
      : {}
  );

  const handleSave = () => {
    let updatedType: Config.Model.ISystemConfiguration['qualifierTypes'][0];

    if (systemType === 'literal') {
      const configuration: any = {
        allowContextList,
        caseSensitive,
        enumeratedValues: enumeratedValues
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v)
      };

      // Add hierarchy if it has entries
      if (Object.keys(hierarchy).length > 0) {
        configuration.hierarchy = hierarchy;
      }

      updatedType = {
        name,
        systemType: 'literal',
        configuration
      };
    } else {
      updatedType = {
        name,
        systemType,
        configuration: {
          allowContextList
        }
      };
    }

    onSave(updatedType);
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">System Type</label>
          <select
            value={systemType}
            onChange={(e) => setSystemType(e.target.value as 'language' | 'territory' | 'literal')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="language">Language</option>
            <option value="territory">Territory</option>
            <option value="literal">Literal</option>
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={allowContextList}
            onChange={(e) => setAllowContextList(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Allow Context List</span>
        </label>

        {systemType === 'literal' && (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Case Sensitive</span>
          </label>
        )}
      </div>

      {systemType === 'literal' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Enumerated Values (comma-separated)
          </label>
          <input
            type="text"
            value={enumeratedValues}
            onChange={(e) => setEnumeratedValues(e.target.value)}
            placeholder="value1, value2, value3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      )}

      {systemType === 'literal' && (
        <HierarchyEditor
          hierarchy={hierarchy}
          onChange={setHierarchy}
          availableValues={enumeratedValues
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v)}
        />
      )}

      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

interface QualifierEditFormProps {
  qualifier: Config.Model.ISystemConfiguration['qualifiers'][0];
  qualifierTypes: Config.Model.ISystemConfiguration['qualifierTypes'];
  onSave: (updatedQualifier: Config.Model.ISystemConfiguration['qualifiers'][0]) => void;
  onCancel: () => void;
}

const QualifierEditForm: React.FC<QualifierEditFormProps> = ({
  qualifier,
  qualifierTypes,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(qualifier.name);
  const [typeName, setTypeName] = useState(qualifier.typeName);
  const [defaultPriority, setDefaultPriority] = useState(qualifier.defaultPriority);
  const [token, setToken] = useState(qualifier.token || '');
  const [tokenIsOptional, setTokenIsOptional] = useState(qualifier.tokenIsOptional || false);

  const handleSave = () => {
    const updatedQualifier: Config.Model.ISystemConfiguration['qualifiers'][0] = {
      name,
      typeName,
      defaultPriority,
      ...(token && { token }),
      ...(token && { tokenIsOptional })
    };
    onSave(updatedQualifier);
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {qualifierTypes.map((type) => (
              <option key={type.name} value={type.name}>
                {type.name} ({type.systemType})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Default Priority</label>
          <input
            type="number"
            value={defaultPriority}
            onChange={(e) => setDefaultPriority(parseInt(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Token (optional)</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      {token && (
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={tokenIsOptional}
              onChange={(e) => setTokenIsOptional(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Token is optional</span>
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

// Metadata edit form component
interface MetadataEditFormProps {
  name: string;
  description: string;
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
}

const MetadataEditForm: React.FC<MetadataEditFormProps> = ({ name, description, onSave, onCancel }) => {
  const [localName, setLocalName] = useState(name);
  const [localDescription, setLocalDescription] = useState(description);

  const handleSave = () => {
    onSave(localName.trim(), localDescription.trim());
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          placeholder="Enter configuration name"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          placeholder="Enter configuration description"
          rows={3}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default ConfigurationTool;
