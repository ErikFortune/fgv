import React from 'react';

import { Settings } from '@fgv/ts-chocolate';

import type { IBootstrapSettingsDraft } from '../useSettingsDraft';

export interface IWorkspaceSectionProps {
  readonly deviceId: Settings.DeviceId;
  readonly bootstrap: IBootstrapSettingsDraft;
  readonly onBootstrapChange: (updates: Partial<IBootstrapSettingsDraft>) => void;
  readonly currentConfigNamespace?: string;
  readonly currentConfigNamespaceSource?: 'url' | 'default' | 'none';
  readonly defaultConfigNamespace?: string;
  readonly onSetDefaultConfigNamespace?: (namespace: string | undefined) => void;
}

export function WorkspaceSection(props: IWorkspaceSectionProps): React.ReactElement {
  const {
    deviceId,
    bootstrap,
    onBootstrapChange,
    currentConfigNamespace,
    currentConfigNamespaceSource,
    defaultConfigNamespace,
    onSetDefaultConfigNamespace
  } = props;

  const effectiveSourceLabel =
    currentConfigNamespaceSource === 'url'
      ? 'URL query param'
      : currentConfigNamespaceSource === 'default'
      ? 'Stored default profile'
      : 'No profile';
  const effectiveProfileLabel = currentConfigNamespace ?? 'none';
  const isEffectiveDefault =
    currentConfigNamespace !== undefined &&
    defaultConfigNamespace !== undefined &&
    currentConfigNamespace === defaultConfigNamespace;

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile</label>
            <div className="space-y-2">
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <div className="text-gray-500">Current (effective)</div>
                <div className="font-mono text-gray-800">{effectiveProfileLabel}</div>
                <div className="text-xs text-gray-500">
                  Source: {effectiveSourceLabel}
                  {!isEffectiveDefault && currentConfigNamespace && defaultConfigNamespace
                    ? ` · default is ${defaultConfigNamespace}`
                    : ''}
                </div>
              </div>

              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <div className="text-gray-500">Stored default</div>
                <div className="font-mono text-gray-800">{defaultConfigNamespace ?? 'none'}</div>
              </div>

              {onSetDefaultConfigNamespace && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      currentConfigNamespace === undefined ||
                      currentConfigNamespace === defaultConfigNamespace
                    }
                    onClick={(): void => onSetDefaultConfigNamespace(currentConfigNamespace)}
                    className="px-3 py-1.5 text-xs font-medium rounded border border-choco-primary text-choco-primary hover:bg-choco-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use current as default
                  </button>
                  <button
                    type="button"
                    disabled={defaultConfigNamespace === undefined}
                    onClick={(): void => onSetDefaultConfigNamespace(undefined)}
                    className="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear default
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Applies when no `?config=` profile is supplied on launch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
