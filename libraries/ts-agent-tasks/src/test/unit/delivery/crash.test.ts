/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { FileTree } from '@fgv/ts-json-base';
import { SubscriptionId } from '../../../index';
import {
  IOpenedDelivery,
  deliveryIn,
  openDelivery,
  prepareDelivery,
  runAcknowledge,
  runSubscribe
} from '../../helpers/deliveryCrashScenarios';
import { committedIn, pendingIds } from '../../helpers/deliveryFixtures';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { inspectRepository } from '../../../packlets/storage/internals';

/**
 * Crashes inside subscription activation and receipt acknowledgement, through the real Node
 * FileTree and the default checkpoint store.
 *
 * @remarks
 * A child process opens the durable repository, runs the operation, and `SIGKILL`s itself at a
 * chosen leaf rename — before or after it — or after the operation has returned. The parent reopens
 * and asserts what open made of the state it found, and that retrying the killed request converges
 * on exactly one registration or one acknowledgement. Nothing is claimed about OS crashes or power
 * loss.
 */

type Boundary = 'before' | 'after' | 'returned';

const CHILD_SOURCE: string = `
'use strict';
const fs = require('fs');
const path = require('path');
const [libRoot, dir, scenario, boundary, nth, receiptPath] = process.argv.slice(2);
const jsonBase = require.resolve('@fgv/ts-json-base', { paths: [libRoot] });
const opsModule = require(path.join(path.dirname(jsonBase), 'packlets', 'file-tree', 'fs-atomic', 'atomicFsOperations.js'));
const ops = opsModule.defaultAtomicFsOperations;
const scenarios = require(path.join(libRoot, 'test', 'helpers', 'deliveryCrashScenarios.js'));
function die() { process.kill(process.pid, 'SIGKILL'); }
let armed = false;
let renames = 0;
const real = Object.assign({}, ops);
ops.rename = function (from, to) {
  const hit = armed && ++renames === Number(nth);
  if (hit && boundary === 'before') { die(); }
  const result = real.rename(from, to);
  if (hit && boundary === 'after') { die(); }
  return result;
};
(async () => {
  const opened = (await scenarios.openDelivery(dir, 'child')).orThrow();
  armed = true;
  const outcome = scenario === 'subscribe'
    ? await scenarios.runSubscribe(opened)
    : await scenarios.runAcknowledge(opened, JSON.parse(fs.readFileSync(receiptPath, 'utf8')));
  armed = false;
  if (boundary === 'returned' && outcome.isSuccess()) { die(); }
  process.stderr.write('child survived after ' + renames + ' renames: ' + (outcome.isSuccess() ? 'success' : outcome.message));
})();
`;

function isQualified(base: string): boolean {
  const capabilities = FileTree.DirectoryItem.create(
    base,
    new FileTree.FsFileTreeAccessors({ prefix: base, mutable: true })
  ).onSuccess((root) => root.getAtomicWriteCapabilities());
  return capabilities.isSuccess() && capabilities.value.guarantees.includes('process-crash');
}

const whenQualified: jest.It = isQualified(os.tmpdir()) ? test : test.skip;
const s: SubscriptionId = 's' as SubscriptionId;

