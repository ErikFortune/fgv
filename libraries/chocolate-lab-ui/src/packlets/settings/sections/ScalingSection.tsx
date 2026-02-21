import React from 'react';

import type { ICommonSettingsDraft } from '../useSettingsDraft';

export interface IScalingSectionProps {
  readonly scaling: ICommonSettingsDraft['scaling'];
  readonly onChange: (updates: Partial<ICommonSettingsDraft>) => void;
}

const WEIGHT_UNITS = ['g', 'oz', 'lb', 'kg'] as const;
const MEASUREMENT_UNITS = ['g', 'oz', 'lb', 'kg', 'ml', 'tsp', 'tbsp', 'cup'] as const;

export function ScalingSection(props: IScalingSectionProps): React.ReactElement {
  const { scaling, onChange } = props;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Scaling Defaults</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="weight-unit" className="block text-sm font-medium text-gray-700 mb-1">
                Weight Unit
              </label>
              <select
                id="weight-unit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
                value={scaling.weightUnit}
                onChange={(e): void => onChange({ scaling: { ...scaling, weightUnit: e.target.value } })}
              >
                {WEIGHT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="measurement-unit" className="block text-sm font-medium text-gray-700 mb-1">
                Measurement Unit
              </label>
              <select
                id="measurement-unit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
                value={scaling.measurementUnit}
                onChange={(e): void => onChange({ scaling: { ...scaling, measurementUnit: e.target.value } })}
              >
                {MEASUREMENT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="batch-multiplier" className="block text-sm font-medium text-gray-700 mb-1">
                Batch Multiplier
              </label>
              <input
                id="batch-multiplier"
                type="number"
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
                defaultValue={scaling.batchMultiplier}
                onBlur={(e): void =>
                  onChange({ scaling: { ...scaling, batchMultiplier: parseFloat(e.target.value) || 1.0 } })
                }
              />
              <p className="mt-1 text-xs text-gray-400">
                Default multiplier for batch scaling (e.g., 1.0 = single batch).
              </p>
            </div>

            <div>
              <label htmlFor="buffer-percentage" className="block text-sm font-medium text-gray-700 mb-1">
                Buffer Percentage
              </label>
              <div className="relative">
                <input
                  id="buffer-percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
                  defaultValue={Math.round(scaling.bufferPercentage * 100)}
                  onBlur={(e): void =>
                    onChange({
                      scaling: { ...scaling, bufferPercentage: (parseFloat(e.target.value) || 0) / 100 }
                    })
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">Extra buffer added to molded confection batches.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
