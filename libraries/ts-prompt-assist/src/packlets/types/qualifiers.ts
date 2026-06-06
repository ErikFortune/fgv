/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Qualifiers } from '@fgv/ts-res';
import { AxisName } from './ids';

/**
 * Description of an expected qualifier axis on an {@link IPromptDescriptor}.
 * @public
 */
export interface IExpectedQualifierAxis {
  readonly name: AxisName;
  readonly description?: string;
  readonly suggestedValues?: ReadonlyArray<string>;
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
