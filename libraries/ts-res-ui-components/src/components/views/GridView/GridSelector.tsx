import React, { useCallback } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { GridViewInitParams } from '../../../types';

/**
 * Props for the GridSelector component.
 */
export interface GridSelectorProps {
  /** Available grid configurations */
  gridConfigurations: GridViewInitParams[];
  /** ID of the currently active grid */
  activeGridId: string;
  /** Callback when the active grid changes */
  onGridChange: (gridId: string) => void;
  /** How to present the grid selector */
  presentation?: 'tabs' | 'cards' | 'accordion' | 'dropdown';
  /** Whether users can reorder grid tabs */
  allowReordering?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * GridSelector component for switching between multiple grid configurations.
 *
 * Provides different presentation modes for selecting which grid to display,
 * supporting tabs, cards, accordion, and dropdown interfaces. Enables users
 * to quickly switch between different views of their resource data.
 *
 * @example
 * ```tsx
 * <GridSelector
 *   gridConfigurations={[
 *     { id: 'users', title: 'User Data', ... },
 *     { id: 'products', title: 'Product Catalog', ... }
 *   ]}
 *   activeGridId="users"
 *   presentation="tabs"
 *   onGridChange={setActiveGridId}
 * />
 * ```
 * @public
 */
export const GridSelector: React.FC<GridSelectorProps> = ({
  gridConfigurations,
  activeGridId,
  onGridChange,
  presentation = 'tabs',
  allowReordering = false,
  className = ''
}) => {
  const handleGridSelect = useCallback(
    (gridId: string) => {
      if (gridId !== activeGridId) {
        onGridChange(gridId);
      }
    },
    [activeGridId, onGridChange]
  );

  const activeGrid = gridConfigurations.find((grid) => grid.id === activeGridId);

  if (gridConfigurations.length === 0) {
    return null;
  }

  if (gridConfigurations.length === 1) {
    // Single grid - show just the title
    const grid = gridConfigurations[0];
    return (
      <div className={`mb-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900">{grid.title}</h3>
        {grid.description && <p className="text-sm text-gray-600 mt-1">{grid.description}</p>}
      </div>
    );
  }

  switch (presentation) {
    case 'tabs':
      return (
        <div className={`mb-6 ${className}`}>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Grid selector">
              {gridConfigurations.map((grid) => {
                const isActive = grid.id === activeGridId;
                return (
                  <button
                    key={grid.id}
                    onClick={() => handleGridSelect(grid.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {grid.title}
                  </button>
                );
              })}
            </nav>
          </div>
          {activeGrid?.description && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">{activeGrid.description}</p>
            </div>
          )}
        </div>
      );

    case 'cards':
      return (
        <div className={`mb-6 ${className}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gridConfigurations.map((grid) => {
              const isActive = grid.id === activeGridId;
              return (
                <button
                  key={grid.id}
                  onClick={() => handleGridSelect(grid.id)}
                  className={`p-4 text-left rounded-lg border-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <h4 className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                    {grid.title}
                  </h4>
                  {grid.description && (
                    <p className={`mt-1 text-sm ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                      {grid.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );

    case 'dropdown':
      return (
        <div className={`mb-6 ${className}`}>
          <div className="flex items-center space-x-4">
            <label htmlFor="grid-selector" className="text-sm font-medium text-gray-700">
              Grid View:
            </label>
            <div className="relative">
              <select
                id="grid-selector"
                value={activeGridId}
                onChange={(e) => handleGridSelect(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {gridConfigurations.map((grid) => (
                  <option key={grid.id} value={grid.id}>
                    {grid.title}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          {activeGrid?.description && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">{activeGrid.description}</p>
            </div>
          )}
        </div>
      );

    case 'accordion':
      return (
        <div className={`mb-6 space-y-2 ${className}`}>
          {gridConfigurations.map((grid) => {
            const isActive = grid.id === activeGridId;
            return (
              <div key={grid.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => handleGridSelect(grid.id)}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between ${
                    isActive ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <h4 className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                      {grid.title}
                    </h4>
                    {grid.description && (
                      <p className={`mt-1 text-sm ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                        {grid.description}
                      </p>
                    )}
                  </div>
                  {isActive && (
                    <div className="flex items-center text-blue-600">
                      <span className="text-xs font-medium">ACTIVE</span>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      );

    default:
      return null;
  }
};

export default GridSelector;
