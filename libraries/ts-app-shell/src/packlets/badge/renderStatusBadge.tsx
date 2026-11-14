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

import React from 'react';

type BadgeTone = 'info' | 'warning' | 'danger';

interface IBadgeLike {
  readonly kind: 'dot' | 'count';
  readonly tone?: BadgeTone;
  readonly count?: number;
  readonly ariaLabel?: string;
}

const BADGE_COUNT_BASE_CLASSES: string =
  'ml-1.5 min-w-4 px-1.5 py-0.5 text-[0.6875rem] inline-flex shrink-0 items-center justify-center rounded-full font-medium leading-none';

const BADGE_DOT_BASE_CLASSES: string = 'ml-1.5 h-2 w-2 inline-block shrink-0 rounded-full';

const BADGE_COUNT_TONE_CLASSES: Record<BadgeTone, string> = {
  info: 'bg-status-info-bg text-status-info-text',
  warning: 'bg-status-warning-bg text-status-warning-text',
  danger: 'bg-status-error-bg text-status-error-text'
};

const BADGE_DOT_TONE_CLASSES: Record<BadgeTone, string> = {
  info: 'bg-status-info-icon',
  warning: 'bg-status-warning-icon',
  danger: 'bg-status-error-icon'
};

export function renderStatusBadge(badge: IBadgeLike): React.ReactElement {
  const tone = badge.tone ?? 'info';
  const ariaLabel = badge.ariaLabel;

  if (badge.kind === 'dot') {
    return (
      <span className={`${BADGE_DOT_BASE_CLASSES} ${BADGE_DOT_TONE_CLASSES[tone]}`} aria-label={ariaLabel} />
    );
  }

  return (
    <span className={`${BADGE_COUNT_BASE_CLASSES} ${BADGE_COUNT_TONE_CLASSES[tone]}`} aria-label={ariaLabel}>
      {badge.count ?? 0}
    </span>
  );
}
