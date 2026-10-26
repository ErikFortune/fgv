/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * `prepareTaskPrompt` over a real broker delivery and a real `PromptLibrary`: the receipt a delivery
 * issues is acknowledgeable only through the handoff, and only against the body that was checked.
 */

import '@fgv/ts-utils-jest';
import { PromptLibrary } from '@fgv/ts-prompt-assist';
import { failWithDetail } from '@fgv/ts-utils';
import {
  DeliveryId,
  IBoundTaskDelivery,
  IPreparedTaskContext,
  ITaskContextBudget,
  ITaskFailure,
  ITaskInclusionReceipt,
  ITaskPromptHandoff,
  TaskResult,
  prepareTaskPrompt
} from '../../../index';
import { command, track } from '../../helpers/brokerFixtures';
import {
  IDeliveryHarness,
  deliveryHarness,
  deliveryOf,
  pendingIds,
  subscribed
} from '../../helpers/deliveryFixtures';
import { library, recordWithBody, request, standardRecord } from '../../helpers/promptFixtures';

/** A real delivery, recording the receipt `prepare` issued, and optionally failing `prepare` or `abandon`. */
class RecordingDelivery implements IBoundTaskDelivery {
  public issued: ITaskInclusionReceipt | undefined;
  public failPrepare: boolean = false;
  public failAbandon: boolean = false;
  public throwAcknowledge: boolean = false;
  public readonly subscriptionId: IBoundTaskDelivery['subscriptionId'];
  private readonly _inner: IBoundTaskDelivery;

  public constructor(inner: IBoundTaskDelivery) {
    this._inner = inner;
    this.subscriptionId = inner.subscriptionId;
  }

  public pending(
    ...args: Parameters<IBoundTaskDelivery['pending']>
  ): ReturnType<IBoundTaskDelivery['pending']> {
    return this._inner.pending(...args);
  }

  public async prepare(budget?: ITaskContextBudget): Promise<TaskResult<IPreparedTaskContext>> {
    if (this.failPrepare) {
      return failWithDetail<IPreparedTaskContext, ITaskFailure>('prepare: subscription is closed', {
        code: 'conflict',
        retry: 'safe'
      });
    }
    const prepared = await this._inner.prepare(budget);
    if (prepared.isSuccess()) {
      this.issued = prepared.value.context.receipt;
    }
    return prepared;
  }

  public acknowledge(receipt: unknown): ReturnType<IBoundTaskDelivery['acknowledge']> {
    if (this.throwAcknowledge) {
      throw new Error('delivery offline');
    }
    return this._inner.acknowledge(receipt);
  }

  public async abandon(deliveryId: DeliveryId): Promise<TaskResult<DeliveryId>> {
    if (this.failAbandon) {
      return failWithDetail<DeliveryId, ITaskFailure>('abandon: storage unavailable', {
        code: 'storage-unavailable',
        retry: 'safe'
      });
    }
    return this._inner.abandon(deliveryId);
  }
}

let h: IDeliveryHarness;
let delivery: RecordingDelivery;
let good: PromptLibrary;

beforeEach(async () => {
  h = await deliveryHarness();
  await subscribed(h, 'sub');
  delivery = new RecordingDelivery(deliveryOf(h, 'sub'));
  await track(h.writer, 't1');
  await command(h, h.writer, 't1', 'set-progress', { progress: { completed: 2, total: 10 } });
  good = await library([standardRecord()]);
});

async function handoff(lib: PromptLibrary = good): Promise<TaskResult<ITaskPromptHandoff>> {
  return prepareTaskPrompt({ library: lib, request, delivery });
}

