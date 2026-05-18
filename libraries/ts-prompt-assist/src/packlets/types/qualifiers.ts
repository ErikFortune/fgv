/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

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
