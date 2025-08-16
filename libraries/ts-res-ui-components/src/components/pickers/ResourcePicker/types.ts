import React from 'react';
import { ProcessedResources, ExtendedProcessedResources, ViewBaseProps } from '../../../types';

/**
 * Props for the ResourcePicker component
 */
export interface ResourcePickerProps extends ViewBaseProps {
  // Core data
  resources: ProcessedResources | ExtendedProcessedResources | null;

  // Selection
  selectedResourceId: string | null;
  onResourceSelect: (resourceId: string | null) => void;

  // View options
  defaultView?: 'list' | 'tree';
  showViewToggle?: boolean;

  // Tree branch isolation
  rootPath?: string; // Path to treat as root (e.g., "platform/territories")
  hideRootNode?: boolean; // Hide the root node itself, show only children

  // Search
  enableSearch?: boolean;
  searchPlaceholder?: string;
  searchScope?: 'all' | 'current-branch'; // Search entire tree or just visible branch

  // Annotations from host
  resourceAnnotations?: ResourceAnnotations;

  // Pending resources (for editors)
  pendingResources?: PendingResource[];

  // Optional customization
  emptyMessage?: string;
  height?: string | number;
}

/**
 * Annotations that can be displayed next to resource names
 */
export interface ResourceAnnotations {
  [resourceId: string]: ResourceAnnotation;
}

/**
 * Individual resource annotation configuration
 */
export interface ResourceAnnotation {
  badge?: {
    text: string;
    variant: 'info' | 'warning' | 'success' | 'error' | 'edited' | 'new';
  };
  indicator?: {
    type: 'dot' | 'icon' | 'text';
    value: string | React.ReactNode;
    tooltip?: string;
  };
  suffix?: React.ReactNode; // e.g., "(3 candidates)"
  className?: string; // Additional styling
}

/**
 * Represents a resource that hasn't been persisted yet
 */
export interface PendingResource {
  id: string;
  type: 'new' | 'modified' | 'deleted';
  resourceType?: string;
  displayName?: string; // Display name for the resource
  // Note: parentPath removed - the id itself determines placement in the tree
}

/**
 * Props for individual resource items
 */
export interface ResourceItemProps {
  resourceId: string;
  displayName?: string;
  isSelected: boolean;
  isPending?: boolean;
  annotation?: ResourceAnnotation;
  onClick: (resourceId: string) => void;
  searchTerm?: string;
  className?: string;
}

/**
 * Props for the list view component
 */
export interface ResourcePickerListProps {
  resourceIds: string[];
  pendingResources?: PendingResource[];
  selectedResourceId: string | null;
  onResourceSelect: (resourceId: string) => void;
  resourceAnnotations?: ResourceAnnotations;
  searchTerm?: string;
  className?: string;
  emptyMessage?: string;
}

/**
 * Props for the tree view component
 */
export interface ResourcePickerTreeProps {
  resources: ProcessedResources | ExtendedProcessedResources;
  pendingResources?: PendingResource[];
  selectedResourceId: string | null;
  onResourceSelect: (resourceId: string) => void;
  resourceAnnotations?: ResourceAnnotations;
  searchTerm?: string;
  rootPath?: string;
  hideRootNode?: boolean;
  className?: string;
  emptyMessage?: string;
}