describe('a checked handoff', () => {
  test('carries the prepared context in its trailing slot, and no receipt anywhere', async () => {
    expect(await handoff()).toSucceedAndSatisfy((ready: ITaskPromptHandoff) => {
      expect(ready.prompt.system.endsWith(ready.context.text)).toBe(true);
      expect(ready.prompt.system.slice(ready.prompt.taskSlot.start)).toBe(ready.context.text);
      expect(Object.keys(ready).sort()).toEqual([
        'abandon',
        'acknowledge',
        'context',
        'deliveryId',
        'expiresAt',
        'prompt'
      ]);
      expect('receipt' in ready.context).toBe(false);
      expect('receiptFor' in ready.prompt).toBe(false);
      expect(ready.prompt.system).not.toContain(ready.deliveryId);
      expect(JSON.stringify(ready)).not.toContain('"included"');
      expect(delivery.issued?.deliveryId).toBe(ready.deliveryId);
    });
  });

  test('preparing and resolving acknowledge nothing: every obligation is still owed', async () => {
    const owed = await pendingIds(delivery);
    expect(owed.length).toBeGreaterThan(0);
    (await handoff()).orThrow();
    expect(await pendingIds(delivery)).toEqual(owed);
  });

  test('acknowledging with the exact text sent discharges exactly what was included; a replay is idempotent', async () => {
    const owed = await pendingIds(delivery);
    const ready = (await handoff()).orThrow();
    // An update arriving while the model ran stays owed after the acknowledgement.
    await command(h, h.writer, 't1', 'set-progress', { progress: { completed: 3, total: 10 } });
    expect(await ready.acknowledge(ready.prompt.system)).toSucceedAndSatisfy((ack) => {
      expect([...ack.newlyAcknowledged].sort()).toEqual([...owed].sort());
    });
    const remaining = await pendingIds(delivery);
    expect(remaining).toHaveLength(1);
    expect(owed).not.toContain(remaining[0]);
    expect(await ready.acknowledge(ready.prompt.system)).toSucceedAndSatisfy((ack) => {
      expect(ack.newlyAcknowledged).toEqual([]);
      expect([...ack.alreadyAcknowledged].sort()).toEqual([...owed].sort());
    });
  });

  test('after an acknowledgement, a mismatched send is refused without killing the idempotent replay', async () => {
    const ready = (await handoff()).orThrow();
    expect(await ready.acknowledge(ready.prompt.system)).toSucceed();
    expect(await ready.acknowledge('something else')).toFailWith(/already acknowledged/);
    expect(await ready.acknowledge(ready.prompt.system)).toSucceedAndSatisfy((ack) => {
      expect(ack.newlyAcknowledged).toEqual([]);
      expect(ack.alreadyAcknowledged.length).toBeGreaterThan(0);
    });
  });

  test('the receipt it issued is acknowledgeable directly too — the control for the refusals below', async () => {
    (await handoff()).orThrow();
    expect(await delivery.acknowledge(delivery.issued)).toSucceed();
  });
});

describe('a changed or dropped task slot prevents acknowledging the original receipt', () => {
  test('text sent that differs from the checked body is refused, and the receipt is dead from then on', async () => {
    const owed = await pendingIds(delivery);
    const ready = (await handoff()).orThrow();
    const sent: string = ready.prompt.system.replace(/"completed":2/, '"completed":9');
    expect(sent).not.toBe(ready.prompt.system);
    expect(await ready.acknowledge(sent)).toFailWith(/not the checked body.*the delivery was abandoned/);
    expect(await ready.acknowledge(sent)).toFail();
    // Neither the exact text now, nor the receipt itself through the delivery, acknowledges anything.
    expect(await ready.acknowledge(ready.prompt.system)).toFailWith(/refused or abandoned earlier/);
    expect(await delivery.acknowledge(delivery.issued)).toFailWith(/not a receipt this delivery issued/);
    expect(await pendingIds(delivery)).toEqual(owed);
  });

  test('a refusal is classified invalid-receipt', async () => {
    const ready = (await handoff()).orThrow();
    const refused = await ready.acknowledge('');
    expect(refused.isFailure() && refused.detail?.code).toBe('invalid-receipt');
  });

  test('a prompt that drops the task slot fails the prepare, and the issued receipt is abandoned', async () => {
    const owed = await pendingIds(delivery);
    const dropped = await library([recordWithBody('You coordinate.\n\n{{{persona}}}')]);
    const refused = await handoff(dropped);
    expect(refused).toFailWith(
      /0 times.*the delivery was abandoned, so its receipt can never be acknowledged/
    );
    expect(refused.isFailure() && refused.detail?.code).toBe('invalid');
    expect(delivery.issued).toBeDefined();
    expect(await delivery.acknowledge(delivery.issued)).toFailWith(/not a receipt this delivery issued/);
    expect(await pendingIds(delivery)).toEqual(owed);
  });

  test('a host abandoning the handoff leaves its receipt unacknowledgeable', async () => {
    const ready = (await handoff()).orThrow();
    expect(await ready.abandon()).toSucceedWith(ready.deliveryId);
    expect(await delivery.acknowledge(delivery.issued)).toFailWith(/not a receipt this delivery issued/);
    expect(await ready.acknowledge(ready.prompt.system)).toFailWith(/refused or abandoned earlier/);
  });
});

