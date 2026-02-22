import { useCallback, useEffect, useState } from 'react';

import { Settings } from '@fgv/ts-chocolate';

import { useWorkspace } from '../workspace';

// ============================================================================
// Draft Types
// ============================================================================

/**
 * Mutable draft of bootstrap settings fields exposed in the UI.
 * @public
 */
export interface IBootstrapSettingsDraft {
  readonly includeBuiltIn: boolean;
  readonly localStorageLibrary: boolean;
  readonly localStorageUserData: boolean;
  readonly storeLevel: Settings.ILogSettings['storeLevel'];
  readonly displayLevel: Settings.ILogSettings['displayLevel'];
  readonly toastLevel: Settings.ILogSettings['toastLevel'];
}

/**
 * Mutable draft of common settings fields exposed in the UI.
 * @public
 */
export interface ICommonSettingsDraft {
  readonly defaultTargets: Settings.ICommonSettings['defaultTargets'];
  readonly externalLibraries: ReadonlyArray<Settings.IExternalLibraryRefConfig>;
  readonly defaultStorageTargets: Settings.IDefaultStorageTargets | undefined;
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
  readonly localDirectories: ReadonlyArray<Settings.ILocalDirectoryRef>;
}

/**
 * Return value of useSettingsDraft.
 * @public
 */
