/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import fs from 'fs';
import path from 'path';
import { FileTreeTaskRepository, ITaskRepository, TaskId } from '../../../index';
import { nodeRoot, nodeRootAt, params, registration } from '../../helpers/storageFixtures';

/**
 * Durable mode on the real Node filesystem, outside the crash matrix: strict UTF-8, the
 * in-process owner guard by path, and session mode over the same store.
 */
describe('durable mode on the Node filesystem', () => {
  let dir: string;

  beforeEach(() => {
    dir = nodeRoot().dir;
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  async function initialize(): Promise<ITaskRepository> {
    return (
      await FileTreeTaskRepository.initialize(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).orThrow();
  }

  test('one directory cannot be open as a session and a durable repository at once, either way round', async () => {
    const durable = await initialize();
    expect(await FileTreeTaskRepository.open(params(nodeRootAt(dir), 'session'))).toFailWithDetail(
      /already open in this process/i,
      expect.objectContaining({ code: 'conflict' })
    );
    durable.close();
    const session = (await FileTreeTaskRepository.open(params(nodeRootAt(dir), 'session'))).orThrow();
    expect(
      await FileTreeTaskRepository.open(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).toFailWithDetail(/already open in this process/i, expect.objectContaining({ code: 'conflict' }));
    if (session.state === 'ready') {
      session.repository.close();
    }
    expect(
      await FileTreeTaskRepository.open(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).toSucceed();
  });

  test('initializes, commits and reopens durably', async () => {
    const repository = await initialize();
    expect(repository.mode).toEqual({ durable: 'process-crash' });
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toSucceed();
    repository.close();
    const opened = (
      await FileTreeTaskRepository.open(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).orThrow();
    expect(opened.state === 'ready' && (await opened.repository.read('t1' as TaskId)).orThrow()?.state).toBe(
      'resolved'
    );
  });

  test('bytes that are not valid UTF-8 are corruption, never decoded with replacement characters', async () => {
    const repository = await initialize();
    (await repository.withWriter((w) => w.register(registration('t1')))).orThrow();
    repository.close();
    const file = path.join(dir, 'task-t1.json');
    const original = fs.readFileSync(file);
    // Replace one character inside the title with a lone continuation byte.
    const at = original.indexOf(Buffer.from('task t1'));
    const corrupted = Buffer.concat([
      original.subarray(0, at),
      Buffer.from([0x80]),
      original.subarray(at + 1)
    ]);
    fs.writeFileSync(file, corrupted);

    const opened = (
      await FileTreeTaskRepository.open(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).orThrow();
    expect(opened.state).toBe('recovery-required');
    if (opened.state === 'recovery-required') {
      expect(opened.recovery.report.issues).toEqual([
        expect.objectContaining({
          code: 'unreadable',
          severity: 'blocking',
          message: expect.stringMatching(/not valid UTF-8/)
        })
      ]);
      opened.recovery.close();
    }
    // Left exactly as found.
    expect(fs.readFileSync(file).equals(corrupted)).toBe(true);
  });

  test('the owner guard is by path: a second item over the same directory is the same root', async () => {
    const repository = await initialize();
    expect(
      await FileTreeTaskRepository.open(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).toFailWithDetail(/already open in this process/i, expect.objectContaining({ code: 'conflict' }));
    repository.close();
    expect(
      await FileTreeTaskRepository.open(params(nodeRootAt(dir), { durable: 'process-crash' }))
    ).toSucceed();
  });

  test('session mode over the Node store is explicit, and claims nothing durable', async () => {
    const repository = (
      await FileTreeTaskRepository.initialize(params(nodeRootAt(dir), 'session'))
    ).orThrow();
    expect(repository.mode).toBe('session');
    expect(await repository.withWriter((w) => w.register(registration('t1')))).toSucceed();
  });

  // procfs is on every Linux machine and is never on the allowlist.
  const onLinux: jest.It = process.platform === 'linux' ? test : test.skip;
  onLinux('a durable repository refuses a root on a filesystem the allowlist does not name', async () => {
    expect(
      await FileTreeTaskRepository.initialize(params(nodeRootAt('/proc/sys'), { durable: 'process-crash' }))
    ).toFailWithDetail(
      /cannot honor a 'process-crash' atomic write/i,
      expect.objectContaining({ code: 'unsupported' })
    );
  });
});
