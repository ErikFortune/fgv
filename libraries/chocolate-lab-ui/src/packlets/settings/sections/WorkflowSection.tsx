import React from 'react';

import type { ICommonSettingsDraft } from '../useSettingsDraft';

export interface IWorkflowSectionProps {
  readonly workflow: ICommonSettingsDraft['workflow'];
  readonly onChange: (updates: Partial<ICommonSettingsDraft>) => void;
}

export function WorkflowSection(props: IWorkflowSectionProps): React.ReactElement {
  const { workflow, onChange } = props;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Preferences</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="autosave-interval" className="block text-sm font-medium text-gray-700 mb-1">
              Auto-save Interval (seconds)
            </label>
            <input
              id="autosave-interval"
              type="number"
              min="0"
              step="10"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
              defaultValue={workflow.autoSaveIntervalSeconds}
              onBlur={(e): void =>
                onChange({
                  workflow: { ...workflow, autoSaveIntervalSeconds: parseInt(e.target.value, 10) || 0 }
                })
              }
            />
            <p className="mt-1 text-xs text-gray-400">Set to 0 to disable auto-save.</p>
          </div>

          <div>
            <label htmlFor="recipe-suffix" className="block text-sm font-medium text-gray-700 mb-1">
              Adapted Recipe Name Suffix
            </label>
            <input
              id="recipe-suffix"
              type="text"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
              defaultValue={workflow.adaptedRecipeNameSuffix}
              onBlur={(e): void =>
                onChange({ workflow: { ...workflow, adaptedRecipeNameSuffix: e.target.value } })
              }
            />
            <p className="mt-1 text-xs text-gray-400">
              Appended to recipe names when creating adapted copies.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-choco-accent focus:ring-choco-accent"
                checked={workflow.confirmAbandon}
                onChange={(e): void =>
                  onChange({ workflow: { ...workflow, confirmAbandon: e.target.checked } })
                }
              />
              <span className="text-sm text-gray-700">Confirm before abandoning unsaved changes</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-choco-accent focus:ring-choco-accent"
                checked={workflow.showPercentages}
                onChange={(e): void =>
                  onChange({ workflow: { ...workflow, showPercentages: e.target.checked } })
                }
              />
              <span className="text-sm text-gray-700">Show ingredient percentages by default</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-choco-accent focus:ring-choco-accent"
                checked={workflow.autoExpandIngredients}
                onChange={(e): void =>
                  onChange({ workflow: { ...workflow, autoExpandIngredients: e.target.checked } })
                }
              />
              <span className="text-sm text-gray-700">Auto-expand ingredient details</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
