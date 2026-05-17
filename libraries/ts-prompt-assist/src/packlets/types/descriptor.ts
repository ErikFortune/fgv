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
 *
 * @remarks
 * The design's expectation is one descriptor per prompt id — same shape
 * across every scope where the id appears, with per-scope variation
 * living in {@link IStoredPromptRecord.candidates} (qualifier-conditional
 * bodies) and in scope-level {@link IScopeSlotBindingsRecord} files.
 *
 * The library enforces this only on `describe()`: when called, it walks
 * every scope carrying the id and rejects mismatches via RFC 8785
 * canonical-JSON comparison. `resolve()` does NOT cross-check — it
 * walks the chain and uses the first record it finds. Authors who
 * publish divergent descriptors across scopes therefore get a clean
 * failure from `describe()` but a silent first-match win from
 * `resolve()`.
 *
 * @public
 */
export interface IPromptDescriptor {
  /** Branded prompt id. Must equal the filename stem in disk-backed stores. */
  readonly id: PromptId;
  /** Human-readable title surfaced to authoring tools. */
  readonly title: string;
  /** Optional longer-form description for editor surfaces. */
  readonly description?: string;
  /** Schema version. Only `'1'` is supported in v0.1. */
  readonly schemaVersion: '1';
  /**
   * Open string identifying the rendering target (e.g. `'chat'`,
   * `'completion'`, `'embed'`). v0.1 ships no per-consumer descriptor-
   * Converter hook; the built-in `descriptorConverter` accepts any
   * non-empty string. Consumers needing stricter narrowing can
   * post-validate after `describe()` / per-record `store.get()`.
   */
  readonly surface: string;
  /** Optional ts-res qualifier-axis hints (required / expected / disallowed). */
  readonly qualifiers?: IPromptQualifierMetadata;
  /** Slot declarations. Each slot is referenced by `\{\{\{name\}\}\}` in candidate bodies. */
  readonly slots: ReadonlyArray<IPromptSlot>;
  /** Output contract — `'free-text'` or `'json'` (with a registered Converter). */
  readonly output: PromptOutputContract;
  /** Optional join policy for partial-candidate fragments. */
  readonly join?: IPromptJoinPolicy;
  /** Optional per-descriptor safeguard overrides. */
  readonly safeguards?: IPromptSafeguardOverrides;
  /** Optional example pairs grouped by qualifier-condition scope. */
  readonly examples?: ReadonlyArray<IPromptExampleSet>;
  /**
   * Ordered list of validator ids run by `resolveAndValidateOutput` after the
   * `output.converterId` converts the raw response. Validators must be
   * registered in the library's {@link IPromptRegistry} and their `appliesTo`
   * must include the response kind produced by `output.converterId`'s
   * Converter. The store / descriptor file loader does NOT have access to
   * the registry, so this contract is enforced at `PromptLibrary.describe()`
   * / `resolve()` time (and cached per descriptor). Only valid when
   * `output.kind === 'json'`; the descriptor file loader does reject
   * `outputValidations` on `'free-text'` descriptors at load time.
   */
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
