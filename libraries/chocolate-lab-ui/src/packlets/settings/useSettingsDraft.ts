import { useCallback, useEffect, useState } from 'react';

import { Settings } from '@fgv/ts-chocolate';

import { useWorkspace } from '../workspace';

// ============================================================================
// Draft Types
// ============================================================================

/**
 * Mutable draft of common settings fields exposed in the UI.
 * @public
 */
export interface ICommonSettingsDraft {
  readonly defaultTargets: Settings.ICommonSettings['defaultTargets'];
  readonly externalLibraries: ReadonlyArray<Settings.IExternalLibraryRefConfig>;
  readonly scaling: {
    readonly weightUnit: string;
    readonly measurementUnit: string;
    readonly batchMultiplier: number;
    readonly bufferPercentage: number;
  };
  readonly workflow: {
    readonly autoSaveIntervalSeconds: number;
    readonly confirmAbandon: boolean;
    readonly showPercentages: boolean;
    readonly autoExpandIngredients: boolean;
    readonly adaptedRecipeNameSuffix: string;
  };
}

/**
 * Mutable draft of device settings fields exposed in the UI.
 * @public
 */
export interface IDeviceSettingsDraft {
  readonly deviceName: string;
}

/**
 * Return value of useSettingsDraft.
 * @public
 */
export interface ISettingsDraft {
  readonly common: ICommonSettingsDraft;
  readonly device: IDeviceSettingsDraft;
  readonly isDirty: boolean;
  readonly isSaving: boolean;
  readonly saveError: string | undefined;
  readonly updateCommon: (updates: Partial<ICommonSettingsDraft>) => void;
  readonly updateDevice: (updates: Partial<IDeviceSettingsDraft>) => void;
  readonly save: () => Promise<void>;
  readonly revert: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function buildCommonDraft(settings: Settings.ICommonSettings): ICommonSettingsDraft {
  return {
    defaultTargets: settings.defaultTargets,
    externalLibraries: settings.externalLibraries ?? [],
    scaling: {
      weightUnit: settings.tools?.scaling?.weightUnit ?? 'g',
      measurementUnit: settings.tools?.scaling?.measurementUnit ?? 'g',
      batchMultiplier: settings.tools?.scaling?.batchMultiplier ?? 1.0,
      bufferPercentage: settings.tools?.scaling?.bufferPercentage ?? 0.1
    },
    workflow: {
      autoSaveIntervalSeconds: settings.tools?.workflow?.autoSaveIntervalSeconds ?? 60,
      confirmAbandon: settings.tools?.workflow?.confirmAbandon ?? true,
      showPercentages: settings.tools?.workflow?.showPercentages ?? true,
      autoExpandIngredients: settings.tools?.workflow?.autoExpandIngredients ?? false,
      adaptedRecipeNameSuffix: settings.tools?.workflow?.adaptedRecipeNameSuffix ?? ' (adapted)'
    }
  };
}

function buildDeviceDraft(settings: Settings.IDeviceSettings): IDeviceSettingsDraft {
  return {
    deviceName: settings.deviceName ?? ''
  };
}

function draftsEqual(a: ICommonSettingsDraft, b: ICommonSettingsDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function deviceDraftsEqual(a: IDeviceSettingsDraft, b: IDeviceSettingsDraft): boolean {
  return a.deviceName === b.deviceName;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages a local draft of workspace settings.
 * Fields update the draft on blur; an explicit save() call persists to ISettingsManager.
 * @public
 */
export function useSettingsDraft(): ISettingsDraft | undefined {
  const workspace = useWorkspace();
  const settingsManager = workspace.settings;

  const [commonDraft, setCommonDraft] = useState<ICommonSettingsDraft | undefined>(undefined);
  const [deviceDraft, setDeviceDraft] = useState<IDeviceSettingsDraft | undefined>(undefined);
  const [savedCommon, setSavedCommon] = useState<ICommonSettingsDraft | undefined>(undefined);
  const [savedDevice, setSavedDevice] = useState<IDeviceSettingsDraft | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!settingsManager) return;
    const common = buildCommonDraft(settingsManager.getCommonSettings());
    const device = buildDeviceDraft(settingsManager.getDeviceSettings());
    setCommonDraft(common);
    setDeviceDraft(device);
    setSavedCommon(common);
    setSavedDevice(device);
  }, [settingsManager]);

  const updateCommon = useCallback((updates: Partial<ICommonSettingsDraft>): void => {
    setCommonDraft((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const updateDevice = useCallback((updates: Partial<IDeviceSettingsDraft>): void => {
    setDeviceDraft((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const save = useCallback(async (): Promise<void> => {
    if (!settingsManager || !commonDraft || !deviceDraft) return;
    setIsSaving(true);
    setSaveError(undefined);

    const scalingUpdate: Settings.IScalingDefaults = {
      weightUnit: commonDraft.scaling.weightUnit as Settings.IScalingDefaults['weightUnit'],
      measurementUnit: commonDraft.scaling.measurementUnit as Settings.IScalingDefaults['measurementUnit'],
      batchMultiplier: commonDraft.scaling.batchMultiplier,
      bufferPercentage: commonDraft.scaling.bufferPercentage
    };
    const workflowUpdate: Settings.IWorkflowPreferences = {
      autoSaveIntervalSeconds: commonDraft.workflow.autoSaveIntervalSeconds,
      confirmAbandon: commonDraft.workflow.confirmAbandon,
      showPercentages: commonDraft.workflow.showPercentages,
      autoExpandIngredients: commonDraft.workflow.autoExpandIngredients,
      adaptedRecipeNameSuffix: commonDraft.workflow.adaptedRecipeNameSuffix
    };
    const commonResult = settingsManager.updateCommonSettings({
      externalLibraries: commonDraft.externalLibraries.length > 0 ? commonDraft.externalLibraries : undefined,
      tools: { scaling: scalingUpdate, workflow: workflowUpdate }
    });

    if (commonResult.isFailure()) {
      setSaveError(`Failed to update common settings: ${commonResult.message}`);
      setIsSaving(false);
      return;
    }

    const deviceResult = settingsManager.updateDeviceSettings({
      deviceName: deviceDraft.deviceName || undefined
    });

    if (deviceResult.isFailure()) {
      setSaveError(`Failed to update device settings: ${deviceResult.message}`);
      setIsSaving(false);
      return;
    }

    const saveResult = await settingsManager.save();
    if (saveResult.isFailure()) {
      setSaveError(`Failed to save settings: ${saveResult.message}`);
    } else {
      setSavedCommon(commonDraft);
      setSavedDevice(deviceDraft);
    }
    setIsSaving(false);
  }, [settingsManager, commonDraft, deviceDraft]);

  const revert = useCallback((): void => {
    setCommonDraft(savedCommon);
    setDeviceDraft(savedDevice);
    setSaveError(undefined);
  }, [savedCommon, savedDevice]);

  if (!settingsManager || !commonDraft || !deviceDraft || !savedCommon || !savedDevice) {
    return undefined;
  }

  const isDirty = !draftsEqual(commonDraft, savedCommon) || !deviceDraftsEqual(deviceDraft, savedDevice);

  return {
    common: commonDraft,
    device: deviceDraft,
    isDirty,
    isSaving,
    saveError,
    updateCommon,
    updateDevice,
    save,
    revert
  };
}
