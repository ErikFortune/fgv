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
import {
  FileTreeTaskRepository,
  ITaskCapacityDimensionStatus,
  ITaskCommitRecord,
  ITaskRepository,
  TaskId,
  defaultTaskCapacityProfile
} from '../../../index';
import { CrashScenario, prepareScenario, raisedProfile, runScenario } from '../../helpers/crashScenarios';
import { nodeRootAt, params } from '../../helpers/storageFixtures';

/**
 * The T3 crash acceptance matrix, through the real Node FileTree path.
 *
 * @remarks
 * A child process opens a real durable repository on a real directory, runs one writer call,
 * and `SIGKILL`s itself at a chosen leaf boundary of the Nth atomic write that call makes —
 * the kill is self-inflicted and synchronous, so it lands at that instruction, not after a
 * sleep. The parent then reopens the root through the real Node path and asserts what design
 * §8.4 says must be true at that interruption point. No mocked store appears anywhere here.
 *
 * The predictions were written into `state.md` before the first run (C1–C12).
 *
 * **What this does not establish.** Nothing about OS crashes or power loss: the kernel keeps
 * running, so flushed and unflushed data are indistinguishable to every assertion here (F2's
 * result says the same of its own suite). The claim is `'process-crash'` and nothing stronger.
 */

type Boundary =
  | 'before-open'
  | 'mid-write'
  | 'before-rename'
  | 'after-rename'
  | 'after-directory-flush'
  | 'none';

/**
 * The child. Plain CommonJS written at run time, requiring the package's compiled output and
 * the compiled scenario helper, so parent and child build identical requests.
 */
const CHILD_SOURCE: string = `
'use strict';
const path = require('path');
const fs = require('fs');
const [libRoot, dir, scenario, writeIndex, boundary, eventsPath] = process.argv.slice(2);
const k = Number(writeIndex);
const jsonBase = require.resolve('@fgv/ts-json-base', { paths: [libRoot] });
const opsModule = require(path.join(path.dirname(jsonBase), 'packlets', 'file-tree', 'fs-atomic', 'atomicFsOperations.js'));
const ops = opsModule.defaultAtomicFsOperations;
const scenarios = require(path.join(libRoot, 'test', 'helpers', 'crashScenarios.js'));

const events = [];
function log(event) {
  events.push(event);
  fs.writeFileSync(eventsPath, JSON.stringify(events));
}
function die() {
  process.kill(process.pid, 'SIGKILL');
}

let writes = 0;
let flushes = 0;
let armed = false;
const real = Object.assign({}, ops);
ops.openExclusive = function (p, m) {
  if (!armed) { return real.openExclusive(p, m); }
  writes += 1;
  flushes = 0;
  if (writes === k && boundary === 'before-open') { die(); }
  log('open#' + writes);
  return real.openExclusive(p, m);
};
ops.write = function (fd, bytes, offset) {
  if (armed && writes === k && boundary === 'mid-write') {
    real.write(fd, bytes.subarray(0, Math.min(bytes.length, offset + 16)), offset);
    die();
  }
  return real.write(fd, bytes, offset);
};
ops.fsync = function (fd) {
  const result = real.fsync(fd);
  if (!armed) { return result; }
  flushes += 1;
  log((flushes === 1 ? 'fsync-file#' : 'fsync-dir#') + writes);
  if (writes === k && flushes === 2 && boundary === 'after-directory-flush') { die(); }
  return result;
};
ops.rename = function (from, to) {
  if (armed && writes === k && boundary === 'before-rename') { die(); }
  const result = real.rename(from, to);
  if (!armed) { return result; }
  log('rename#' + writes + ':' + path.basename(to));
  if (writes === k && boundary === 'after-rename') { die(); }
  return result;
};

(async () => {
  const repository = (await scenarios.openDurable(dir, 'child')).orThrow();
  armed = true;
  const outcome = await scenarios.runScenario(repository, scenario);
  armed = false;
  log(outcome.isSuccess() ? 'returned:success' : 'returned:failure:' + outcome.message);
  repository.close();
})();
`;

