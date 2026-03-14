import { useCallback, useEffect, useState } from 'react';

import { AiAssist } from '@fgv/ts-extras';
import { Settings } from '@fgv/ts-chocolate';

import { applyStorageTargetsFromWorkspace, useReactiveWorkspace, useWorkspace } from '../workspace';

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
  readonly cloudStorageEnabled: boolean;
  readonly cloudStorageBaseUrl: string;
  readonly cloudStorageNamespace: string;
  readonly cloudStorageLibrary: boolean;
  readonly cloudStorageUserData: boolean;
  readonly cloudStorageSourceName: string;
  readonly storeLevel: Settings.ILogSettings['storeLevel'];
  readonly displayLevel: Settings.ILogSettings['displayLevel'];
  readonly toastLevel: Settings.ILogSettings['toastLevel'];
  readonly deviceName: string;
}

/**
 * Mutable draft of preferences settings fields exposed in the UI.
 * @public
 */
export interface IPreferencesDraft {
  readonly defaultTargets: Settings.IDefaultCollectionTargets | undefined;
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
  readonly aiAssist: AiAssist.IAiAssistSettings;
}

/**
 * Return value of useSettingsDraft.
 * @public
 */
export interface ISettingsDraft {
  readonly bootstrap: IBootstrapSettingsDraft;
  readonly preferences: IPreferencesDraft;
  readonly isDirty: boolean;
  readonly hasBootstrapChanges: boolean;
  readonly isSaving: boolean;
  readonly saveError: string | undefined;
  readonly updateBootstrap: (updates: Partial<IBootstrapSettingsDraft>) => void;
  readonly updatePreferences: (updates: Partial<IPreferencesDraft>) => void;
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
    cloudStorageEnabled: settings?.cloudStorage?.enabled ?? false,
    cloudStorageBaseUrl: settings?.cloudStorage?.baseUrl ?? '',
    cloudStorageNamespace: settings?.cloudStorage?.namespace ?? '',
    cloudStorageLibrary: settings?.cloudStorage?.library ?? true,
    cloudStorageUserData: settings?.cloudStorage?.userData ?? true,
    cloudStorageSourceName: settings?.cloudStorage?.sourceName ?? '',
    storeLevel: settings?.logging?.storeLevel,
    displayLevel: settings?.logging?.displayLevel,
    toastLevel: settings?.logging?.toastLevel,
    deviceName: settings?.deviceName ?? ''
  };
}

function bootstrapDraftsEqual(a: IBootstrapSettingsDraft, b: IBootstrapSettingsDraft): boolean {
  return (
    a.includeBuiltIn === b.includeBuiltIn &&
    a.localStorageLibrary === b.localStorageLibrary &&
    a.localStorageUserData === b.localStorageUserData &&
    a.cloudStorageEnabled === b.cloudStorageEnabled &&
    a.cloudStorageBaseUrl === b.cloudStorageBaseUrl &&
    a.cloudStorageNamespace === b.cloudStorageNamespace &&
    a.cloudStorageLibrary === b.cloudStorageLibrary &&
    a.cloudStorageUserData === b.cloudStorageUserData &&
    a.cloudStorageSourceName === b.cloudStorageSourceName &&
    a.storeLevel === b.storeLevel &&
    a.displayLevel === b.displayLevel &&
    a.toastLevel === b.toastLevel &&
    a.deviceName === b.deviceName
  );
}

function buildPreferencesDraft(
  prefs: Settings.IPreferencesSettings,
  bootstrap: Settings.IBootstrapSettings | undefined
): IPreferencesDraft {
  return {
    defaultTargets: prefs.defaultTargets,
    externalLibraries: bootstrap?.externalLibraries ?? [],
    defaultStorageTargets: prefs.defaultStorageTargets,
    scaling: {
      weightUnit: prefs.tools?.scaling?.weightUnit ?? 'g',
      measurementUnit: prefs.tools?.scaling?.measurementUnit ?? 'g',
      batchMultiplier: prefs.tools?.scaling?.batchMultiplier ?? 1.0,
      bufferPercentage: prefs.tools?.scaling?.bufferPercentage ?? 10
    },
    workflow: {
      autoSaveIntervalSeconds: prefs.tools?.workflow?.autoSaveIntervalSeconds ?? 60,
      confirmAbandon: prefs.tools?.workflow?.confirmAbandon ?? true,
      showPercentages: prefs.tools?.workflow?.showPercentages ?? true,
      autoExpandIngredients: prefs.tools?.workflow?.autoExpandIngredients ?? false,
      adaptedRecipeNameSuffix: prefs.tools?.workflow?.adaptedRecipeNameSuffix ?? ' (adapted)'
    },
    aiAssist: prefs.tools?.aiAssist ?? AiAssist.DEFAULT_AI_ASSIST
  };
}

