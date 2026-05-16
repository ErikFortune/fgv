/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import type { IPromptDescriptor, IPromptSafetyPolicy, ISafeguardFinding, SlotName } from '../types';

const DEFAULT_MAX_LENGTH: number = 4096;
const DEFAULT_SCREENED_SOURCES: ReadonlyArray<string> = ['user'];

/**
 * Runs safety safeguards on resolved slot values.
 *
 * Checks in order:
 * 1. Max-length cap: slot.maxLength → policy.defaultMaxLength → 4096.
 * 2. Suspicious-pattern screening for slots whose source is in `policy.screenedSources`.
 *
 * Returns `Failure` immediately on a `'reject'` finding. Non-fatal findings are accumulated.
 * @public
 */
export function runSafeguards(
  slotValues: ReadonlyMap<SlotName, string>,
  descriptor: IPromptDescriptor,
  policy: IPromptSafetyPolicy | undefined
): Result<ReadonlyArray<ISafeguardFinding>> {
  const defaultMaxLength = policy?.defaultMaxLength ?? DEFAULT_MAX_LENGTH;
  const suspiciousPatterns = policy?.suspiciousPatterns ?? [];
  const screenedSources = policy?.screenedSources ?? DEFAULT_SCREENED_SOURCES;
  const onSuspicious = policy?.onSuspicious ?? 'warn';

  const slotsByName = new Map(descriptor.slots.map((s) => [s.name, s]));
  const findings: ISafeguardFinding[] = [];

  for (const [name, value] of slotValues) {
    const slot = slotsByName.get(name);
    const maxLength = slot?.maxLength ?? defaultMaxLength;

    if (value.length > maxLength) {
      return fail(`slot '${name}' value length ${value.length} exceeds maximum ${maxLength}`);
    }

    const source = slot?.source;
    const shouldScreen = source !== undefined && screenedSources.includes(source);
    if (!shouldScreen && source !== undefined) {
      findings.push({
        slot: name,
        kind: 'screening-skipped',
        disposition: 'info',
        detail: `slot '${name}' source '${source}' is not in screenedSources`
      });
    }

    if (shouldScreen && suspiciousPatterns.length > 0) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          const disposition = onSuspicious === 'reject' ? 'reject' : 'warn';
          const detail = `slot '${name}' matched suspicious pattern /${pattern.source}/`;
          if (disposition === 'reject') {
            return fail(detail);
          }
          findings.push({ slot: name, kind: 'suspicious-pattern', disposition, detail });
          break;
        }
      }
    }
  }

  return succeed(findings);
}
