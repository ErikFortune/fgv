/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { ITaskOutcome, ITaskProgress, ITaskReason, ITaskReference, IWaitingReason } from './common';

/**
 * One `fgv.tracked@1` command with its typed parameters, discriminated on `command`.
 * @remarks
 * T1 declared the command names; these are their parameter shapes. `set-description` and
 * `set-progress` clear their field when the value is omitted. A terminal command carries the payload its terminal state
 * requires: `succeed` an outcome, `fail` and `cancel` a reason.
 * @public
 */
export type TrackedCommand =
  | { readonly command: 'start' | 'resume'; readonly parameters: Readonly<Record<string, never>> }
  | { readonly command: 'wait'; readonly parameters: { readonly reason: IWaitingReason } }
  | { readonly command: 'pause'; readonly parameters: { readonly reason: ITaskReason } }
  | { readonly command: 'succeed'; readonly parameters: { readonly outcome: ITaskOutcome } }
  | {
      readonly command: 'fail' | 'cancel';
      readonly parameters: { readonly reason: ITaskReason; readonly outcome?: ITaskOutcome };
    }
  | { readonly command: 'set-title'; readonly parameters: { readonly title: string } }
  | { readonly command: 'set-description'; readonly parameters: { readonly description?: string } }
  | { readonly command: 'set-progress'; readonly parameters: { readonly progress?: ITaskProgress } }
  | {
      readonly command: 'set-attention';
      readonly parameters: { readonly attention: ReadonlyArray<ITaskReference> };
    };