export interface ISettingsDraft {
  readonly bootstrap: IBootstrapSettingsDraft;
  readonly common: ICommonSettingsDraft;
  readonly device: IDeviceSettingsDraft;
  readonly isDirty: boolean;
  readonly hasBootstrapChanges: boolean;
  readonly isSaving: boolean;
  readonly saveError: string | undefined;
  readonly updateBootstrap: (updates: Partial<IBootstrapSettingsDraft>) => void;
  readonly updateCommon: (updates: Partial<ICommonSettingsDraft>) => void;
  readonly updateDevice: (updates: Partial<IDeviceSettingsDraft>) => void;
  readonly save: () => Promise<void>;
  readonly revert: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function buildBootstrapDraft(settings: Settings.IBootstrapSettings | undefined): IBootstrapSettingsDraft {
  return {
    includeBuiltIn: settings?.includeBuiltIn ?? true,
    localStorageLibrary: settings?.localStorage?.library ?? true,
    localStorageUserData: settings?.localStorage?.userData ?? true,
    storeLevel: settings?.logging?.storeLevel,
    displayLevel: settings?.logging?.displayLevel,
    toastLevel: settings?.logging?.toastLevel
  };
}

function bootstrapDraftsEqual(a: IBootstrapSettingsDraft, b: IBootstrapSettingsDraft): boolean {
  return (
    a.includeBuiltIn === b.includeBuiltIn &&
    a.localStorageLibrary === b.localStorageLibrary &&
    a.localStorageUserData === b.localStorageUserData &&
    a.storeLevel === b.storeLevel &&
    a.displayLevel === b.displayLevel &&
    a.toastLevel === b.toastLevel
  );
}

function buildCommonDraft(settings: Settings.ICommonSettings): ICommonSettingsDraft {
  return {
    defaultTargets: settings.defaultTargets,
    externalLibraries: settings.externalLibraries ?? [],
    defaultStorageTargets: settings.defaultStorageTargets,
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
    deviceName: settings.deviceName ?? '',
    localDirectories: settings.localDirectories ?? []
  };
}

function draftsEqual(a: ICommonSettingsDraft, b: ICommonSettingsDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function deviceDraftsEqual(a: IDeviceSettingsDraft, b: IDeviceSettingsDraft): boolean {
  return (
    a.deviceName === b.deviceName && JSON.stringify(a.localDirectories) === JSON.stringify(b.localDirectories)
  );
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

  const [bootstrapDraft, setBootstrapDraft] = useState<IBootstrapSettingsDraft | undefined>(undefined);
  const [commonDraft, setCommonDraft] = useState<ICommonSettingsDraft | undefined>(undefined);
  const [deviceDraft, setDeviceDraft] = useState<IDeviceSettingsDraft | undefined>(undefined);
  const [savedBootstrap, setSavedBootstrap] = useState<IBootstrapSettingsDraft | undefined>(undefined);
  const [savedCommon, setSavedCommon] = useState<ICommonSettingsDraft | undefined>(undefined);
  const [savedDevice, setSavedDevice] = useState<IDeviceSettingsDraft | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!settingsManager) return;
    const bootstrap = buildBootstrapDraft(settingsManager.getBootstrapSettings());
    const common = buildCommonDraft(settingsManager.getCommonSettings());
    const device = buildDeviceDraft(settingsManager.getDeviceSettings());
    setBootstrapDraft(bootstrap);
    setCommonDraft(common);
    setDeviceDraft(device);
    setSavedBootstrap(bootstrap);
    setSavedCommon(common);
    setSavedDevice(device);
  }, [settingsManager]);

  const updateBootstrap = useCallback((updates: Partial<IBootstrapSettingsDraft>): void => {
    setBootstrapDraft((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const updateCommon = useCallback((updates: Partial<ICommonSettingsDraft>): void => {
    setCommonDraft((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const updateDevice = useCallback((updates: Partial<IDeviceSettingsDraft>): void => {
    setDeviceDraft((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const save = useCallback(async (): Promise<void> => {
    if (!settingsManager || !bootstrapDraft || !commonDraft || !deviceDraft) return;
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
    // Save bootstrap settings if changed
    if (savedBootstrap && !bootstrapDraftsEqual(bootstrapDraft, savedBootstrap)) {
      const hasLogging =
        bootstrapDraft.storeLevel !== undefined ||
        bootstrapDraft.displayLevel !== undefined ||
        bootstrapDraft.toastLevel !== undefined;
      const bootstrapResult = settingsManager.updateBootstrapSettings({
        includeBuiltIn: bootstrapDraft.includeBuiltIn,
        localStorage: {
          library: bootstrapDraft.localStorageLibrary,
          userData: bootstrapDraft.localStorageUserData
        },
        logging: hasLogging
          ? {
              storeLevel: bootstrapDraft.storeLevel,
              displayLevel: bootstrapDraft.displayLevel,
              toastLevel: bootstrapDraft.toastLevel
            }
          : undefined
      });
      if (bootstrapResult.isFailure()) {
        setSaveError(`Failed to update bootstrap settings: ${bootstrapResult.message}`);
        setIsSaving(false);
        return;
      }
    }

    const commonResult = settingsManager.updateCommonSettings({
      externalLibraries: commonDraft.externalLibraries.length > 0 ? commonDraft.externalLibraries : undefined,
      defaultStorageTargets: commonDraft.defaultStorageTargets,
      tools: { scaling: scalingUpdate, workflow: workflowUpdate }
    });

    if (commonResult.isFailure()) {
      setSaveError(`Failed to update common settings: ${commonResult.message}`);
      setIsSaving(false);
      return;
    }

    const deviceResult = settingsManager.updateDeviceSettings({
      deviceName: deviceDraft.deviceName || undefined,
      localDirectories: deviceDraft.localDirectories.length > 0 ? deviceDraft.localDirectories : undefined
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
      setSavedBootstrap(bootstrapDraft);
      setSavedCommon(commonDraft);
      setSavedDevice(deviceDraft);
    }
    setIsSaving(false);
  }, [settingsManager, bootstrapDraft, savedBootstrap, commonDraft, deviceDraft]);

  const revert = useCallback((): void => {
    setBootstrapDraft(savedBootstrap);
    setCommonDraft(savedCommon);
    setDeviceDraft(savedDevice);
    setSaveError(undefined);
  }, [savedBootstrap, savedCommon, savedDevice]);

  if (
    !settingsManager ||
    !bootstrapDraft ||
    !commonDraft ||
    !deviceDraft ||
    !savedBootstrap ||
    !savedCommon ||
    !savedDevice
  ) {
    return undefined;
  }

  const hasBootstrapChanges = !bootstrapDraftsEqual(bootstrapDraft, savedBootstrap);
  const isDirty =
    hasBootstrapChanges ||
    !draftsEqual(commonDraft, savedCommon) ||
    !deviceDraftsEqual(deviceDraft, savedDevice);

  return {
    bootstrap: bootstrapDraft,
    common: commonDraft,
    device: deviceDraft,
    isDirty,
    hasBootstrapChanges,
    isSaving,
    saveError,
    updateBootstrap,
    updateCommon,
    updateDevice,
    save,
    revert
  };
}
