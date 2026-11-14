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
import { IResolvedTaskCommitRecord, TaskId } from '../../../index';
import {
  IOpenedDelivery,
  deliveryIn,
  openDelivery,
  prepareRetention,
  retentionIds,
  runArchive,
  runCleanup,
  runDispose
} from '../../helpers/deliveryCrashScenarios';
import { committedIn, pendingIds } from '../../helpers/deliveryFixtures';

/**
 * Crashes inside disposal, cleanup and archive, through the real Node FileTree and the default
 * checkpoint store: a child process opens the durable repository, runs the operation and `SIGKILL`s
 * itself before or after its one rename, or after the operation returned. The parent reopens and
 * asserts that every obligation is either still owed or durably discharged — never neither — and that
 * the retry converges. Nothing is claimed about OS crashes or power loss.
 */

type Boundary = 'before' | 'after' | 'returned';
type Scenario = 'dispose' | 'cleanup' | 'archive';

const CHILD_SOURCE: string = `
'use strict';
const path = require('path');
const [libRoot, dir, scenario, boundary, nth] = process.argv.slice(2);
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
  const run = { dispose: scenarios.runDispose, cleanup: scenarios.runCleanup, archive: scenarios.runArchive }[scenario];
  const outcome = await run(opened);
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

describe('crashes in disposal, cleanup and archive (real Node FileTree)', () => {
  let scratch: string;
  let dir: string;
  let scriptPath: string;
  let opened: IOpenedDelivery | undefined;

  beforeEach(() => {
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgv-tasks-retention-crash-'));
    dir = path.join(scratch, 'root');
    fs.mkdirSync(dir);
    scriptPath = path.join(scratch, 'child.cjs');
    fs.writeFileSync(scriptPath, CHILD_SOURCE);
    opened = undefined;
  });

  afterEach(() => {
    opened?.repository.close();
    fs.rmSync(scratch, { recursive: true, force: true });
  });

  function run(scenario: Scenario, boundary: Boundary, nth: number): ReturnType<typeof spawnSync> {
    return spawnSync(
      process.execPath,
      // `__dirname` is <package>/lib/test/unit/delivery once compiled.
      [scriptPath, path.resolve(__dirname, '..', '..', '..'), dir, scenario, boundary, String(nth)],
      { encoding: 'utf8' }
    );
  }

  function kill(scenario: Scenario, boundary: Boundary): void {
    const child = run(scenario, boundary, boundary === 'returned' ? 0 : 1);
    expect(child.stderr).toBe('');
    expect(child.signal).toBe('SIGKILL');
  }

  async function reopen(): Promise<IOpenedDelivery> {
    opened = (await openDelivery(dir, 'parent')).orThrow();
    return opened;
  }

  async function taskRecord(o: IOpenedDelivery): Promise<IResolvedTaskCommitRecord> {
    return (await o.repository.readCommit('t' as TaskId)).orThrow() as IResolvedTaskCommitRecord;
  }

  describe('disposal', () => {
    beforeEach(async () => {
      if (isQualified(os.tmpdir())) {
        (await prepareRetention(dir, false)).orThrow();
      }
    });

    whenQualified(
      'killed before its one rename: everything is still owed, and the retry disposes once',
      async () => {
        kill('dispose', 'before');
        const o = await reopen();
        expect(await pendingIds(deliveryIn(o))).toEqual(retentionIds);
        const ids = committedIn(o.repository, 'acknowledgement-ids');
        expect(await runDispose(o)).toSucceedAndSatisfy((r) =>
          expect(r).toEqual(expect.objectContaining({ newlyDisposed: retentionIds }))
        );
        expect(committedIn(o.repository, 'acknowledgement-ids')).toBe(ids);
      }
    );

    whenQualified.each(['after', 'returned'] as const)(
      'killed %s the rename: open finds it disposed, and the retry writes nothing',
      async (boundary) => {
        kill('dispose', boundary);
        const o = await reopen();
        expect(await pendingIds(deliveryIn(o))).toEqual([]);
        expect(await runDispose(o)).toSucceedAndSatisfy((r) =>
          expect(r).toEqual(expect.objectContaining({ newlyDisposed: [], alreadyDischarged: retentionIds }))
        );
      }
    );

    whenQualified('a disposal writes exactly one file', () => {
      expect(run('dispose', 'after', 2).stderr).toBe('child survived after 1 renames: success');
    });
  });

  describe('cleanup after an acknowledgement', () => {
    beforeEach(async () => {
      if (isQualified(os.tmpdir())) {
        (await prepareRetention(dir, true)).orThrow();
      }
    });

    // The acknowledgement committed before the crash: its evidence is durable, cleanup lags.
    whenQualified(
      'killed before the prune rename: the payloads are retained, discharged, and still prunable',
      async () => {
        kill('cleanup', 'before');
        const o = await reopen();
        expect((await taskRecord(o)).updates.map((u) => u.id)).toEqual(['t:2:0', 't:2:3']);
        expect(await pendingIds(deliveryIn(o))).toEqual([]);
        expect(await o.repository.prunableTasks({ limit: 10 })).toSucceedWith(['t' as TaskId]);
        expect(await runCleanup(o)).toSucceedWith({ pruned: ['t' as TaskId], unchanged: [] });
        expect((await taskRecord(o)).updates).toEqual([]);
      }
    );

    whenQualified.each(['after', 'returned'] as const)(
      'killed %s the prune rename: open finds it pruned, and the retry changes nothing',
      async (boundary) => {
        kill('cleanup', boundary);
        const o = await reopen();
        expect((await taskRecord(o)).updates).toEqual([]);
        expect(await runCleanup(o)).toSucceedWith({ pruned: [], unchanged: [] });
      }
    );
  });

  describe('archive after an acknowledgement', () => {
    beforeEach(async () => {
      if (isQualified(os.tmpdir())) {
        (await prepareRetention(dir, true)).orThrow();
      }
    });

    whenQualified('killed before its rename: not archived, and the retry archives', async () => {
      kill('archive', 'before');
      const o = await reopen();
      expect((await taskRecord(o)).archived).toBe(false);
      const slots = committedIn(o.repository, 'non-archived-tasks');
      expect(await runArchive(o)).toSucceed();
      expect((await taskRecord(o)).archived).toBe(true);
      expect(committedIn(o.repository, 'non-archived-tasks')).toBe(slots - 1);
    });

    whenQualified.each(['after', 'returned'] as const)(
      'killed %s the rename: archived with no payloads, and the retry replays',
      async (boundary) => {
        kill('archive', boundary);
        const o = await reopen();
        const tombstone = await taskRecord(o);
        expect(tombstone.archived).toBe(true);
        expect(tombstone.updates).toEqual([]);
        expect(await runArchive(o)).toSucceed();
      }
    );
  });
});
