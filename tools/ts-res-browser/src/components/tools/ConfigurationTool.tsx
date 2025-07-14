import React, { useState, useMemo, useCallback } from 'react';
import { CogIcon, PlusIcon, PencilIcon, TrashIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import { Message } from '../../types/app';
import { Config } from '@fgv/ts-res';
import { DEFAULT_SYSTEM_CONFIGURATION } from '../../utils/tsResIntegration';
import { fileImporter } from '../../utils/fileImport';
import { Result } from '@fgv/ts-utils';

interface ConfigurationToolProps {
  onMessage?: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
}

type ActivePanel = 'qualifier-types' | 'qualifiers' | 'resource-types';

/**
 * Get current system configuration
 */
function getCurrentSystemConfiguration(hasProcessedResources: boolean): Config.Model.ISystemConfiguration {
  if (!hasProcessedResources) {
    return DEFAULT_SYSTEM_CONFIGURATION;
  }

  // TODO: Extract actual configuration from loaded resources
  // For now, return the default configuration
  return DEFAULT_SYSTEM_CONFIGURATION;
}

const ConfigurationTool: React.FC<ConfigurationToolProps> = ({ onMessage, resourceManager }) => {
  const { state: resourceState } = resourceManager;
  const [activePanel, setActivePanel] = useState<ActivePanel>('qualifier-types');

  // Check if we have processed resources
  const hasProcessedResources = !!resourceState.processedResources;

  // Get current system configuration
  const systemConfiguration = useMemo(() => {
    return getCurrentSystemConfiguration(hasProcessedResources);
  }, [hasProcessedResources]);

  // State for configuration edits
  const [currentConfig, setCurrentConfig] = useState<Config.Model.ISystemConfiguration>(systemConfiguration);

  // State for editing items
  const [editingQualifierType, setEditingQualifierType] = useState<string | null>(null);
  const [editingQualifier, setEditingQualifier] = useState<string | null>(null);

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

      // If configuration was loaded from files, clear existing resources first
      if (hasProcessedResources) {
        resourceManager.actions.reset();
        onMessage?.('info', 'Cleared existing resources due to configuration change');
      }

      setCurrentConfig(parsedConfig);
      onMessage?.(
        'success',
        `Configuration loaded successfully from ${file.name}${
          parsedConfig.name ? ` (${parsedConfig.name})` : ''
        }`
      );
    } catch (error) {
      onMessage?.(
        'error',
        `Unexpected error loading configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [hasProcessedResources, resourceManager.actions, onMessage]);

  // Apply configuration handler
  const handleApplyConfiguration = useCallback(
    (newConfig: Config.Model.ISystemConfiguration) => {
      // TODO: Implement configuration application
      // This should reinitialize the system with the new configuration
      onMessage?.('info', 'Configuration application not yet implemented');
      setCurrentConfig(newConfig);
    },
    [onMessage]
  );

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
            <h1 className="text-xl font-semibold text-gray-900">Configuration</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLoadConfiguration}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FolderOpenIcon className="h-4 w-4 mr-1" />
              Load Configuration
            </button>
            <button
              onClick={() => handleApplyConfiguration(currentConfig)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Configuration
            </button>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                hasProcessedResources ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {hasProcessedResources ? 'Loaded Configuration' : 'Default Configuration'}
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {hasProcessedResources
            ? 'Configuration from loaded resources - editing will clear loaded data'
            : 'Default configuration - will be used when importing resources'}
        </p>
      </div>

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

  const handleSave = () => {
    let updatedType: Config.Model.ISystemConfiguration['qualifierTypes'][0];

    if (systemType === 'literal') {
      updatedType = {
        name,
        systemType: 'literal',
        configuration: {
          allowContextList,
          caseSensitive,
          enumeratedValues: enumeratedValues
            .split(',')
            .map((v) => v.trim())
            .filter((v) => v)
        }
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
                {type.name}
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

export default ConfigurationTool;
