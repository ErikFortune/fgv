/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

/**
 * Production tools namespace.
 *
 * Provides hooks and components for the production workflow, including
 * session management, recipe editing, and commit handling.
 *
 * @example
 * ```tsx
 * import { ProductionTools } from '@fgv/ts-chocolate-ui';
 *
 * // Use production session hook
 * const { state, actions } = ProductionTools.useProductionSession({
 *   session: currentSession,
 *   getMold: (id) => runtime?.getRuntimeMold(id).orDefault(undefined),
 *   onUpdateProduction: updateConfectionProduction,
 *   onUpdateLabel: updateSessionLabel
 * });
 *
 * // Use shell chocolate selection
 * const { state: shellState, actions: shellActions } = ProductionTools.useShellChocolateSelection({
 *   baseSpec: baseVersion?.shellChocolate,
 *   draftSpec: draftVersion?.shellChocolate,
 *   onUpdateDraft: updateShellDraft,
 *   onResetDraft: resetDraft
 * });
 *
 * // Use filling slot management
 * const { slots, actions: slotActions, hasChanges } = ProductionTools.useFillingSlotManagement({
 *   baseSlots: baseVersion?.fillings,
 *   draftSlots: draftVersion?.fillings,
 *   onUpdateDraft: updateFillingsDraft,
 *   onResetDraft: resetDraft
 * });
 * ```
 *
 * @public
 */

// Re-export all production packlet exports
export {
  // Model types
  type SlotId,
  type SessionId,
  type PersistedSessionStatus,
  type IFillingOption,
  type IFillingSlotState,
  type IProcedureOption,
  type IShellChocolateState,
  type IProcedureState,
  type IMoldOption,
  type IMoldState,
  type IMoldActions,
  type IProductionSessionState,
  type IProductionSessionActions,
  type IShellChocolateActions,
  type IFillingSlotActions,
  type IProcedureActions,
  // Hooks
  useProductionSession,
  type IPersistedSessionData,
  type IMoldData,
  type IUseProductionSessionOptions,
  type IUseProductionSessionResult,
  useShellChocolateSelection,
  type IShellChocolateSpec,
  type IUseShellChocolateSelectionOptions,
  type IUseShellChocolateSelectionResult,
  useFillingSlotManagement,
  type IFillingSlotData,
  type IUseFillingSlotManagementOptions,
  type IUseFillingSlotManagementResult,
  useProcedureSelection,
  type IProcedureSpec,
  type IUseProcedureSelectionOptions,
  type IUseProcedureSelectionResult,
  useMoldSelection,
  type IMoldSpec,
  type IUseMoldSelectionOptions,
  type IUseMoldSelectionResult,
  // Components
  ShellChocolateSelector,
  type IShellChocolateSelectorProps,
  FillingSlotManager,
  type IFillingSlotManagerProps,
  type IFillingOptionDisplayProps,
  ProcedureSelector,
  type IProcedureSelectorProps,
  ItemPickerDialog,
  type IItemPickerDialogProps,
  type IPickerItem
} from '../packlets/production';
