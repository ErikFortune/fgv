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
   * Ordered list of validator ids run by `resolveJsonOutput` after the
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
 *
 * @remarks
 * The runtime / store / loader-facing shape: `conditions` is the open
 * ts-res `ConditionSetDecl` (record-sugar, record-with-details, or
 * array form). The seed-authoring path uses
 * {@link ITypedPromptCandidateRecord} instead, which parameterizes the
 * `conditions` keys on a `TQualifierNames` literal-string union so a
 * typo'd axis name fails at compile time.
 *
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
 * Typed `conditions` shape used by the fixture-seed authoring path
 * (see {@link ITypedPromptCandidateRecord}). Preserves ts-res's
 * expressivity on the VALUE side — string sugar, the record-with-
 * details `IChildConditionDecl`, and the array form — while narrowing
 * the KEY side to a consumer-supplied `TQualifierNames` literal-string
 * union. A typo'd axis name on the record form fails at compile time
 * when `TQualifierNames` is narrowed (typically via inference from a
 * `qualifiers: ['tone'] as const` decl-array on
 * `PromptLibrary.create`).
 *
 * Defaults to `string`, so callers who don't thread a literal-string
 * union behave identically to the open
 * `ResourceJson.Json.ConditionSetDecl` from `@fgv/ts-res`.
 *
 * @public
 */
export type ITypedConditionSetDecl<TQualifierNames extends string = string> =
  | Readonly<Partial<Record<TQualifierNames, string | ResourceJson.Json.IChildConditionDecl>>>
  | ReadonlyArray<
      Omit<ResourceJson.Json.ILooseConditionDecl, 'qualifierName'> & {
        readonly qualifierName: TQualifierNames;
      }
    >;

/**
 * Seed-authoring counterpart to {@link IPromptCandidateRecord}: the
 * `conditions` shape is parameterized on a `TQualifierNames`
 * literal-string union via {@link ITypedConditionSetDecl} so typos in
 * axis names fail at compile time. Otherwise structurally identical
 * to {@link IPromptCandidateRecord}.
 *
 * Default `TQualifierNames = string` keeps existing seeds untyped (the
 * `ITypedConditionSetDecl<string>` shape is equivalent to
 * `ResourceJson.Json.ConditionSetDecl` from `@fgv/ts-res`).
 *
 * @public
 */
export interface ITypedPromptCandidateRecord<TQualifierNames extends string = string> {
  readonly conditions: ITypedConditionSetDecl<TQualifierNames>;
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

/**
 * Parameters for {@link buildSimpleDescriptor}.
 *
 * @public
 */
export interface IBuildSimpleDescriptorParams {
  readonly id: PromptId;
  readonly title: string;
  /** Optional longer-form description. */
  readonly description?: string;
  /** Default `'chat'`. */
  readonly surface?: string;
}

/**
 * Builds a fully-shaped {@link IPromptDescriptor} for the trivial chat
 * case: one body, no slots, free-text output. Cuts the boilerplate of
 * spelling out `schemaVersion`, `slots: []`, and
 * `output: \{ kind: 'free-text' \}` at every seed call site (per F2).
 *
 * @remarks
 * Intentionally limited to the free-text-output shape. The descriptor's
 * `output.kind` is load-bearing — `PromptLibrary.resolveJsonOutput` and
 * `resolveFreeTextOutput` both runtime-verify it against the call
 * path — so silently defaulting `output` for a JSON-output prompt
 * would route the consumer into the wrong dispatcher. For JSON-output
 * prompts, author the full {@link IPromptDescriptor} shape directly so
 * the `output.converterId` discriminator is explicit at the call site.
 *
 * @public
 */
export function buildSimpleDescriptor(params: IBuildSimpleDescriptorParams): IPromptDescriptor {
  const descriptor: IPromptDescriptor = {
    id: params.id,
    title: params.title,
    schemaVersion: '1',
    surface: params.surface ?? 'chat',
    slots: [],
    output: { kind: 'free-text' },
    ...(params.description !== undefined ? { description: params.description } : {})
  };
  return descriptor;
}
