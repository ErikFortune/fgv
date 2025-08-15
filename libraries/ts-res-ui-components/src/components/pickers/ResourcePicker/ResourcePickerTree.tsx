import React, { useState, useMemo, useCallback } from 'react';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { ResourcePickerTreeProps } from './types';
import { ResourceItem } from './ResourceItem';
import {
  buildResourceTree,
  TreeNode,
  filterTreeBranch,
  searchResources,
  mergeWithPendingResources
} from './utils/treeNavigation';

/**
 * Tree view for the ResourcePicker component
 * Enhanced version of ResourceTreeView with branch isolation and annotation support
 */
export const ResourcePickerTree: React.FC<ResourcePickerTreeProps> = ({
  resources,
  pendingResources,
  selectedResourceId,
  onResourceSelect,
  resourceAnnotations,
  searchTerm = '',
  rootPath,
  hideRootNode,
  className = '',
  emptyMessage = 'No resources available'
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Get all resource IDs from the resource manager
  const allResourceIds = useMemo(() => {
    if (!resources?.summary.resourceIds) {
      return [];
    }

    // Merge with pending resources
    const existingIds = resources.summary.resourceIds;
    return mergeWithPendingResources(existingIds, pendingResources);
  }, [resources?.summary.resourceIds, pendingResources]);

  // Apply search and branch filtering
  const filteredResourceIds = useMemo(() => {
    let ids = allResourceIds;

    // Apply branch isolation first
    if (rootPath) {
      ids = filterTreeBranch(ids, rootPath, hideRootNode);
    }

    // Then apply search
    if (searchTerm) {
      ids = searchResources(ids, searchTerm, 'current-branch', rootPath);
    }

    return ids;
  }, [allResourceIds, rootPath, hideRootNode, searchTerm]);

  // Build tree structure
  const treeNodes = useMemo(() => {
    return buildResourceTree(filteredResourceIds, rootPath, hideRootNode, expandedNodes);
  }, [filteredResourceIds, rootPath, hideRootNode, expandedNodes]);

  // Create a map of pending resource IDs for quick lookup
  const pendingResourceMap = useMemo(() => {
    const map = new Map<string, boolean>();
    pendingResources?.forEach((pr) => {
      if (pr.type === 'new') {
        map.set(pr.id, true);
      }
    });
    return map;
  }, [pendingResources]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const renderTreeNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isPending = pendingResourceMap.has(node.id);
    const pendingResource = pendingResources?.find((pr) => pr.id === node.id);
    const displayName = pendingResource?.displayName || node.displayName;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center px-2 py-1.5 cursor-pointer hover:bg-gray-100
            ${selectedResourceId === node.id ? 'bg-purple-50 border-l-2 border-purple-500' : ''}
            ${searchTerm && node.id.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bg-yellow-50' : ''}
          `}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            onResourceSelect(node.id);
            if (hasChildren) {
              toggleNode(node.id);
            }
          }}
        >
          {/* Expand/Collapse chevron */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="mr-1 hover:bg-gray-200 rounded p-0.5"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-gray-600" />
              )}
            </button>
          )}

          {/* Spacer for alignment when no children */}
          {!hasChildren && <div className="w-5 mr-1" />}

          {/* Folder/Document icon */}
          <div className="mr-2 flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpenIcon className="w-4 h-4 text-blue-500" />
              ) : (
                <FolderIcon className="w-4 h-4 text-blue-500" />
              )
            ) : (
              <ResourceItem
                resourceId={node.id}
                displayName={displayName}
                isSelected={false}
                isPending={isPending}
                annotation={undefined}
                onClick={() => {}}
                searchTerm=""
                className="p-0 border-0 hover:bg-transparent"
              />
            )}
          </div>

          {/* Node name with search highlighting */}
          <span
            className={`
              text-sm truncate flex-1
              ${selectedResourceId === node.id ? 'font-medium text-purple-900' : 'text-gray-700'}
              ${isPending ? 'italic opacity-70' : ''}
            `}
            title={node.id}
          >
            {searchTerm ? <HighlightedText text={displayName} searchTerm={searchTerm} /> : displayName}
          </span>

          {/* Annotations */}
          {resourceAnnotations?.[node.id] && (
            <div className="flex items-center gap-2 ml-2">
              {renderAnnotation(resourceAnnotations[node.id])}
            </div>
          )}
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderTreeNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  const renderAnnotation = (annotation: any) => {
    const elements: React.ReactNode[] = [];

    if (annotation.indicator) {
      elements.push(
        <span key="indicator" className="text-xs" title={annotation.indicator.tooltip}>
          {annotation.indicator.type === 'dot' ? (
            <span className="text-orange-500">●</span>
          ) : (
            annotation.indicator.value
          )}
        </span>
      );
    }

    if (annotation.badge) {
      const getBadgeClasses = (variant: string) => {
        const baseClasses = 'px-1.5 py-0.5 text-xs font-medium rounded';
        const variantClasses: Record<string, string> = {
          info: 'bg-blue-100 text-blue-800',
          warning: 'bg-yellow-100 text-yellow-800',
          success: 'bg-green-100 text-green-800',
          error: 'bg-red-100 text-red-800',
          edited: 'bg-purple-100 text-purple-800',
          new: 'bg-emerald-100 text-emerald-800'
        };
        return `${baseClasses} ${variantClasses[variant] || variantClasses.info}`;
      };

      elements.push(
        <span key="badge" className={getBadgeClasses(annotation.badge.variant)}>
          {annotation.badge.text}
        </span>
      );
    }

    if (annotation.suffix) {
      elements.push(
        <span key="suffix" className="text-xs text-gray-500">
          {annotation.suffix}
        </span>
      );
    }

    return elements;
  };

  if (treeNodes.length === 0) {
    return (
      <div className={`${className} p-4 text-center text-gray-500`}>
        <p>{searchTerm ? 'No resources match your search' : emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-y-auto`}>{treeNodes.map((node) => renderTreeNode(node))}</div>
  );
};

/**
 * Component to highlight search terms in text
 */
const HighlightedText: React.FC<{ text: string; searchTerm: string }> = ({ text, searchTerm }) => {
  if (!searchTerm) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default ResourcePickerTree;
