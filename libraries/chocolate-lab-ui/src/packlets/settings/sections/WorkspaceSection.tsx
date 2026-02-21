import React from 'react';

import { Settings } from '@fgv/ts-chocolate';

import type { IDeviceSettingsDraft } from '../useSettingsDraft';

export interface IWorkspaceSectionProps {
  readonly deviceId: Settings.DeviceId;
  readonly device: IDeviceSettingsDraft;
  readonly onDeviceChange: (updates: Partial<IDeviceSettingsDraft>) => void;
}

export function WorkspaceSection(props: IWorkspaceSectionProps): React.ReactElement {
  const { deviceId, device, onDeviceChange } = props;

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
              defaultValue={device.deviceName}
              placeholder="My Device"
              onBlur={(e): void => onDeviceChange({ deviceName: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-400">Human-readable name for this device.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
