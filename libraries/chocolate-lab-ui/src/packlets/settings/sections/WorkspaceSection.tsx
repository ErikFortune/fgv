import React from 'react';

import { Settings } from '@fgv/ts-chocolate';

import type { IBootstrapSettingsDraft } from '../useSettingsDraft';

export interface IWorkspaceSectionProps {
  readonly deviceId: Settings.DeviceId;
  readonly bootstrap: IBootstrapSettingsDraft;
  readonly onBootstrapChange: (updates: Partial<IBootstrapSettingsDraft>) => void;
}

export function WorkspaceSection(props: IWorkspaceSectionProps): React.ReactElement {
  const { deviceId, bootstrap, onBootstrapChange } = props;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workspace</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device ID</label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500 font-mono select-all">
              {deviceId}
            </div>
            <p className="mt-1 text-xs text-gray-400">Read-only unique identifier for this device.</p>
          </div>

          <div>
            <label htmlFor="device-name" className="block text-sm font-medium text-gray-700 mb-1">
              Device Name
            </label>
            <input
              id="device-name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
              defaultValue={bootstrap.deviceName}
              placeholder="My Device"
              onBlur={(e): void => onBootstrapChange({ deviceName: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-400">Human-readable name for this device.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
