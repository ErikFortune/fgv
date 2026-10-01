/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { DetailedResult, Result, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import {
  DeliveryId,
  IAcknowledgementResult,
  IBoundTaskDelivery,
  IPreparedTaskContext,
  ITaskContext,
  ITaskContextBudget,
  ITaskFailure,
  ITaskInclusionReceipt,
  Instant,
  TaskResult
} from '../types';
import {
  ICheckTaskPromptParams,
  ICheckedTaskPrompt,
  ITaskPromptCheck,
  checkTaskPrompt
} from './checkedPrompt';

/**
 * Parameters for {@link prepareTaskPrompt}: a checked prompt's parameters, with the context prepared
 * from a bound delivery rather than supplied.
 * @public
 */
export interface IPrepareTaskPromptParams extends Omit<ICheckTaskPromptParams, 'context'> {
  readonly delivery: IBoundTaskDelivery;
  /** Passed to the delivery's `prepare`. */
  readonly budget?: ITaskContextBudget;
}

/**
 * A rendered context as the host may read it: everything but the receipt.
 * @public
 */
export type TaskContextView = Omit<ITaskContext, 'receipt'>;

/**
 * A checked prompt over a delivery's issued context, and the only handle that can acknowledge it.
 *
 * @remarks
 * The issued receipt is not on this object. The host sends `prompt.system` with `prompt.cacheRequest`,
 * and after its own successful-processing boundary calls {@link ITaskPromptHandoff.acknowledge} with
 * the system text it actually sent.
 * @public
 */
export interface ITaskPromptHandoff {
  readonly prompt: ITaskPromptCheck;
  readonly context: TaskContextView;
  readonly deliveryId: DeliveryId;
  readonly expiresAt: Instant;
  /**
   * Acknowledges the issued receipt — only if `sentSystem` is exactly `prompt.system`.
   *
   * @remarks
   * If the text sent differs in any way, the delivery's manifest is abandoned before this returns,
   * so the receipt can never be acknowledged by any path, and the failure is `invalid-receipt` —
   * unless this handoff already acknowledged it, in which case the mismatch is refused and the
   * acknowledged manifest is left alone, so a replay of the exact text stays idempotent. Its
   * obligations stay owed, for a later prepare. A matching text is acknowledged by the delivery
   * exactly as `IBoundTaskDelivery.acknowledge` would, replay included.
   */
  acknowledge(sentSystem: string): Promise<TaskResult<IAcknowledgementResult>>;
  /** Abandons the delivery's manifest without acknowledging: for a host whose call did not complete. */
  abandon(): Promise<TaskResult<DeliveryId>>;
}

/**
 * Prepares a delivery's context, resolves and checks the prompt that carries it, and returns a
 * handoff that acknowledges only against the text that was sent.
 *
 * @remarks
 * If the prompt fails any check of {@link checkTaskPrompt} — the task slot dropped, overridden,
 * truncated, repeated or moved, the composition unavailable, a cache finding unhandled — the
 * delivery's manifest is abandoned before this returns, so the receipt it issued is
 * unacknowledgeable, and the failure is classified `invalid`. Nothing here acknowledges anything:
 * the delivery's obligations stay owed until the host calls the handoff's `acknowledge`.
 * @public
 */
export async function prepareTaskPrompt(
  params: IPrepareTaskPromptParams
): Promise<TaskResult<ITaskPromptHandoff>> {
  const prepared: TaskResult<IPreparedTaskContext> = await params.delivery.prepare(params.budget);
  if (prepared.isFailure()) {
    return failWithDetail(prepared.message, prepared.detail);
  }
  const { context, deliveryId, expiresAt } = prepared.value;
  const checked: Result<ICheckedTaskPrompt> = await checkTaskPrompt({ ...params, context });
  if (checked.isFailure()) {
    const abandoned: TaskResult<DeliveryId> = await params.delivery.abandon(deliveryId);
    return _refused<ITaskPromptHandoff>(checked.message, 'invalid', abandoned);
  }
  return succeedWithDetail(_handoff(params.delivery, checked.value, context, deliveryId, expiresAt));
}

function _handoff(
  delivery: IBoundTaskDelivery,
  checked: ICheckedTaskPrompt,
  context: ITaskContext,
  deliveryId: DeliveryId,
  expiresAt: Instant
): ITaskPromptHandoff {
  const { receiptFor, ...prompt } = checked;
  // Once acknowledged, the manifest's history is what makes a replay idempotent; a later mismatched
  // send is refused without abandoning it.
  let acknowledged: boolean = false;
  const view: TaskContextView = {
    text: context.text,
    entries: context.entries,
    diagnostics: context.diagnostics,
    omissions: context.omissions
  };
  return {
    prompt,
    context: view,
    deliveryId,
    expiresAt,
    acknowledge: async (sentSystem: string): Promise<TaskResult<IAcknowledgementResult>> => {
      const receipt: Result<ITaskInclusionReceipt> = receiptFor(sentSystem);
      if (receipt.isFailure()) {
        if (acknowledged) {
          return failWithDetail<IAcknowledgementResult, ITaskFailure>(
            `acknowledge ${deliveryId}: ${receipt.message}; the delivery was already acknowledged`,
            { code: 'invalid-receipt', retry: 'after-host-action' }
          );
        }
        const abandoned: TaskResult<DeliveryId> = await delivery.abandon(deliveryId);
        return _refused<IAcknowledgementResult>(
          `acknowledge ${deliveryId}: ${receipt.message}`,
          'invalid-receipt',
          abandoned
        );
      }
      const result: TaskResult<IAcknowledgementResult> = await delivery.acknowledge(receipt.value);
      acknowledged = acknowledged || result.isSuccess();
      return result;
    },
    abandon: (): Promise<TaskResult<DeliveryId>> => delivery.abandon(deliveryId)
  };
}

/** A refusal after which the delivery was abandoned — or, if that failed too, says so. */
function _refused<T>(
  message: string,
  code: 'invalid' | 'invalid-receipt',
  abandoned: DetailedResult<DeliveryId, ITaskFailure>
): TaskResult<T> {
  const outcome: string = abandoned.isSuccess()
    ? 'the delivery was abandoned, so its receipt can never be acknowledged'
    : `abandoning the delivery also failed (${abandoned.message}); its receipt expires unacknowledged`;
  return failWithDetail<T, ITaskFailure>(`${message}; ${outcome}`, { code, retry: 'after-host-action' });
}
