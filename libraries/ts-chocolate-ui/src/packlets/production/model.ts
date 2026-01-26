/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

/**
 * Production packlet type definitions
 * @packageDocumentation
 */

/**
 * Branded type alias for slot IDs
 * @public
 */
export type SlotId = string & { readonly __brand: 'SlotId' };

/**
 * Branded type alias for session IDs
 * @public
 */
export type SessionId = string & { readonly __brand: 'SessionId' };

/**
 * Status values for persisted sessions
 * @public
 */
export type PersistedSessionStatus = 'active' | 'committing' | 'committed' | 'abandoned';

/**
 * Filling option type - can be a recipe or an ingredient
 * @public
 */
export interface IFillingOption {
  /** Option type - 'recipe' for filling recipes, 'ingredient' for raw ingredients */
  type: 'recipe' | 'ingredient';
  /** The filling or ingredient ID */
  id: string;
  /** Optional notes for this option */
  notes?: string;
}

/**
 * State for a single filling slot
 * @public
 */
export interface IFillingSlotState {
  /** Unique slot identifier */
  slotId: SlotId;
  /** User-editable slot name */
  name: string;
  /** Available filling options for this slot */
  options: readonly IFillingOption[];
  /** Currently preferred filling ID */
  preferredId: string | undefined;
  /** Base preferred ID (before any draft changes) */
  basePreferredId: string | undefined;
  /** Whether this slot has changes from the base version */
  hasChanges: boolean;
}

/**
 * Procedure option with optional notes
 * @public
 */
export interface IProcedureOption {
  /** Procedure ID */
  id: string;
  /** Optional notes for this procedure */
  notes?: string;
}

/**
 * State for shell chocolate selection
 * @public
 */
export interface IShellChocolateState {
  /** Available chocolate choices (ingredient IDs) */
  availableChoices: readonly string[];
  /** Base preferred chocolate ID (before draft changes) */
  basePreferredId: string | undefined;
  /** Effective preferred chocolate ID (with draft changes applied) */
  effectivePreferredId: string | undefined;
  /** Whether selection differs from base */
  hasChanges: boolean;
}

/**
 * State for procedure selection
 * @public
 */
export interface IProcedureState {
  /** Available procedure options */
  options: readonly IProcedureOption[];
  /** Base preferred procedure ID */
  basePreferredId: string | undefined;
  /** Effective preferred procedure ID */
  effectivePreferredId: string | undefined;
  /** Whether selection differs from base */
  hasChanges: boolean;
}

/**
 * Mold option with optional notes
 * @public
 */
export interface IMoldOption {
  /** Mold ID */
  id: string;
  /** Optional notes for this mold */
  notes?: string;
}

/**
 * State for mold selection
 * @public
 */
export interface IMoldState {
  /** Available mold options */
  options: readonly IMoldOption[];
  /** Base preferred mold ID (before draft changes) */
  basePreferredId: string | undefined;
  /** Effective preferred mold ID (with draft changes applied) */
  effectivePreferredId: string | undefined;
  /** Whether selection differs from base */
  hasChanges: boolean;
}

/**
 * Actions for mold selection
 * @public
 */
export interface IMoldActions {
  /** Select a mold from available options */
  select: (id: string) => void;
  /** Add a new mold option */
  addOption: (option: IMoldOption) => void;
  /** Remove a mold option */
  removeOption: (id: string) => void;
  /** Reset to base selection */
  reset: () => void;
}

/**
 * Production session state for a confection
 * @public
 */
export interface IProductionSessionState {
  /** Session ID */
  sessionId: SessionId | undefined;
  /** Confection ID being produced */
  confectionId: string | undefined;
  /** Version spec being produced */
  versionSpec: string | undefined;
  /** Selected mold ID */
  moldId: string | undefined;
  /** Number of frames/batches */
  frames: number;
  /** Calculated yield count (cavities × frames) */
  scaledYieldCount: number | undefined;
  /** Current session status */
  status: PersistedSessionStatus;
  /** Whether any draft changes exist */
  hasDraftChanges: boolean;
  /** Session label */
  label: string | undefined;
}

/**
 * Actions for production session management
 * @public
 */
export interface IProductionSessionActions {
  /** Select a mold for production */
  selectMold: (moldId: string | undefined) => void;
  /** Set the number of frames/batches */
  setFrames: (frames: number) => void;
  /** Rename the session */
  rename: (label: string) => void;
}

/**
 * Actions for shell chocolate selection
 * @public
 */
export interface IShellChocolateActions {
  /** Select a shell chocolate from available choices */
  select: (id: string) => void;
  /** Add a new chocolate to the available choices */
  addChoice: (id: string) => void;
  /** Remove a chocolate from the available choices */
  removeChoice: (id: string) => void;
  /** Reset to base selection */
  reset: () => void;
}

/**
 * Actions for filling slot management
 * @public
 */
export interface IFillingSlotActions {
  /** Add a new filling slot with the given name */
  addSlot: (name: string) => SlotId;
  /** Remove a filling slot */
  removeSlot: (slotId: SlotId) => void;
  /** Rename a filling slot */
  renameSlot: (slotId: SlotId, name: string) => void;
  /** Select a filling for a slot */
  selectFilling: (slotId: SlotId, fillingId: string) => void;
  /** Add a filling option to a slot */
  addFillingOption: (slotId: SlotId, option: IFillingOption) => void;
  /** Remove a filling option from a slot */
  removeFillingOption: (slotId: SlotId, fillingId: string) => void;
  /** Reset all slots to base state */
  reset: () => void;
}

/**
 * Actions for procedure selection
 * @public
 */
export interface IProcedureActions {
  /** Select a procedure from available options */
  select: (id: string) => void;
  /** Add a new procedure option */
  addOption: (option: IProcedureOption) => void;
  /** Remove a procedure option */
  removeOption: (id: string) => void;
  /** Reset to base selection */
  reset: () => void;
}
