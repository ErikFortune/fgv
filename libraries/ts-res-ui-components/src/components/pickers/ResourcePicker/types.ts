import React from 'react';
import { ProcessedResources, ExtendedProcessedResources, ViewBaseProps } from '../../../types';

/**
 * Resource selection data returned by the onResourceSelect callback
 */
export interface ResourceSelection<T = unknown> {
  resourceId: string | null;
  resourceData?: T; // The actual resource data if available
  isPending?: boolean; // Whether this is a pending resource
  pendingType?: 'new' | 'modified' | 'deleted'; // Type of pending operation
}

/**
 * Props for the ResourcePicker component
 */
export interface ResourcePickerProps<T = unknown> extends ViewBaseProps {
  // Core data
  resources: ProcessedResources | ExtendedProcessedResources | null;

  // Selection
  selectedResourceId: string | null;
  onResourceSelect: (selection: ResourceSelection<T>) => void;

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
  pendingResources?: PendingResource<T>[];

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
export interface PendingResource<T = unknown> {
  id: string;
  type: 'new' | 'modified' | 'deleted';
  resourceType?: string;
  displayName?: string; // Display name for the resource
  resourceData?: T; // The actual resource data
  // Note: parentPath removed - the id itself determines placement in the tree
}

/**
 * Props for individual resource items
 */
export interface ResourceItemProps<T = unknown> {
  resourceId: string;
  displayName?: string;
  isSelected: boolean;
  isPending?: boolean;
  annotation?: ResourceAnnotation;
  onClick: (selection: ResourceSelection<T>) => void;
  searchTerm?: string;
  className?: string;
  resourceData?: T; // The actual resource data if available
  pendingType?: 'new' | 'modified' | 'deleted'; // Type of pending operation
}

/**
 * Props for the list view component
 */
export interface ResourcePickerListProps<T = unknown> {
  resourceIds: string[];
  pendingResources?: PendingResource<T>[];
  selectedResourceId: string | null;
  onResourceSelect: (selection: ResourceSelection<T>) => void;
  resourceAnnotations?: ResourceAnnotations;
  searchTerm?: string;
  rootPath?: string;
  hideRootNode?: boolean;
  className?: string;
  emptyMessage?: string;
}

/**
 * Props for the tree view component
 */
export interface ResourcePickerTreeProps<T = unknown> {
  resources: ProcessedResources | ExtendedProcessedResources;
  pendingResources?: PendingResource<T>[];
  selectedResourceId: string | null;
  onResourceSelect: (selection: ResourceSelection<T>) => void;
  resourceAnnotations?: ResourceAnnotations;
  searchTerm?: string;
  rootPath?: string;
  hideRootNode?: boolean;
  className?: string;
  emptyMessage?: string;
}
