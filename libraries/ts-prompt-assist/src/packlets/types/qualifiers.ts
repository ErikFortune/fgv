/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Qualifiers } from '@fgv/ts-res';
import { PromptCacheStability } from './cacheStability';
import { AxisName } from './ids';

/**
 * Description of an expected qualifier axis on an {@link IPromptDescriptor}.
 * @public
 */
export interface IExpectedQualifierAxis {
  readonly name: AxisName;
  readonly description?: string;
  readonly suggestedValues?: ReadonlyArray<string>;
  /**
   * How often this axis's value changes between requests. Defaults to `'per-request'` when
   * omitted, so an undeclared axis is treated exactly as the prompt-cache diagnostics treated
   * every axis before this field existed.
   *
   * @remarks
   * Consulted by the conditional-body check (design.md §9, D2) in
   * `analyzePromptCacheStability`: when a winning candidate matched on conditions, a stability
   * claim on the body — a slot's `cacheStability`, a call-site override, or the derived
   * `'frozen'` default of a `'template'` section — is refuted only when an axis that conditions
   * the body is declared **less stable than the claim**. Those axes are the winning candidates'
   * own, plus — once any winner is conditional — the axes of every other candidate in the record
   * (those that lost this resolve, and those that won only as a `matchAsDefault` fallback), since a
   * change in one of them can select a different body next time. A body conditioned solely on
   * `'frozen'` axes is as stable as its text; one conditioned on a `'per-conversation'` axis is at
   * most `'per-conversation'`.
   *
   * **This is not a way to make a claim survive the evidence against it.** Without it, the check
   * cannot tell "conditioned on something that never changes" from "conditioned on something that
   * changes every request", and must assume the latter. Declaring the axis supplies the missing
   * fact that makes the evidence interpretable; it does not override the evidence — the check
   * still refutes whenever a conditioning axis is declared less stable than the claim. It stops
   * refuting only the case where the claim was true all along. That is why the declaration lives
   * here, on the axis, rather than as a per-resolve map (two resolves could then disagree about the
   * same axis) or as a call-site override that D2 would honor (which would turn a verified
   * diagnostic into an unfalsifiable assertion).
   *
   * An axis declared more than once takes the least stable of its declarations, and an entry that
   * omits `stability` counts as the `'per-request'` default.
   */
  readonly stability?: PromptCacheStability;
}

/**
 * Open qualifier metadata declared by a prompt descriptor.
 * @public
 */
export interface IPromptQualifierMetadata {
  readonly required?: ReadonlyArray<AxisName>;
  readonly expected?: ReadonlyArray<IExpectedQualifierAxis>;
  readonly disallowed?: ReadonlyArray<AxisName>;
}

/**
 * Caller-supplied qualifier context at resolve time.
 * Maps qualifier axis name to value.
 *
 * @remarks
 * The context is intentionally a flat `Partial<Record<string, string>>`
 * even though `IPromptCandidateRecord.conditions` accepts the richer
 * ts-res `ConditionSetDecl` (record-with-details with `priority` /
 * `scoreAsDefault`, plus array form). The asymmetry is by design: ts-
 * res's `SimpleContextQualifierProvider` itself takes a flat
 * `Partial<Record<string, string>>`, so caller context is intentionally
 * simple; descriptor-side condition complexity flows through ts-res's
 * resolver unchanged. See design §10 + §15.5 (Option C) for the
 * rationale.
 *
 * `Partial<...>` widening (post-F14): TS-friendly with the common
 * `tone === 'formal' ? \{ tone: 'formal' \} : \{\}` shape — the empty-object
 * branch assigns cleanly without requiring an explicit annotation. The
 * underlying ts-res candidate selector treats missing keys and
 * explicit-undefined identically (per PR B's note).
 *
 * @public
 */
export type IQualifierContext = Readonly<Partial<Record<string, string>>>;

/**
 * Shape of the `qualifiers` field on {@link IPromptLibraryCreateParams}.
 * Accepts either a pre-built ts-res `IReadOnlyQualifierCollector` (when
 * the consumer already maintains a ts-res qualifier set) or a mixed
 * array of bare axis-name strings and / or `IQualifierDecl`s (the
 * library builds the collector internally via ts-res's
 * `Qualifiers.QualifierCollector.create`, which synthesizes
 * `LiteralQualifierType`s for bare strings).
 *
 * @remarks
 * Parameterized by `TQualifierNames extends string`, the qualifier-axis
 * string-literal union the consumer wants to enforce. On the decl-array
 * path, `TQualifierNames` is inferred from the array element types by
 * the static `PromptLibrary.create` factory's first overload — bare-
 * string elements contribute their string-literal type directly;
 * `IQualifierDecl` elements contribute their `name` literal. On the
 * pre-built-collector path the collector type does not expose its axis-
 * name union at the type level, so `TQualifierNames` falls back to
 * `string` unless the consumer specifies it explicitly.
 *
 * Extracted as a named type so the union has a single TSDoc-attach
 * point and consumers writing typed `IPromptLibraryCreateParams`
 * literals can reference the qualifiers shape directly.
 *
 * @public
 */
export type IPromptLibraryQualifiersInput<TQualifierNames extends string = string> =
  | Qualifiers.IReadOnlyQualifierCollector
  | ReadonlyArray<TQualifierNames | (Qualifiers.IQualifierDecl & { readonly name: TQualifierNames })>;
