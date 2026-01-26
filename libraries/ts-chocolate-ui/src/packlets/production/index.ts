/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

/**
 * Production hooks and components for chocolate confection production workflow.
 *
 * This packlet provides composable hooks for managing production sessions,
 * including shell chocolate selection, filling slot management, and procedure
 * selection. The hooks are designed to work with any data source by accepting
 * callbacks for persistence.
 *
 * @packageDocumentation
 */

// Model types
export type {
  SlotId,
  SessionId,
  PersistedSessionStatus,
  IFillingOption,
  IFillingSlotState,
  IProcedureOption,
  IShellChocolateState,
  IProcedureState,
  IProductionSessionState,
  IProductionSessionActions,
  IShellChocolateActions,
  IFillingSlotActions,
  IProcedureActions
} from './model';

// Hooks
export {
  useProductionSession,
  type IPersistedSessionData,
  type IMoldData,
  type IUseProductionSessionOptions,
  type IUseProductionSessionResult
} from './useProductionSession';

export {
  useShellChocolateSelection,
  type IShellChocolateSpec,
  type IUseShellChocolateSelectionOptions,
  type IUseShellChocolateSelectionResult
} from './useShellChocolateSelection';

export {
  useFillingSlotManagement,
  type IFillingSlotData,
  type IUseFillingSlotManagementOptions,
  type IUseFillingSlotManagementResult
} from './useFillingSlotManagement';

export {
  useProcedureSelection,
  type IProcedureSpec,
  type IUseProcedureSelectionOptions,
  type IUseProcedureSelectionResult
} from './useProcedureSelection';

// Components
export { ShellChocolateSelector, type IShellChocolateSelectorProps } from './ShellChocolateSelector';
export {
  FillingSlotManager,
  type IFillingSlotManagerProps,
  type IFillingOptionDisplayProps
} from './FillingSlotManager';
export { ProcedureSelector, type IProcedureSelectorProps } from './ProcedureSelector';