function preferencesDraftsEqual(a: IPreferencesDraft, b: IPreferencesDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
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
  const [preferencesDraft, setPreferencesDraft] = useState<IPreferencesDraft | undefined>(undefined);
  const [savedBootstrap, setSavedBootstrap] = useState<IBootstrapSettingsDraft | undefined>(undefined);
  const [savedPreferences, setSavedPreferences] = useState<IPreferencesDraft | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!settingsManager) return;
    const prefs = settingsManager.getPreferencesSettings();
    const bootstrapSettings = settingsManager.getBootstrapSettings();
    const bootstrap = buildBootstrapDraft(bootstrapSettings);
    const preferences = buildPreferencesDraft(prefs, bootstrapSettings);
    setBootstrapDraft(bootstrap);
    setPreferencesDraft(preferences);
    setSavedBootstrap(bootstrap);
    setSavedPreferences(preferences);
  }, [settingsManager]);

  const updateBootstrap = useCallback((updates: Partial<IBootstrapSettingsDraft>): void => {
    setBootstrapDraft((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const updatePreferences = useCallback((updates: Partial<IPreferencesDraft>): void => {
    setPreferencesDraft((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const reactiveWorkspace = useReactiveWorkspace();

  const save = useCallback(async (): Promise<void> => {
    if (!settingsManager || !bootstrapDraft || !preferencesDraft) return;
    setIsSaving(true);
    setSaveError(undefined);

    const scalingUpdate: Settings.IScalingDefaults = {
      weightUnit: preferencesDraft.scaling.weightUnit as Settings.IScalingDefaults['weightUnit'],
      measurementUnit: preferencesDraft.scaling
        .measurementUnit as Settings.IScalingDefaults['measurementUnit'],
      batchMultiplier: preferencesDraft.scaling.batchMultiplier,
      bufferPercentage: preferencesDraft.scaling.bufferPercentage
    };
    const workflowUpdate: Settings.IWorkflowPreferences = {
      autoSaveIntervalSeconds: preferencesDraft.workflow.autoSaveIntervalSeconds,
      confirmAbandon: preferencesDraft.workflow.confirmAbandon,
      showPercentages: preferencesDraft.workflow.showPercentages,
      autoExpandIngredients: preferencesDraft.workflow.autoExpandIngredients,
      adaptedRecipeNameSuffix: preferencesDraft.workflow.adaptedRecipeNameSuffix
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
        cloudStorage: bootstrapDraft.cloudStorageEnabled
          ? {
              enabled: true,
              baseUrl: bootstrapDraft.cloudStorageBaseUrl,
              namespace:
                bootstrapDraft.cloudStorageNamespace.trim().length > 0
                  ? bootstrapDraft.cloudStorageNamespace
                  : undefined,
              library: bootstrapDraft.cloudStorageLibrary,
              userData: bootstrapDraft.cloudStorageUserData,
              sourceName:
                bootstrapDraft.cloudStorageSourceName.trim().length > 0
                  ? bootstrapDraft.cloudStorageSourceName
                  : undefined
            }
          : undefined,
        logging: hasLogging
          ? {
              storeLevel: bootstrapDraft.storeLevel,
              displayLevel: bootstrapDraft.displayLevel,
              toastLevel: bootstrapDraft.toastLevel
            }
          : undefined,
        deviceName: bootstrapDraft.deviceName || undefined
      });
      if (bootstrapResult.isFailure()) {
        setSaveError(`Failed to update bootstrap settings: ${bootstrapResult.message}`);
        setIsSaving(false);
        return;
      }
    }

    // Update preferences settings
    const prefsResult = settingsManager.updatePreferencesSettings({
      defaultStorageTargets: preferencesDraft.defaultStorageTargets,
      tools: { scaling: scalingUpdate, workflow: workflowUpdate, aiAssist: preferencesDraft.aiAssist }
    });
    if (prefsResult.isFailure()) {
      setSaveError(`Failed to update preferences settings: ${prefsResult.message}`);
      setIsSaving(false);
      return;
    }

    // Update external libraries in bootstrap settings
    const extLibResult = settingsManager.updateBootstrapSettings({
      externalLibraries:
        preferencesDraft.externalLibraries.length > 0 ? preferencesDraft.externalLibraries : undefined
    });
    if (extLibResult.isFailure()) {
      setSaveError(`Failed to update bootstrap settings: ${extLibResult.message}`);
      setIsSaving(false);
      return;
    }

    const saveResult = await settingsManager.save();
    if (saveResult.isFailure()) {
      setSaveError(`Failed to save settings: ${saveResult.message}`);
    } else {
      setSavedBootstrap(bootstrapDraft);
      setSavedPreferences(preferencesDraft);

      applyStorageTargetsFromWorkspace({
        localStorageRootDir: reactiveWorkspace.localStorageRootDir,
        persistentTrees: reactiveWorkspace.persistentTrees,
        additionalRootDirs: reactiveWorkspace.additionalRootDirs,
        targets: preferencesDraft.defaultStorageTargets,
        entities: workspace.data.entities,
        userEntities: workspace.userData.entities
      });
    }
    setIsSaving(false);
  }, [settingsManager, bootstrapDraft, savedBootstrap, preferencesDraft, reactiveWorkspace, workspace]);

  const revert = useCallback((): void => {
    setBootstrapDraft(savedBootstrap);
    setPreferencesDraft(savedPreferences);
    setSaveError(undefined);
  }, [savedBootstrap, savedPreferences]);

  if (!settingsManager || !bootstrapDraft || !preferencesDraft || !savedBootstrap || !savedPreferences) {
    return undefined;
  }

  const hasBootstrapChanges = !bootstrapDraftsEqual(bootstrapDraft, savedBootstrap);
  const isDirty = hasBootstrapChanges || !preferencesDraftsEqual(preferencesDraft, savedPreferences);

  return {
    bootstrap: bootstrapDraft,
    preferences: preferencesDraft,
    isDirty,
    hasBootstrapChanges,
    isSaving,
    saveError,
    updateBootstrap,
    updatePreferences,
    save,
    revert
  };
}
