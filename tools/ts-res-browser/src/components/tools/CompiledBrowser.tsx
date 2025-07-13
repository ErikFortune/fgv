import React, { useState, useMemo } from 'react';
import {
  CubeIcon,
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { UseResourceManagerReturn } from '../../hooks/useResourceManager';
import { Message } from '../../types/app';
import { ResourceJson } from '@fgv/ts-res';

interface CompiledBrowserProps {
  onMessage?: (type: Message['type'], message: string) => void;
  resourceManager: UseResourceManagerReturn;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'resource' | 'section';
  children?: TreeNode[];
  data?: any;
}

const CompiledBrowser: React.FC<CompiledBrowserProps> = ({ onMessage, resourceManager }) => {
  const { state: resourceState } = resourceManager;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root', 'resources']));

  // Build tree structure from compiled resources
  const treeData = useMemo(() => {
    if (!resourceState.processedResources?.compiledCollection) {
      return null;
    }

    const compiledCollection = resourceState.processedResources.compiledCollection;

    const tree: TreeNode = {
      id: 'root',
      name: 'Compiled Resources',
      type: 'folder',
      children: []
    };

    try {
      // 1. Resources section
      const resourcesCount = compiledCollection.resources?.length || 0;
      const resourcesSection: TreeNode = {
        id: 'resources',
        name: `Resources (${resourcesCount})`,
        type: 'section',
        children: []
      };

      // Build simple resource list from compiled resources
      if (compiledCollection.resources && compiledCollection.resources.length > 0) {
        resourcesSection.children = compiledCollection.resources.map((resource, index) => ({
          id: `resource-${index}`,
          name: resource.id || `Resource ${index}`,
          type: 'resource' as const,
          data: { type: 'compiled-resource', resource }
        }));
      }

      tree.children!.push(resourcesSection);

      // 2. Decisions section
      const decisionsCount = compiledCollection.decisions?.length || 0;
      const decisionsSection: TreeNode = {
        id: 'decisions',
        name: `Decisions (${decisionsCount})`,
        type: 'section',
        data: { type: 'decisions', collection: compiledCollection.decisions }
      };
      tree.children!.push(decisionsSection);

      // 3. Condition Sets section
      const conditionSetsCount = compiledCollection.conditionSets?.length || 0;
      const conditionSetsSection: TreeNode = {
        id: 'condition-sets',
        name: `Condition Sets (${conditionSetsCount})`,
        type: 'section',
        data: { type: 'condition-sets', collection: compiledCollection.conditionSets }
      };
      tree.children!.push(conditionSetsSection);

      // 4. Conditions section
      const conditionsCount = compiledCollection.conditions?.length || 0;
      const conditionsSection: TreeNode = {
        id: 'conditions',
        name: `Conditions (${conditionsCount})`,
        type: 'section',
        data: { type: 'conditions', collection: compiledCollection.conditions }
      };
      tree.children!.push(conditionsSection);
    } catch (error) {
      onMessage?.('error', `Error building tree: ${error instanceof Error ? error.message : String(error)}`);
    }

    return tree;
  }, [resourceState.processedResources?.compiledCollection, onMessage]);

  const handleNodeClick = (node: TreeNode) => {
    setSelectedNodeId(node.id);
    onMessage?.('info', `Selected: ${node.name}`);

    // Toggle expansion for folders
    if (node.type === 'folder' || (node.type === 'section' && node.children)) {
      setExpandedNodes((prev) => {
        const newExpanded = new Set(prev);
        if (newExpanded.has(node.id)) {
          newExpanded.delete(node.id);
        } else {
          newExpanded.add(node.id);
        }
        return newExpanded;
      });
    }
  };

  const renderTreeNode = (node: TreeNode, level = 0): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${8 + level * 16}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {hasChildren && (
            <div className="w-4 h-4 mr-1 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-gray-500" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-5 mr-1" />}

          <div className="w-4 h-4 mr-2 flex items-center justify-center">
            {node.type === 'folder' ? (
              isExpanded ? (
                <FolderOpenIcon className="w-4 h-4 text-blue-500" />
              ) : (
                <FolderIcon className="w-4 h-4 text-blue-500" />
              )
            ) : node.type === 'resource' ? (
              <DocumentTextIcon className="w-4 h-4 text-green-500" />
            ) : (
              <CubeIcon className="w-4 h-4 text-purple-500" />
            )}
          </div>

          <span className={`text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
            {node.name}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div>{node.children!.map((child) => renderTreeNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  if (!resourceState.processedResources) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CubeIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Compiled Browser</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Compiled Resources</h3>
            <p className="text-gray-600 mb-6">
              Import resources to explore the compiled resource collection.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Use the Import Tool to load resources, then return here to browse the
                compiled collection structure including resources, decisions, condition sets, and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <CubeIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Compiled Browser</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Error Loading Compiled Resources</h3>
            <p className="text-gray-600">Unable to load the compiled resource collection.</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedNode = selectedNodeId ? findNodeById(treeData, selectedNodeId) : null;

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <CubeIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Compiled Browser</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Left side: Tree Navigation */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center space-x-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Compiled Collection</h3>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
              {renderTreeNode(treeData)}
            </div>
          </div>

          {/* Right side: Details Panel */}
          <div className="lg:w-1/2 flex flex-col">
            {selectedNode ? (
              <NodeDetail node={selectedNode} onMessage={onMessage} />
            ) : (
              <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center">
                  <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select an item to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to find node by ID
const findNodeById = (tree: TreeNode, id: string): TreeNode | null => {
  if (tree.id === id) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};

// Node detail component
interface NodeDetailProps {
  node: TreeNode;
  onMessage?: (type: Message['type'], message: string) => void;
}

const NodeDetail: React.FC<NodeDetailProps> = ({ node, onMessage }) => {
  const renderNodeDetails = () => {
    if (!node.data) {
      return (
        <div className="p-4">
          <h4 className="font-medium text-gray-700 mb-2">Folder: {node.name}</h4>
          <p className="text-sm text-gray-600">
            {node.children ? `Contains ${node.children.length} items` : 'Empty folder'}
          </p>
        </div>
      );
    }

    const { type, collection, resource } = node.data;

    switch (type) {
      case 'compiled-resource':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Compiled Resource Details</h4>
              <div className="bg-white p-3 rounded border space-y-2 text-sm">
                <div>
                  <strong>ID:</strong> {resource?.id || 'Unknown'}
                </div>
                <div>
                  <strong>Resource Type Index:</strong> {resource?.resourceTypeIndex ?? 'Unknown'}
                </div>
                <div>
                  <strong>Decision Index:</strong> {resource?.decisionIndex ?? 'Unknown'}
                </div>
              </div>
            </div>

            {resource?.candidates && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Candidates</h4>
                <div className="space-y-2">
                  {resource.candidates.map((candidateItem: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="text-sm">
                        <strong>Candidate {index + 1}</strong>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {typeof candidateItem === 'object' && candidateItem ? (
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(candidateItem, null, 2)}
                          </pre>
                        ) : (
                          <div>Candidate Index: {candidateItem}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'resource':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Resource Details</h4>
              <div className="bg-white p-3 rounded border space-y-2 text-sm">
                <div>
                  <strong>ID:</strong> {resource?.id || 'Unknown'}
                </div>
                <div>
                  <strong>Type:</strong> {resource?.resourceType?.key || 'Unknown'}
                </div>
                <div>
                  <strong>Candidates:</strong> {resource?.candidates?.length || 0}
                </div>
              </div>
            </div>

            {resource?.candidates && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Candidates</h4>
                <div className="space-y-2">
                  {resource.candidates.map((candidate: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="text-sm">
                        <strong>Candidate {index + 1}</strong>
                        {candidate.isPartial && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                            Partial
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {candidate.mergeMethod && (
                          <div>
                            <strong>Merge Method:</strong> {candidate.mergeMethod}
                          </div>
                        )}
                      </div>
                      {candidate.json && (
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto max-h-32">
                          {JSON.stringify(candidate.json, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'decisions':
        return (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Decisions Collection</h4>
            <div className="bg-white p-3 rounded border text-sm">
              <div>
                <strong>Count:</strong> {collection?.length || 0}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Decisions contain the logic for selecting resource candidates based on condition sets.
              </div>
            </div>
            {collection && collection.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Decision Details</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {collection.map(
                    (decision: ResourceJson.Compiled.ICompiledAbstractDecision, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="text-sm">
                          <strong>Decision {index}</strong>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Condition Sets: {decision.conditionSets?.length || 0}
                        </div>
                        {decision.conditionSets && decision.conditionSets.length > 0 && (
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(decision.conditionSets, null, 2)}
                          </pre>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'condition-sets':
        return (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Condition Sets Collection</h4>
            <div className="bg-white p-3 rounded border text-sm">
              <div>
                <strong>Count:</strong> {collection?.length || 0}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Condition sets group related conditions together for decision making.
              </div>
            </div>
            {collection && collection.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Condition Set Details</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {collection.map(
                    (conditionSet: ResourceJson.Compiled.ICompiledConditionSet, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="text-sm">
                          <strong>Condition Set {index}</strong>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Conditions: {conditionSet.conditions?.length || 0}
                        </div>
                        {conditionSet.conditions && conditionSet.conditions.length > 0 && (
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto">
                            {JSON.stringify(conditionSet.conditions, null, 2)}
                          </pre>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'conditions':
        return (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Conditions Collection</h4>
            <div className="bg-white p-3 rounded border text-sm">
              <div>
                <strong>Count:</strong> {collection?.length || 0}
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Individual conditions that test qualifier values for resource selection.
              </div>
            </div>
            {collection && collection.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Condition Details</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {collection.map((condition: ResourceJson.Compiled.ICompiledCondition, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="text-sm">
                        <strong>Condition {index}</strong>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <div>Qualifier Index: {condition.qualifierIndex}</div>
                        <div>Value: {condition.value}</div>
                        <div>Priority: {condition.priority}</div>
                        {condition.operator && <div>Operator: {condition.operator}</div>}
                        {condition.scoreAsDefault && <div>Score as Default: {condition.scoreAsDefault}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="p-4">
            <h4 className="font-medium text-gray-700 mb-2">{node.name}</h4>
            <p className="text-sm text-gray-600">Unknown node type</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Details</h3>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        {renderNodeDetails()}
      </div>
    </div>
  );
};

export default CompiledBrowser;
