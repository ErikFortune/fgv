import React from 'react';
import { ProcessedResources, ExtendedProcessedResources, ViewBaseProps } from '../../../types';

/**
 * Resource selection data returned by the onResourceSelect callback.
 *
 * This interface provides comprehensive information about the selected resource,
 * eliminating the need for consumers to perform additional lookups.
 *
 * @example
 * ```tsx
 * const handleResourceSelect = (selection: ResourceSelection<MyResourceType>) => {
 *   if (selection.resourceId) {
 *     console.log('Selected:', selection.resourceId);
 *     if (selection.resourceData) {
 *       console.log('Data:', selection.resourceData);
 *     }
 *     if (selection.isPending) {
 *       console.log('Pending operation:', selection.pendingType);
 *     }
 *   }
 * };
 * ```
 *
 * @public
 */
export interface ResourceSelection<T = unknown> {
  /** The ID of the selected resource, or null if no selection */
  resourceId: string | null;
  /** The actual resource data if available and typed */
  resourceData?: T;
  /** Whether this is a pending (unsaved) resource */
  isPending?: boolean;
  /** Type of pending operation for unsaved resources */
  pendingType?: 'new' | 'modified' | 'deleted';
}

/**
 * Props for the ResourcePicker component.
 *
 * The ResourcePicker is a comprehensive component for browsing and selecting resources
 * with support for multiple view modes, search, annotations, and pending resources.
 *
 * @example
 * ```tsx
 * <ResourcePicker
 *   resources={processedResources}
 *   selectedResourceId={currentId}
 *   onResourceSelect={(selection) => {
 *     setCurrentId(selection.resourceId);
 *     if (selection.resourceData) {
 *       // Use the resource data directly
 *       handleResourceData(selection.resourceData);
 *     }
 *   }}
 *   defaultView="tree"
 *   enableSearch={true}
 *   resourceAnnotations={{
 *     'res1': { badge: { text: '3', variant: 'info' } }
 *   }}
 * />
 * ```
 *
 * @public
 */
export interface ResourcePickerProps<T = unknown> extends ViewBaseProps {
  /** Processed resources to display in the picker */
  resources: ProcessedResources | ExtendedProcessedResources | null;

  /** Currently selected resource ID */
  selectedResourceId: string | null;
  /** Callback fired when a resource is selected, providing comprehensive selection data */
  onResourceSelect: (selection: ResourceSelection<T>) => void;

  /** Default view mode to use on initial render */
  defaultView?: 'list' | 'tree';
  /** Whether to show the list/tree view toggle buttons */
  showViewToggle?: boolean;

  /** Path to treat as root for tree branch isolation (e.g., "platform/territories") */
  rootPath?: string;
  /** Hide the root node itself, showing only its children */
  hideRootNode?: boolean;

  /** Whether to enable the search input */
  enableSearch?: boolean;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Scope of search - entire tree or just the currently visible branch */
  searchScope?: 'all' | 'current-branch';

  /** Annotations to display next to resource names (badges, indicators, etc.) */
  resourceAnnotations?: ResourceAnnotations;

  /** Pending (unsaved) resources to display alongside persisted resources */
  pendingResources?: PendingResource<T>[];

  /** Message to display when no resources are available */
  emptyMessage?: string;
  /** Height of the picker component */
  height?: string | number;
}

/**
 * Annotations that can be displayed next to resource names in the picker.
 *
 * This allows the host application to provide visual indicators for resources,
 * such as candidate counts, editing status, or validation states.
 *
 * @example
 * ```tsx
 * const annotations: ResourceAnnotations = {
 *   'user.welcome': {
 *     badge: { text: '3', variant: 'info' },
 *     suffix: '(3 candidates)'
 *   },
 *   'user.modified': {
 *     badge: { text: 'M', variant: 'edited' },
 *     indicator: { type: 'dot', value: 'orange', tooltip: 'Modified' }
 *   }
 * };
 * ```
 *
 * @public
 */
export interface ResourceAnnotations {
  /** Map of resource IDs to their annotation configurations */
  [resourceId: string]: ResourceAnnotation;
}

/**
 * Individual resource annotation configuration.
 *
 * Supports multiple types of visual indicators that can be combined:
 * - Badge: Small colored badge with text
 * - Indicator: Dot, icon, or text indicator with optional tooltip
 * - Suffix: Additional content displayed after the resource name
 *
 * @example
 * ```tsx
 * const annotation: ResourceAnnotation = {
 *   badge: { text: 'NEW', variant: 'new' },
 *   indicator: {
 *     type: 'icon',
 *     value: <CheckIcon />,
 *     tooltip: 'Validated'
 *   },
 *   suffix: <span className="text-gray-500">(5 candidates)</span>,
 *   className: 'resource-highlighted'
 * };
 * ```
 *
 * @public
 */
export interface ResourceAnnotation {
  /** Small colored badge displayed next to the resource name */
  badge?: {
    /** Text content of the badge */
    text: string;
    /** Visual style variant for the badge */
    variant: 'info' | 'warning' | 'success' | 'error' | 'edited' | 'new';
  };
  /** Visual indicator (dot, icon, or text) with optional tooltip */
  indicator?: {
    /** Type of indicator to display */
    type: 'dot' | 'icon' | 'text';
    /** Content of the indicator (color for dot, React element for icon, string for text) */
    value: string | React.ReactNode;
    /** Optional tooltip text shown on hover */
    tooltip?: string;
  };
  /** Additional content displayed after the resource name (e.g., candidate counts) */
  suffix?: React.ReactNode;
  /** Additional CSS class names to apply to the resource item */
  className?: string;
}

/**
 * Represents a resource that hasn't been persisted yet.
 *
 * Pending resources are displayed alongside persisted resources in the picker,
 * allowing users to interact with unsaved changes. They are visually distinguished
 * with appropriate styling and annotations.
 *
 * @example
 * ```tsx
 * const pendingResources: PendingResource<MyResourceType>[] = [
 *   {
 *     id: 'user.new-welcome',
 *     type: 'new',
 *     resourceType: 'string',
 *     displayName: 'Welcome Message (New)',
 *     resourceData: { text: 'Welcome!', locale: 'en' }
 *   },
 *   {
 *     id: 'user.existing-modified',
 *     type: 'modified',
 *     displayName: 'User Profile (Modified)',
 *     resourceData: { name: 'Updated Name' }
 *   }
 * ];
 * ```
 *
 * @public
 */
export interface PendingResource<T = unknown> {
  /** Unique identifier for the pending resource */
  id: string;
  /** Type of pending operation */
  type: 'new' | 'modified' | 'deleted';
  /** Optional resource type identifier */
  resourceType?: string;
  /** Display name for the resource in the picker */
  displayName?: string;
  /** The actual resource data with type safety */
  resourceData?: T;
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
