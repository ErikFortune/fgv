/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { IPromptDescriptor } from './descriptor';

/**
 * Disposition of a regex screen match, per design §9 step 2.
 * @public
 */
export type SuspiciousDisposition = 'warn' | 'reject';

/**
 * Safety policy supplied to {@link PromptLibrary.create} per design §4.4.
 *
 * @remarks
 * All fields are optional at the create-param level (see
 * `IPromptLibraryCreateParams.safetyPolicy`). When the create-param is
 * omitted, the library defaults to: no global length cap (per-slot /
 * per-descriptor caps still apply), no regex screening, no anti-jailbreak
 * preface. This keeps the v0.1 surface usable without forcing consumers
 * to declare a policy that they may not need.
 *
 * @public
 */
export interface IPromptSafetyPolicy {
  /**
   * Fallback maximum length applied when neither the slot's `maxLength` nor
   * the descriptor's `safeguards.defaultMaxLength` is set. When omitted, no
   * global cap applies.
   */
  readonly defaultMaxLength?: number;
  /**
   * Patterns scanned across slot values whose source qualifies for
   * screening. Each pattern's `lastIndex` is reset before every
   * `.test()` so stateful (`g` / `y`) flag regexes don't leak state
   * across slots.
   */
  readonly suspiciousPatterns?: ReadonlyArray<RegExp>;
  /**
   * Slot-source labels (per `IPromptSlot.source`) eligible for screening.
   * Slots whose `source` is not in this set are skipped with a
   * `'screening-skipped'` info finding.
   */
  readonly screenedSources?: ReadonlyArray<string>;
  /** Default `'warn'`. */
  readonly onSuspicious?: SuspiciousDisposition;
  /**
   * Optional pre-render seam: consumer-supplied text injected before the
   * resolved body. The library ships no default content. Invoked with the
   * descriptor; consumer returns the per-surface framing.
   */
  readonly antiJailbreakPreface?: (descriptor: IPromptDescriptor) => Result<string>;
}
