import React, { useMemo, useState, useCallback } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import {
  IGridViewInitParams,
  IResolutionResult,
  IResolutionActions,
  IResolutionState,
  IGridColumnDefinition,
  IResourceTypeColumnMapping,
  IGridCellProps
} from '../../../types';
import { isJsonObject, JsonValue } from '@fgv/ts-json-base';
import { EditableGridCell } from './EditableGridCell';

/**
 * Props for the ResourceGrid component.
 */
interface IResourceGridProps {
  /** Grid configuration defining columns and display options */
  gridConfig: IGridViewInitParams;
  /** Array of resource IDs to display in the grid */
  selectedResourceIds: string[];
  /** Map of resource resolutions for grid display */
  resourceResolutions: Map<string, IResolutionResult>;
  /** Resolution actions for editing integration */
  resolutionActions?: IResolutionActions;
  /** Resolution state for edit tracking */
  resolutionState?: IResolutionState;
}

/**
 * Utility function to extract a value from an object using a path.
 * Supports both string paths (simple property) and array paths (nested properties).
 */
function extractValueByPath(obj: JsonValue | undefined, path: string | string[]): JsonValue | undefined {
  if (typeof path === 'string') {
    if (!isJsonObject(obj)) {
      return undefined;
    }
    return obj[path];
  }

  if (Array.isArray(path)) {
    let current = obj;
    for (const segment of path) {
      if (current === null || current === undefined) return undefined;
      if (!isJsonObject(current)) {
        return undefined;
      }
      current = current[segment];
    }
    return current;
  }

  return undefined;
}

/**
 * Component for rendering a basic grid cell.
 */
const GridCell: React.FC<IGridCellProps> = ({
  value,
  resourceId,
  column,
  resolvedValue,
  isEdited,
  className = ''
}) => {
  // Use custom renderer if provided
  if (column.cellRenderer) {
    const CustomRenderer = column.cellRenderer;
    return (
      <CustomRenderer
        value={value}
        resourceId={resourceId}
        column={column}
        resolvedValue={resolvedValue}
        isEdited={isEdited}
        className={className}
      />
    );
  }

  // Default rendering based on value type
  const displayValue = useMemo(() => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);

    // For objects/arrays, show a compact JSON representation
    try {
      const jsonStr = JSON.stringify(value);
      return jsonStr.length > 100 ? `${jsonStr.substring(0, 100)}...` : jsonStr;
    } catch {
      return String(value);
    }
  }, [value]);

  return (
    <div className={`px-3 py-2 text-sm ${isEdited ? 'bg-blue-50' : ''} ${className}`}>
      {displayValue}
      {isEdited && (
        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          edited
        </span>
      )}
    </div>
  );
};

/**
 * Main ResourceGrid component for displaying resources in a table format.
 *
 * @example
 * ```tsx
 * <ResourceGrid
 *   gridConfig={gridConfig}
 *   selectedResourceIds={['user.welcome', 'user.goodbye']}
 *   resourceResolutions={resolutionMap}
 *   resolutionActions={actions}
 *   resolutionState={state}
 * />
 * ```
 *
 * @public
 */
