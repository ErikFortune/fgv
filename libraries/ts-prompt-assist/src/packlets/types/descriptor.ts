/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { PromptId, ScopeKey, SlotName, ValidatorId } from './ids';
import { IPromptQualifierMetadata } from './qualifiers';
import { IPromptSlot } from './slot';
import { PromptOutputContract } from './output';
import { IPromptExampleSet } from './examples';
import { SlotBinding } from './bindings';
import { ResourceJson } from '@fgv/ts-res';

/**
 * Join policy controlling how partial-candidate bodies are concatenated.
 * @public
 */
export interface IPromptJoinPolicy {
  /** String inserted between fragments. Default `'\n\n'`. */
  readonly separator?: string;
  /**
   * Fragment order. `'specificity-ascending'` (default) puts least-specific
   * first.
   */
  readonly order?: 'specificity-ascending' | 'specificity-descending';
  /** Strip trailing whitespace per fragment before joining. Default `true`. */
  readonly trimTrailingWhitespace?: boolean;
}

/**
 * Optional safeguard overrides declared by a descriptor.
 * @public
 */
export interface IPromptSafeguardOverrides {
  readonly defaultMaxLength?: number;
  readonly skipInjectionScreening?: boolean;
}

/**
 * Locked prompt descriptor shape (design §3.9).
 * @public
 */
export interface IPromptDescriptor {
  readonly id: PromptId;
  readonly title: string;
  readonly description?: string;
  readonly schemaVersion: '1';
  /** Open string narrowed by the consumer's descriptor Converter. */
  readonly surface: string;
  readonly qualifiers?: IPromptQualifierMetadata;
  readonly slots: ReadonlyArray<IPromptSlot>;
  readonly output: PromptOutputContract;
  readonly join?: IPromptJoinPolicy;
  readonly safeguards?: IPromptSafeguardOverrides;
  readonly examples?: ReadonlyArray<IPromptExampleSet>;
  readonly outputValidations?: ReadonlyArray<ValidatorId>;
}

/**
 * Scope-level binding record loaded from `_bindings.yaml`.
 * @public
 */
export interface IScopeSlotBindingsRecord {
  readonly scope: ScopeKey;
  readonly bindings: ReadonlyMap<SlotName, SlotBinding>;
}

/**
 * A stored candidate within an {@link IStoredPromptRecord}.
 * @public
 */
export interface IPromptCandidateRecord {
  /**
   * Full ts-res `ConditionSetDecl` (record-sugar, record-with-details, or
   * array form). Empty `\{\}` represents the unconditional base candidate.
   */
  readonly conditions: ResourceJson.Json.ConditionSetDecl;
  /**
   * Aligned with ts-res's `resolveComposedResourceValue` semantic
   * (design §10.2): `isPartial: true` marks a more-specific override
   * that layers ONTO the full base; `isPartial: false` (or omitted)
   * marks the full base body. The walk consumes ts-res's priority-
   * descending order, collects partials until the first non-partial
   * (full → stop), then reverses for the join so the base appears
   * first and the most-specific override appears last.
   */
  readonly isPartial?: boolean;
  readonly body: string;
}

/**
 * Stored prompt record returned by the store.
 * @public
 */
export interface IStoredPromptRecord {
  readonly scope: ScopeKey;
  readonly id: PromptId;
  readonly descriptor: IPromptDescriptor;
  readonly candidates: ReadonlyArray<IPromptCandidateRecord>;
}
