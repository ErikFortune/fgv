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
 * @public
 */
export type IQualifierContext = Readonly<Record<string, string>>;