interface IChildRun {
  readonly signal: NodeJS.Signals | undefined;
  readonly status: number | undefined;
  readonly events: ReadonlyArray<string>;
  readonly stderr: string;
}

function isQualified(base: string): boolean {
  const capabilities = FileTree.DirectoryItem.create(
    base,
    new FileTree.FsFileTreeAccessors({ prefix: base, mutable: true })
  ).onSuccess((root) => root.getAtomicWriteCapabilities());
  return capabilities.isSuccess() && capabilities.value.guarantees.includes('process-crash');
}

/**
 * The filesystems the matrix runs on: the temporary directory, and tmpfs when the machine has
 * it — two filesystems, as F2 qualified, so the matrix is not evidence about exactly one.
 */
function bases(): ReadonlyArray<{ base: string; label: string }> {
  const found: string[] = [os.tmpdir()];
  try {
    if (fs.statSync('/dev/shm').isDirectory() && os.tmpdir() !== '/dev/shm') {
      fs.accessSync('/dev/shm', fs.constants.W_OK);
      found.push('/dev/shm');
    }
  } catch {
    // Not present or not writable: the matrix runs on the temporary directory only.
  }
  return found.map((base) => ({
    base,
    label: `${base} (${isQualified(base) ? 'qualified' : 'unqualified'})`
  }));
}

describe('the crash matrix is actually being run', () => {
  test('on Linux the temporary directory qualifies, so the matrix below is not silently skipped', () => {
    // Mirrors F2's guard: moving CI onto an unqualified filesystem must turn this red rather
    // than degrade every crash test into a skip.
    expect(isQualified(os.tmpdir())).toBe(process.platform === 'linux');
  });
});

