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
 * Copilot review (PR #362, deferred to B-1b): this context is flat-
 * string-valued, but `IPromptCandidateRecord.conditions` accepts the
 * full ts-res `ConditionSetDecl` (record-with-details with `priority` /
 * `scoreAsDefault`, and array form). The B-1 candidate selector projects
 * condition decls down to their `.value` and compares against this flat
 * context, so priority and scoreAsDefault on the descriptor side are
 * effectively ignored. B-1b's full ts-res integration (per design §15.5
 * Option C) replaces the candidate selector with ts-res's resolver,
 * which observes priority and scoreAsDefault directly — at which point
 * this asymmetry disappears.
 *
 * @public
 */
export type IQualifierContext = Readonly<Record<string, string>>;