export const ResourceGrid: React.FC<IResourceGridProps> = ({
  gridConfig,
  selectedResourceIds,
  resourceResolutions,
  resolutionActions,
  resolutionState
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Build column definitions for all resources
  const allColumns = useMemo(() => {
    const columnMap = new Map<string, IGridColumnDefinition>();
    const mappingMap = new Map<string, IResourceTypeColumnMapping>();

    // Index column mappings by resource type
    gridConfig.columnMapping.forEach((mapping) => {
      mappingMap.set(mapping.resourceType, mapping);
    });

    // For each resource, determine its type and get appropriate columns
    selectedResourceIds.forEach((resourceId) => {
      const resolution = resourceResolutions.get(resourceId);
      if (!resolution?.success || !resolution.resource) return;

      const resourceType = resolution.resource.resourceType.key;
      const mapping = mappingMap.get(resourceType);

      if (mapping) {
        mapping.columns.forEach((col) => {
          if (!columnMap.has(col.id)) {
            columnMap.set(col.id, col);
          }
        });
      } else if (gridConfig.columnMapping[0]?.defaultColumn) {
        // Use default column if no specific mapping found
        const defaultCol = gridConfig.columnMapping[0].defaultColumn;
        columnMap.set(defaultCol.id, defaultCol);
      }
    });

    return Array.from(columnMap.values());
  }, [gridConfig.columnMapping, selectedResourceIds, resourceResolutions]);

  // Extract and sort grid data
  const gridData = useMemo(() => {
    const rows = selectedResourceIds
      .map((resourceId) => {
        const resolution = resourceResolutions.get(resourceId);
        const isEdited = resolutionActions?.hasEdit?.(resourceId) || false;

        return {
          resourceId,
          resolution,
          isEdited,
          values: new Map<string, JsonValue>()
        };
      })
      .filter((row) => row.resolution?.success);

    // Extract values for each column
    rows.forEach((row) => {
      if (!row.resolution?.success) return;

      allColumns.forEach((column) => {
        const value = extractValueByPath(row.resolution!.composedValue, column.dataPath) ?? null;
        row.values.set(column.id, value);
      });
    });

    // Apply sorting if configured
    if (sortColumn && gridConfig.presentationOptions?.enableSorting !== false) {
      rows.sort((a, b) => {
        const aValue = a.values.get(sortColumn);
        const bValue = b.values.get(sortColumn);

        // Handle null/undefined values
        if ((aValue === null || aValue === undefined) && (bValue === null || bValue === undefined)) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        // Compare values
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          // Fallback to string comparison
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return rows;
  }, [
    selectedResourceIds,
    resourceResolutions,
    allColumns,
    sortColumn,
    sortDirection,
    resolutionActions,
    gridConfig.presentationOptions
  ]);

  // Handle column sorting
  const handleSort = useCallback(
    (columnId: string) => {
      if (!gridConfig.presentationOptions?.enableSorting) return;

      const column = allColumns.find((col) => col.id === columnId);
      if (!column?.sortable) return;

      if (sortColumn === columnId) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(columnId);
        setSortDirection('asc');
      }
    },
    [allColumns, sortColumn, gridConfig.presentationOptions]
  );

  if (selectedResourceIds.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <p className="text-lg font-medium mb-2">No Resources Selected</p>
          <p className="text-sm">
            This grid configuration selected no resources. Check your resource selection criteria.
          </p>
        </div>
      </div>
    );
  }

  if (allColumns.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">
          <p className="text-lg font-medium mb-2">No Columns Configured</p>
          <p className="text-sm">
            No column mappings found for the selected resource types. Configure column mappings in the grid
            configuration.
          </p>
        </div>
      </div>
    );
  }

  const enableSorting = gridConfig.presentationOptions?.enableSorting !== false;
  const showRowNumbers = gridConfig.presentationOptions?.showRowNumbers || false;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {showRowNumbers && (
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
            )}
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Resource ID
            </th>
            {allColumns.map((column) => (
              <th
                key={column.id}
                className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  enableSorting && column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                style={column.width ? { width: column.width } : undefined}
                onClick={() => enableSorting && column.sortable && handleSort(column.id)}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.title}</span>
                  {enableSorting && column.sortable && (
                    <div className="flex flex-col">
                      <ChevronUpIcon
                        className={`h-3 w-3 ${
                          sortColumn === column.id && sortDirection === 'asc'
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        }`}
                      />
                      <ChevronDownIcon
                        className={`h-3 w-3 -mt-1 ${
                          sortColumn === column.id && sortDirection === 'desc'
                            ? 'text-blue-600'
                            : 'text-gray-400'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {gridData.map((row, index) => (
            <tr key={row.resourceId} className={`${row.isEdited ? 'bg-blue-25' : 'hover:bg-gray-50'}`}>
              {showRowNumbers && (
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
              )}
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                {row.resourceId}
                {row.isEdited && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    edited
                  </span>
                )}
              </td>
              {allColumns.map((column) => {
                const value = row.values.get(column.id) ?? null;
                const isEdited = resolutionActions?.hasEdit?.(row.resourceId) || false;

                if (column.editable) {
                  return (
                    <td key={column.id} className="px-0 py-0">
                      <EditableGridCell
                        value={value}
                        resourceId={row.resourceId}
                        column={column}
                        resolvedValue={row.resolution?.composedValue || null}
                        isEdited={isEdited}
                        resolutionActions={resolutionActions}
                        resolutionState={resolutionState}
                      />
                    </td>
                  );
                } else {
                  return (
                    <td key={column.id} className="px-0 py-0">
                      <GridCell
                        value={value}
                        resourceId={row.resourceId}
                        column={column}
                        resolvedValue={row.resolution?.composedValue || null}
                        isEdited={isEdited}
                      />
                    </td>
                  );
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {gridData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg font-medium mb-2">No Data Available</p>
            <p className="text-sm">Selected resources could not be resolved with the current context.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceGrid;