describe.each(bases())('process-crash acceptance matrix (real Node FileTree) on $label', ({ base }) => {
  const whenQualified: jest.It = isQualified(base) ? test : test.skip;
  let scratch: string;
  let dir: string;
  let scriptPath: string;
  let eventsPath: string;

  beforeEach(() => {
    scratch = fs.mkdtempSync(path.join(base, 'fgv-tasks-crash-'));
    dir = path.join(scratch, 'root');
    fs.mkdirSync(dir);
    scriptPath = path.join(scratch, 'child.cjs');
    eventsPath = path.join(scratch, 'events.json');
    fs.writeFileSync(scriptPath, CHILD_SOURCE);
  });

  afterEach(() => {
    fs.rmSync(scratch, { recursive: true, force: true });
  });

  async function prepare(scenario: CrashScenario): Promise<void> {
    (await prepareScenario(dir, scenario)).orThrow();
  }

  function runChild(scenario: CrashScenario, writeIndex: number, boundary: Boundary): IChildRun {
    const child = spawnSync(
      process.execPath,
      [
        scriptPath,
        // `__dirname` is <package>/lib/test/unit/storage once compiled.
        path.resolve(__dirname, '..', '..', '..'),
        dir,
        scenario,
        String(writeIndex),
        boundary,
        eventsPath
      ],
      { encoding: 'utf8' }
    );
    const events: ReadonlyArray<string> = fs.existsSync(eventsPath)
      ? (JSON.parse(fs.readFileSync(eventsPath, 'utf8')) as string[])
      : [];
    return {
      signal: child.signal ?? undefined,
      status: child.status ?? undefined,
      events,
      stderr: child.stderr
    };
  }

  function killed(run: IChildRun): void {
    // The child really died, and never reported a result.
    expect(run.stderr).toBe('');
    expect(run.signal).toBe('SIGKILL');
    expect(run.events.some((e) => e.startsWith('returned'))).toBe(false);
  }

  async function reopen(): Promise<ITaskRepository> {
    const opened = (
      await FileTreeTaskRepository.open(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).orThrow();
    if (opened.state !== 'ready') {
      throw new Error(JSON.stringify(opened.recovery.report.issues));
    }
    return opened.repository;
  }

  function row(repository: ITaskRepository, dimension: string): ITaskCapacityDimensionStatus {
    return repository
      .capacityStatus()
      .orThrow()
      .dimensions.find((d) => d.dimension === dimension)!;
  }

  function reservedTemporaries(): ReadonlyArray<string> {
    return fs.readdirSync(dir).filter((n) => !/^(repository|task-[^.]+)\.json$/.test(n));
  }

  // ---------------------------------------------------------------------------------------------
  // No durable success precedes the boundary
  // ---------------------------------------------------------------------------------------------

  whenQualified(
    'the harness works, and success is returned only after the last directory flush',
    async () => {
      await prepare('register');
      const run = runChild('register', 99, 'none');
      expect(run.stderr).toBe('');
      expect(run.status).toBe(0);
      // THE ACCEPTANCE CRITERION: pending entry, record, live entry — each renamed then its
      // directory flushed — and only then a returned success. Nothing is acknowledged early.
      expect(run.events).toEqual([
        'open#1',
        'fsync-file#1',
        'rename#1:repository.json',
        'fsync-dir#1',
        'open#2',
        'fsync-file#2',
        'rename#2:task-t1.json',
        'fsync-dir#2',
        'open#3',
        'fsync-file#3',
        'rename#3:repository.json',
        'fsync-dir#3',
        'returned:success'
      ]);
    }
  );

  whenQualified(
    'a mutation, too, returns only after its record is renamed and the directory flushed',
    async () => {
      await prepare('start');
      const run = runChild('start', 99, 'none');
      expect(run.status).toBe(0);
      expect(run.events).toEqual([
        'open#1',
        'fsync-file#1',
        'rename#1:task-t1.json',
        'fsync-dir#1',
        'returned:success'
      ]);
    }
  );

  // ---------------------------------------------------------------------------------------------
  // Registration (C1–C6)
  // ---------------------------------------------------------------------------------------------

  const notAccepted: ReadonlyArray<[number, Boundary, string]> = [
    [1, 'before-open', 'C1'],
    [1, 'mid-write', 'C1'],
    [1, 'before-rename', 'C1']
  ];
  whenQualified.each(notAccepted)(
    'registration killed at write %i, %s (%s): nothing accepted, nothing reserved, the retry registers once',
    async (writeIndex, boundary) => {
      await prepare('register');
      killed(runChild('register', writeIndex, boundary));
      const repository = await reopen();
      // Any interrupted working file is reclaimed at exclusive reopen (C12).
      expect(repository.report.removedTemporaries).toHaveLength(boundary === 'before-open' ? 0 : 1);
      expect(reservedTemporaries()).toEqual([]);
      expect(repository.report.pendingRegistrations).toEqual([]);
      expect(await repository.read('t1' as TaskId)).toSucceedWith(undefined);
      expect(row(repository, 'retained-tasks').used).toBe(0);
      expect(row(repository, 'updates').reserved).toBe(0);

      expect(await runScenario(repository, 'register')).toSucceed();
      expect(row(repository, 'retained-tasks').used).toBe(1);
      expect(row(repository, 'updates').reserved).toBe(7);
    }
  );

  const pendingOnly: ReadonlyArray<[number, Boundary, string]> = [
    [1, 'after-rename', 'C2'],
    [1, 'after-directory-flush', 'C2'],
    [2, 'before-open', 'C3'],
    [2, 'mid-write', 'C3'],
    [2, 'before-rename', 'C3']
  ];
  whenQualified.each(pendingOnly)(
    'registration killed at write %i, %s (%s): pending, reservations held; the retry resumes with the same claims',
    async (writeIndex, boundary) => {
      await prepare('register');
      killed(runChild('register', writeIndex, boundary));
      const repository = await reopen();
      expect(repository.report.pendingRegistrations).toEqual([{ taskId: 't1', operationId: 'op-create-t1' }]);
      expect(reservedTemporaries()).toEqual([]);
      // Reservations survived the crash exactly as acceptance would have.
      expect(row(repository, 'retained-tasks').used).toBe(1);
      expect(row(repository, 'updates').reserved).toBe(7);
      // A pending registration is not an accepted task — and no temp was promoted.
      expect(await repository.read('t1' as TaskId)).toSucceedWith(undefined);
      expect(fs.existsSync(path.join(dir, 'task-t1.json'))).toBe(false);
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'repository.json'), 'utf8'));
      const claimIds: ReadonlyArray<string> = manifest.tasks[0].capacityClaims.map(
        (c: { claimId: string }) => c.claimId
      );

      // Lost-response retry: neither a double charge nor an early release.
      expect(await runScenario(repository, 'register')).toSucceedAndSatisfy((record) => {
        expect((record as ITaskCommitRecord).capacityClaims.map((c) => c.claimId)).toEqual(claimIds);
      });
      expect(row(repository, 'retained-tasks').used).toBe(1);
      expect(row(repository, 'updates').reserved).toBe(7);
    }
  );

  const recordLanded: ReadonlyArray<[number, Boundary, string]> = [
    [2, 'after-rename', 'C4'],
    [2, 'after-directory-flush', 'C4'],
    [3, 'before-open', 'C5'],
    [3, 'mid-write', 'C5'],
    [3, 'before-rename', 'C5']
  ];
  whenQualified.each(recordLanded)(
    'registration killed at write %i, %s (%s): reopen completes it, counting the claim once',
    async (writeIndex, boundary) => {
      await prepare('register');
      killed(runChild('register', writeIndex, boundary));
      const repository = await reopen();
      expect(repository.report.completedRegistrations).toEqual(['t1']);
      expect(reservedTemporaries()).toEqual([]);
      expect(await repository.read('t1' as TaskId)).toSucceedAndSatisfy((read) => {
        expect(read?.state).toBe('resolved');
      });
      expect(row(repository, 'retained-tasks').used).toBe(1);
      expect(row(repository, 'updates').reserved).toBe(7);
      // The retry is a replay.
      const committed = (await repository.readCommit('t1' as TaskId)).orThrow();
      expect(await runScenario(repository, 'register')).toSucceedWith(committed);
      expect(row(repository, 'updates').reserved).toBe(7);
    }
  );

  whenQualified.each([
    [3, 'after-rename' as Boundary],
    [3, 'after-directory-flush' as Boundary]
  ])(
    'registration killed at write %i, %s (C6): live; the retry replays without a second charge',
    async (writeIndex, boundary) => {
      await prepare('register');
      killed(runChild('register', writeIndex, boundary));
      const repository = await reopen();
      expect(repository.report.completedRegistrations).toEqual([]);
      expect(repository.report.issues).toEqual([]);
      const committed = (await repository.readCommit('t1' as TaskId)).orThrow();
      expect(await runScenario(repository, 'register')).toSucceedWith(committed);
      expect(row(repository, 'retained-tasks').used).toBe(1);
      expect(row(repository, 'updates').reserved).toBe(7);
    }
  );

  // ---------------------------------------------------------------------------------------------
  // One-task replacement (C7–C9)
  // ---------------------------------------------------------------------------------------------

  const beforeVisible: ReadonlyArray<Boundary> = ['before-open', 'mid-write', 'before-rename'];
  const afterVisible: ReadonlyArray<Boundary> = ['after-rename', 'after-directory-flush'];

  whenQualified.each(beforeVisible)(
    'mutation killed at %s (C7): the old record whole; the retry applies once',
    async (boundary) => {
      await prepare('start');
      const before = fs.readFileSync(path.join(dir, 'task-t1.json'), 'utf8');
      killed(runChild('start', 1, boundary));
      expect(fs.readFileSync(path.join(dir, 'task-t1.json'), 'utf8')).toBe(before);
      const repository = await reopen();
      expect(reservedTemporaries()).toEqual([]);
      expect(await runScenario(repository, 'start')).toSucceedAndSatisfy((record) => {
        expect((record as ITaskCommitRecord).recordRevision).toBe(2);
      });
    }
  );

  whenQualified.each(afterVisible)(
    'mutation killed at %s (C8): the new record whole — state, update, operation; the retry is a replay',
    async (boundary) => {
      await prepare('start');
      killed(runChild('start', 1, boundary));
      const repository = await reopen();
      const committed = (await repository.readCommit('t1' as TaskId)).orThrow()!;
      expect(committed.recordRevision).toBe(2);
      expect(committed.operations.map((o) => o.operationId)).toEqual(['op-create-t1', 'op-start']);
      expect(committed.recordType === 'resolved' && committed.updates.map((u) => u.id)).toEqual([
        't1:1:0',
        't1:2:0'
      ]);
      expect(await runScenario(repository, 'start')).toSucceedWith(committed);
      expect((await repository.readCommit('t1' as TaskId)).orThrow()!.recordRevision).toBe(2);
    }
  );

  whenQualified.each([...beforeVisible, ...afterVisible])(
    'terminal commit killed at %s (C9): state, obligations and the spent reservation are never split',
    async (boundary) => {
      await prepare('finish');
      killed(runChild('finish', 1, boundary));
      const repository = await reopen();
      const record = (await repository.readCommit('t1' as TaskId)).orThrow()!;
      if (record.recordType !== 'resolved') {
        throw new Error('expected resolved');
      }
      const landed: boolean = afterVisible.includes(boundary);
      expect(record.task.envelope.lifecycle.status).toBe(landed ? 'succeeded' : 'pending');
      expect(record.updates.map((u) => u.category)).toEqual(
        landed ? ['lifecycle', 'lifecycle', 'result'] : ['lifecycle']
      );
      expect(record.operations.some((o) => o.operationId === 'op-finish')).toBe(landed);
      // The closeout claim's remaining charge moved in the same record as the state it paid for.
      const charge = record.capacityClaims[0].charges.find((c) => c.dimension === 'updates')!.amount;
      expect(charge).toBe(landed ? 5 : 7);
      // Either way, used + reserved is exactly what it was at acceptance.
      expect(row(repository, 'updates').used + row(repository, 'updates').reserved).toBe(8);
    }
  );

  // ---------------------------------------------------------------------------------------------
  // First resolution (C10) and the policy record (C11)
  // ---------------------------------------------------------------------------------------------

  whenQualified.each([...beforeVisible, ...afterVisible])(
    'first resolution killed at %s (C10): unresolved whole, or resolved whole with identity and obligations',
    async (boundary) => {
      await prepare('resolve');
      killed(runChild('resolve', 1, boundary));
      const repository = await reopen();
      const record = (await repository.readCommit('u1' as TaskId)).orThrow()!;
      if (afterVisible.includes(boundary)) {
        expect(record.recordType).toBe('resolved');
        expect(record.recordType === 'resolved' && record.updates.map((u) => u.category)).toEqual([
          'lifecycle',
          'observation'
        ]);
        expect(record.capacityClaims.map((c) => c.disposition)).toEqual(['reserved', 'consumed']);
        // The retry of the same observation is a replay.
        expect(await runScenario(repository, 'resolve')).toSucceedWith(record);
      } else {
        expect(record.recordType).toBe('unresolved');
        expect(record.capacityClaims.map((c) => c.disposition)).toEqual(['reserved', 'reserved']);
        expect(await runScenario(repository, 'resolve')).toSucceed();
      }
    }
  );

  whenQualified.each([...beforeVisible, ...afterVisible])(
    'a limit increase killed at %s (C11): the old policy or the new one, whole',
    async (boundary) => {
      await prepare('raise');
      killed(runChild('raise', 1, boundary));
      const repository = await reopen();
      expect(repository.profile).toEqual(
        afterVisible.includes(boundary) ? raisedProfile : defaultTaskCapacityProfile
      );
    }
  );
});