describe('when the delivery itself fails', () => {
  test('a failed prepare is passed through with its classification', async () => {
    delivery.failPrepare = true;
    const refused = await handoff();
    expect(refused).toFailWith(/subscription is closed/);
    expect(refused.isFailure() && refused.detail?.code).toBe('conflict');
  });

  test('if abandoning after a failed check also fails, the failure says so', async () => {
    delivery.failAbandon = true;
    const dropped = await library([recordWithBody('You coordinate.\n\n{{{persona}}}')]);
    expect(await handoff(dropped)).toFailWith(
      /abandoning the delivery also failed \(abandon: storage unavailable\)/
    );
  });

  test('if abandoning after a mismatched send also fails, the handoff still refuses every later call', async () => {
    const ready = (await handoff()).orThrow();
    delivery.failAbandon = true;
    expect(await ready.acknowledge('other')).toFailWith(/abandoning the delivery also failed/);
    delivery.failAbandon = false;
    // The manifest is still live in storage, but the handoff never releases the receipt again.
    expect(await ready.acknowledge(ready.prompt.system)).toFailWith(/refused or abandoned earlier/);
  });

  test('if an explicit abandon fails, the handoff still refuses every later call', async () => {
    const ready = (await handoff()).orThrow();
    delivery.failAbandon = true;
    expect(await ready.abandon()).toFailWith(/storage unavailable/);
    expect(await ready.acknowledge(ready.prompt.system)).toFailWith(/refused or abandoned earlier/);
  });
});

describe('calls on one handoff run one at a time', () => {
  test('an exact acknowledgement and a mismatched send in flight together: the acknowledgement wins and replay survives', async () => {
    const ready = (await handoff()).orThrow();
    const [exact, mismatched] = await Promise.all([
      ready.acknowledge(ready.prompt.system),
      ready.acknowledge('something else')
    ]);
    expect(exact).toSucceed();
    expect(mismatched).toFailWith(/already acknowledged/);
    expect(await ready.acknowledge(ready.prompt.system)).toSucceedAndSatisfy((ack) => {
      expect(ack.newlyAcknowledged).toEqual([]);
    });
  });

  test('a mismatched send issued first refuses an exact acknowledgement issued with it', async () => {
    const owed = await pendingIds(delivery);
    const ready = (await handoff()).orThrow();
    const [mismatched, exact] = await Promise.all([
      ready.acknowledge('something else'),
      ready.acknowledge(ready.prompt.system)
    ]);
    expect(mismatched).toFailWith(/the delivery was abandoned/);
    expect(exact).toFailWith(/refused or abandoned earlier/);
    expect(await pendingIds(delivery)).toEqual(owed);
  });

  test('a call whose delivery throws does not wedge the calls after it', async () => {
    const ready = (await handoff()).orThrow();
    delivery.throwAcknowledge = true;
    await expect(ready.acknowledge(ready.prompt.system)).rejects.toThrow('delivery offline');
    delivery.throwAcknowledge = false;
    expect(await ready.acknowledge(ready.prompt.system)).toSucceed();
  });
});