describe('crashes in subscription activation and acknowledgement (real Node FileTree)', () => {
  let scratch: string;
  let dir: string;
  let scriptPath: string;
  let receiptPath: string;
  let opened: IOpenedDelivery | undefined;

  beforeEach(() => {
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgv-tasks-delivery-crash-'));
    dir = path.join(scratch, 'root');
    fs.mkdirSync(dir);
    scriptPath = path.join(scratch, 'child.cjs');
    receiptPath = path.join(scratch, 'receipt.json');
    fs.writeFileSync(scriptPath, CHILD_SOURCE);
    opened = undefined;
  });

  afterEach(() => {
    opened?.repository.close();
    fs.rmSync(scratch, { recursive: true, force: true });
  });

  function run(
    scenario: 'subscribe' | 'acknowledge',
    boundary: Boundary,
    nth: number
  ): ReturnType<typeof spawnSync> {
    return spawnSync(
      process.execPath,
      // `__dirname` is <package>/lib/test/unit/delivery once compiled.
      [
        scriptPath,
        path.resolve(__dirname, '..', '..', '..'),
        dir,
        scenario,
        boundary,
        String(nth),
        receiptPath
      ],
      { encoding: 'utf8' }
    );
  }

  function kill(scenario: 'subscribe' | 'acknowledge', boundary: Boundary, nth: number = 0): void {
    const child = run(scenario, boundary, nth);
    expect(child.stderr).toBe('');
    expect(child.signal).toBe('SIGKILL');
  }

  async function reopen(): Promise<IOpenedDelivery> {
    opened = (await openDelivery(dir, 'parent')).orThrow();
    return opened;
  }

  describe('subscription activation', () => {
    beforeEach(async () => {
      if (isQualified(os.tmpdir())) {
        (await prepareDelivery(dir, false)).orThrow();
      }
    });

    // The activation protocol writes three files, in order: the manifest with a pending entry
    // holding the activation claim, the consumer record, and the manifest with the live entry.
    const cases: ReadonlyArray<[Boundary, number, 'absent' | 'pending' | 'active']> = [
      ['before', 1, 'absent'],
      ['after', 1, 'pending'],
      ['before', 2, 'pending'],
      ['after', 2, 'active'],
      ['before', 3, 'active'],
      ['after', 3, 'active'],
      ['returned', 0, 'active']
    ];

    whenQualified.each(cases)(
      'killed %s rename %d: open finds the subscription %s, and the retry converges on one',
      async (boundary, nth, found) => {
        kill('subscribe', boundary, nth);
        const reopened = await reopen();
        const book = inspectRepository(reopened.repository)!.book;
        expect(reopened.repository.subscription(s).orThrow()?.id).toBe(found === 'active' ? s : undefined);
        expect(book.pending.has(s)).toBe(found === 'pending');
        // A pending entry holds its activation reservation across the crash.
        expect(committedIn(reopened.repository, 'subscriptions')).toBe(found === 'absent' ? 0 : 1);
        expect(await runSubscribe(reopened)).toSucceedAndSatisfy((subscription) => {
          expect(subscription.id).toBe(s);
        });
        expect(book.pending.size).toBe(0);
        expect(committedIn(reopened.repository, 'subscriptions')).toBe(1);
        expect(await pendingIds(deliveryIn(reopened))).toEqual(['t:1:initial']);
      }
    );

    whenQualified('the protocol writes exactly three files', () => {
      expect(run('subscribe', 'after', 4).stderr).toBe('child survived after 3 renames: success');
    });
  });

  describe('acknowledgement', () => {
    beforeEach(async () => {
      if (isQualified(os.tmpdir())) {
        const receipt: unknown = (await prepareDelivery(dir, true)).orThrow();
        fs.writeFileSync(receiptPath, JSON.stringify(receipt));
      }
    });

    function receipt(): unknown {
      return JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    }

    whenQualified(
      'killed before its one rename: nothing is acknowledged, and the retry acknowledges once',
      async () => {
        kill('acknowledge', 'before', 1);
        const reopened = await reopen();
        expect(await pendingIds(deliveryIn(reopened))).toEqual(['t:1:initial']);
        const before: number = committedIn(reopened.repository, 'acknowledgement-ids');
        expect(await runAcknowledge(reopened, receipt())).toSucceedAndSatisfy((ack) => {
          expect(ack.newlyAcknowledged).toEqual(['t:1:initial']);
          expect(ack.alreadyAcknowledged).toEqual([]);
        });
        expect(await pendingIds(deliveryIn(reopened))).toEqual([]);
        // The reservation became history: the same one slot, not a second.
        expect(committedIn(reopened.repository, 'acknowledgement-ids')).toBe(before);
      }
    );

    whenQualified.each(['after', 'returned'] as const)(
      'killed %s the rename: open finds it acknowledged, and the retry charges nothing',
      async (boundary) => {
        kill('acknowledge', boundary, 1);
        const reopened = await reopen();
        expect(await pendingIds(deliveryIn(reopened))).toEqual([]);
        const before: number = committedIn(reopened.repository, 'acknowledgement-ids');
        expect(await runAcknowledge(reopened, receipt())).toSucceedAndSatisfy((ack) => {
          expect(ack.newlyAcknowledged).toEqual([]);
          expect(ack.alreadyAcknowledged).toEqual(['t:1:initial']);
        });
        expect(committedIn(reopened.repository, 'acknowledgement-ids')).toBe(before);
      }
    );

    whenQualified('an acknowledgement writes exactly one file', () => {
      expect(run('acknowledge', 'after', 2).stderr).toBe('child survived after 1 renames: success');
    });
  });

  test('the crash cases are actually being run on Linux', () => {
    expect(isQualified(os.tmpdir())).toBe(process.platform === 'linux');
  });
});
