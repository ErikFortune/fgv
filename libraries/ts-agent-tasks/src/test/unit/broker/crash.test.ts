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
import { IBoundTaskWriter, ITaskRepository, TaskId } from '../../../index';
import { lastChildSuccess, openBroker, prepareList } from '../../helpers/brokerCrashScenarios';

/**
 * Crash after the last child succeeds but before list completion, through the real Node FileTree.
 *
 * @remarks
 * A child process opens the durable repository, runs the last child's success, and `SIGKILL`s
 * itself — either at a leaf boundary of that commit's one atomic write, or after the success has
 * returned and before any pump runs. The parent reopens and asserts that open rebuilt the
 * completion candidate from the records, and that the pump rechecks and completes it. Nothing is
 * claimed about OS crashes or power loss.
 */

type Boundary = 'before-rename' | 'after-rename' | 'returned';

const CHILD_SOURCE: string = `
'use strict';
const path = require('path');
const [libRoot, dir, boundary] = process.argv.slice(2);
const jsonBase = require.resolve('@fgv/ts-json-base', { paths: [libRoot] });
const opsModule = require(path.join(path.dirname(jsonBase), 'packlets', 'file-tree', 'fs-atomic', 'atomicFsOperations.js'));
const ops = opsModule.defaultAtomicFsOperations;
const scenarios = require(path.join(libRoot, 'test', 'helpers', 'brokerCrashScenarios.js'));
function die() { process.kill(process.pid, 'SIGKILL'); }
let armed = false;
const real = Object.assign({}, ops);
ops.rename = function (from, to) {
  if (armed && boundary === 'before-rename') { die(); }
  const result = real.rename(from, to);
  if (armed && boundary === 'after-rename') { die(); }
  return result;
};
(async () => {
  const opened = (await scenarios.openBroker(dir, 'child')).orThrow();
  armed = true;
  const outcome = await scenarios.runLastChildSuccess(opened.writer);
  armed = false;
  if (boundary === 'returned' && outcome.isSuccess()) { die(); }
  process.stderr.write('child survived: ' + (outcome.isSuccess() ? 'success' : outcome.message));
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

describe('crash before list completion (real Node FileTree)', () => {
  let scratch: string;
  let dir: string;
  let scriptPath: string;
  let opened: { repository: ITaskRepository; writer: IBoundTaskWriter } | undefined;

  beforeEach(async () => {
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgv-tasks-broker-crash-'));
    dir = path.join(scratch, 'root');
    fs.mkdirSync(dir);
    scriptPath = path.join(scratch, 'child.cjs');
    fs.writeFileSync(scriptPath, CHILD_SOURCE);
    opened = undefined;
    if (isQualified(os.tmpdir())) {
      (await prepareList(dir)).orThrow();
    }
  });

  afterEach(() => {
    opened?.repository.close();
    fs.rmSync(scratch, { recursive: true, force: true });
  });

  function kill(boundary: Boundary): void {
    const child = spawnSync(
      process.execPath,
      // `__dirname` is <package>/lib/test/unit/broker once compiled.
      [scriptPath, path.resolve(__dirname, '..', '..', '..'), dir, boundary],
      { encoding: 'utf8' }
    );
    expect(child.stderr).toBe('');
    expect(child.signal).toBe('SIGKILL');
  }

  async function reopen(): Promise<{ repository: ITaskRepository; writer: IBoundTaskWriter }> {
    opened = (await openBroker(dir, 'parent')).orThrow();
    return opened;
  }

  whenQualified.each(['returned', 'after-rename'] as const)(
    'killed %s: reopen rebuilds the candidate and the pump completes the list',
    async (boundary) => {
      kill(boundary);
      const { repository, writer } = await reopen();
      expect(await repository.listCompletionCandidates({ limit: 10 })).toSucceedWith(['l' as TaskId]);
      const report = (await writer.reconcileListCompletions({ limit: 10 })).orThrow();
      expect(report.completed.map((c) => c.taskId)).toEqual(['l']);
      // The child's success was committed exactly once: the retry of the killed call replays.
      expect(await writer.execute(lastChildSuccess)).toSucceedWith(
        expect.objectContaining({ result: { state: 'applied', appliedRevision: 2 } })
      );
    }
  );

  whenQualified(
    'killed before the rename: no success, no candidate; the retry applies once and the pump completes',
    async () => {
      kill('before-rename');
      const { repository, writer } = await reopen();
      expect(await repository.listCompletionCandidates({ limit: 10 })).toSucceedWith([]);
      expect((await writer.reconcileListCompletions({ limit: 10 })).orThrow().completed).toEqual([]);
      expect(await writer.execute(lastChildSuccess)).toSucceedWith(
        expect.objectContaining({ result: { state: 'applied', appliedRevision: 2 } })
      );
      expect((await writer.reconcileListCompletions({ limit: 10 })).orThrow().completed).toHaveLength(1);
    }
  );

  test('the crash case is actually being run on Linux', () => {
    expect(isQualified(os.tmpdir())).toBe(process.platform === 'linux');
  });
});
