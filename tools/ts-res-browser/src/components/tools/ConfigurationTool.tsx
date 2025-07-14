import React, { useState, useMemo, useCallback } from 'react';
import { CogIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import { Message } from '../../types/app';
import { QualifierTypes } from '@fgv/ts-res';
import { DEFAULT_QUALIFIER_DECLARATIONS } from '../../utils/tsResIntegration';

interface ConfigurationToolProps {
  onMessage?: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
}

interface QualifierTypeConfig {
  id: string;
  name: string;
  baseType: 'language' | 'territory' | 'literal';
  allowContextList: number; // 0=false, 1=true, 2=multiple
  defaultPriority: number;
  editable: boolean; // Built-in types are not editable
}

interface QualifierConfig {
  id: string;
  name: string;
  qualifierTypeId: string;
  defaultPriority: number;
  validationPattern?: string;
}

interface ResourceTypeInfo {
  id: string;
  name: string;
  description: string;
  validationRules: string[];
  usageCount: number;
}

type ActivePanel = 'qualifier-types' | 'qualifiers' | 'resource-types';

/**
 * Get default qualifier types configuration
 */
function getDefaultQualifierTypes(): QualifierTypeConfig[] {
  // Return static configuration for the three built-in qualifier types
  return [
    {
      id: 'language',
      name: 'language',
      baseType: 'language',
      allowContextList: 0,
      defaultPriority: 100,
      editable: false
    },
    {
      id: 'territory',
      name: 'territory',
      baseType: 'territory',
      allowContextList: 1,
      defaultPriority: 90,
      editable: false
    },
    {
      id: 'literal',
      name: 'literal',
      baseType: 'literal',
      allowContextList: 0,
      defaultPriority: 80,
      editable: false
    }
  ];
}

/**
 * Get default qualifiers configuration
 */
function getDefaultQualifiers(): QualifierConfig[] {
  return DEFAULT_QUALIFIER_DECLARATIONS.map((decl) => ({
    id: decl.name,
    name: decl.name,
    qualifierTypeId: decl.typeName,
    defaultPriority: decl.defaultPriority,
    validationPattern: decl.token ? `token: ${decl.token}` : undefined
  }));
}

/**
 * Get default resource types configuration
 */
function getDefaultResourceTypes(): ResourceTypeInfo[] {
  // Return static configuration for the built-in resource types
  return [
    {
      id: 'json',
      name: 'json',
      description: 'JSON object resources',
      validationRules: ['Valid JSON syntax', 'Object type required'],
      usageCount: 0
    }
  ];
}

const ConfigurationTool: React.FC<ConfigurationToolProps> = ({ onMessage, resourceManager }) => {
  const { state: resourceState } = resourceManager;
  const [activePanel, setActivePanel] = useState<ActivePanel>('qualifier-types');

  // Check if we have processed resources
  const hasProcessedResources = !!resourceState.processedResources;

  // Use actual configuration if available, otherwise use defaults
  const qualifierTypes = useMemo<QualifierTypeConfig[]>(() => {
    if (!hasProcessedResources) {
      return getDefaultQualifierTypes();
    }

    // For loaded resources, we can infer qualifier types from the qualifiers in the compiled collection
    const compiledCollection = resourceState.processedResources.compiledCollection;
    if (!compiledCollection?.qualifiers) {
      return getDefaultQualifierTypes();
    }

    // Extract unique qualifier type names from the qualifiers
    const qualifierTypeNames = new Set(compiledCollection.qualifiers.map((q) => q.typeName));

    // Map to our format (still using static information since we don't have full type details)
    return Array.from(qualifierTypeNames).map((typeName, index) => {
      let baseType: 'language' | 'territory' | 'literal' = 'literal';
      if (typeName === 'language') baseType = 'language';
      else if (typeName === 'territory') baseType = 'territory';

      return {
        id: typeName,
        name: typeName,
        baseType,
        allowContextList: 0,
        defaultPriority: 100 - index * 10,
        editable: false
      };
    });
  }, [hasProcessedResources, resourceState.processedResources?.compiledCollection.qualifiers]);

  // Use actual qualifiers if available, otherwise use defaults
  const qualifiers = useMemo<QualifierConfig[]>(() => {
    if (!hasProcessedResources) {
      return getDefaultQualifiers();
    }

    const compiledCollection = resourceState.processedResources.compiledCollection;
    if (!compiledCollection?.qualifiers) {
      return getDefaultQualifiers();
    }

    return compiledCollection.qualifiers.map((q) => ({
      id: q.name,
      name: q.name,
      qualifierTypeId: q.typeName,
      defaultPriority: q.defaultPriority
    }));
  }, [hasProcessedResources, resourceState.processedResources?.compiledCollection.qualifiers]);

  // Use actual resource types if available, otherwise use defaults
  const resourceTypes = useMemo<ResourceTypeInfo[]>(() => {
    if (!hasProcessedResources) {
      return getDefaultResourceTypes();
    }

    const totalResources = resourceState.processedResources?.summary.totalResources || 0;

    // For loaded resources, we infer that JSON is the primary resource type
    // since that's what the system typically uses
    return [
      {
        id: 'json',
        name: 'json',
        description: 'JSON object resources',
        validationRules: ['Valid JSON syntax', 'Object type required'],
        usageCount: totalResources
      }
    ];
  }, [hasProcessedResources, resourceState.processedResources?.summary.totalResources]);

  const handleAddQualifierType = useCallback(() => {
    onMessage?.('info', 'Adding qualifier types will clear all loaded resources');
    // TODO: Implement qualifier type addition
  }, [onMessage]);

  const handleEditQualifierType = useCallback(
    (typeId: string) => {
      onMessage?.('info', `Editing qualifier type: ${typeId}`);
      // TODO: Implement qualifier type editing
    },
    [onMessage]
  );

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
        {qualifierTypes.map((type) => (
          <div key={type.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-900">{type.name}</h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {type.baseType}
                  </span>
                  {!type.editable && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Built-in
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      Context List:{' '}
                      {type.allowContextList === 0 ? 'No' : type.allowContextList === 1 ? 'Yes' : 'Multiple'}
                    </div>
                    <div>Default Priority: {type.defaultPriority}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {type.editable && (
                  <>
                    <button
                      onClick={() => handleEditQualifierType(type.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600"
                      title="Edit qualifier type"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQualifierType(type.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600"
                      title="Delete qualifier type"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleAddQualifier = useCallback(() => {
    onMessage?.('info', 'Adding qualifiers will clear all loaded resources');
    // TODO: Implement qualifier addition
  }, [onMessage]);

  const handleEditQualifier = useCallback(
    (qualifierId: string) => {
      onMessage?.('info', `Editing qualifier: ${qualifierId}`);
      // TODO: Implement qualifier editing
    },
    [onMessage]
  );

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
        {qualifiers.map((qualifier) => {
          const qualifierType = qualifierTypes.find((qt) => qt.id === qualifier.qualifierTypeId);
          return (
            <div key={qualifier.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-sm font-medium text-gray-900">{qualifier.name}</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {qualifierType?.name || 'Unknown Type'}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>Type: {qualifierType?.baseType || 'unknown'}</div>
                      <div>Priority: {qualifier.defaultPriority}</div>
                    </div>
                    {qualifier.validationPattern && (
                      <div className="mt-1">
                        Pattern:{' '}
                        <code className="text-xs bg-gray-100 px-1 rounded">
                          {qualifier.validationPattern}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditQualifier(qualifier.id)}
                    className="p-1.5 text-gray-400 hover:text-blue-600"
                    title="Edit qualifier"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQualifier(qualifier.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600"
                    title="Delete qualifier"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderResourceTypesPanel = () => (
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
        {resourceTypes.map((resourceType) => (
          <div key={resourceType.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-900">{resourceType.name}</h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {resourceType.usageCount} resources
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{resourceType.description}</p>
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Validation Rules:</div>
                  <div className="flex flex-wrap gap-1">
                    {resourceType.validationRules.map((rule, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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

export default ConfigurationTool;
