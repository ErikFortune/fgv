/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { FileTree } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  ITaskCapacityProfile,
  TaskRepositoryOpenResult,
  defaultTaskCapacityProfile
} from '../../../index';
import { brokerHarness, brokerRegistry } from '../../helpers/brokerFixtures';
import { environment, memoryRoot } from '../../helpers/storageFixtures';
import { node, stop } from '../../helpers/stopFixtures';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { stopAttemptBundle } from '../../../packlets/storage/stopLedger';

type Root = FileTree.IAtomicFileTreeDirectoryItem & FileTree.IMutableFileTreeDirectoryItem;

function text(root: Root, name: string): string {
  const file = root
    .getChildren()
    .orThrow()
    .find((c) => c.name === name) as FileTree.IFileTreeFileItem;
  return file.getRawContents().orThrow();
}

/** Two stopped roots, `p` over `pa` and `q` over `qa`, in a closed repository. */
async function twoStops(): Promise<Root> {
  const root = memoryRoot() as Root;
  const h = await brokerHarness({ root });
  for (const r of ['p', 'q']) {
    await node(h.writer, r, { stopPolicy: 'cascade-pause' });
    await node(h.writer, `${r}a`, { parentId: r });
    (await stop(h, h.writer, r, 'pause')).orThrow();
  }
  h.repository.close();
  return root;
}

async function reopen(root: Root): Promise<TaskRepositoryOpenResult> {
  return (
    await FileTreeTaskRepository.open({
      root,
      mode: 'session',
      environment: environment('o').env,
      registry: brokerRegistry()
    })
  ).orThrow();
}

function blockingMessages(opened: TaskRepositoryOpenResult): ReadonlyArray<string> {
  if (opened.state !== 'recovery-required') {
    throw new Error('expected a recovery handle');
  }
  opened.recovery.close();
  return opened.recovery.report.issues.filter((i) => i.severity === 'blocking').map((i) => i.message);
}

describe('open rebuilds the stops, and refuses records that could not have been written', () => {
  test('a clean repository opens with its latches in force', async () => {
    const root = await twoStops();
    const opened = await reopen(root);
    expect(opened.state).toBe('ready');
    if (opened.state === 'ready') {
      expect(opened.repository.stopLatches('pa' as never)).toHaveLength(1);
      expect(opened.repository.stopLatches('nobody' as never)).toEqual([]);
    }
  });

  test("a stop whose attempt key is another stop's live attempt blocks open", async () => {
    const root = await twoStops();
    const p = JSON.parse(text(root, 'task-p.json'));
    const q = JSON.parse(text(root, 'task-q.json'));
    q.stops[0].targets[1].operationId = p.stops[0].targets[1].operationId;
    root.writeChildAtomically('task-q.json', JSON.stringify(q), { guarantee: 'session' }).orThrow();
    expect(blockingMessages(await reopen(root))).toEqual(
      expect.arrayContaining([expect.stringMatching(/already a live attempt of another stop/)])
    );
  });

  test('a stop naming a task that does not exist blocks open', async () => {
    const root = await twoStops();
    const p = JSON.parse(text(root, 'task-p.json'));
    p.stops[0].targets[1].taskId = 'ghost';
    root.writeChildAtomically('task-p.json', JSON.stringify(p), { guarantee: 'session' }).orThrow();
    expect(blockingMessages(await reopen(root))).toEqual(
      expect.arrayContaining([expect.stringMatching(/task ghost: a stop names it.* no such task is live/)])
    );
  });
});

describe('a profile whose stop reservation is not representable', () => {
  const extreme: ITaskCapacityProfile = {
    ...defaultTaskCapacityProfile,
    encoded: {
      ...defaultTaskCapacityProfile.encoded,
      maxStoredOperationBytes: 2 ** 40,
      maxIssuedReceiptBytes: Number.MAX_SAFE_INTEGER - 2 ** 40 - 2 ** 20
    }
  };

  test('computes no bundle, rather than an inexact one', () => {
    expect(stopAttemptBundle(extreme)).toFailWith(/not exactly representable/);
  });
});
