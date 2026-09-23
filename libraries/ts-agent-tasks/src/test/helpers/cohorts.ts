/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import {
  FileTreeTaskRepository,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskRepository,
  ITaskRepositoryManifest,
  TaskId,
  defaultTaskCapacityProfile
} from '../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { encodeRecord } from '../../packlets/storage/layout';
import { ITaskShape, addTask, finishAndArchive } from './queryFixtures';
import { memoryRoot, params } from './storageFixtures';

/**
 * The declared fixture profile for the growth cohorts: it admits 10,000 unrelated tasks in any
 * one cohort next to the fixed matching set, and every other limit is the default or a finite
 * raise stated here, before any run.
 */
export const cohortProfile: ITaskCapacityProfile = {
  ...defaultTaskCapacityProfile,
  limits: {
    ...defaultTaskCapacityProfile.limits,
    'retained-tasks': 25000,
    'non-archived-tasks': 11000,
    updates: 100000,
    'audience-links': 5000000,
    'acknowledgement-ids': 5000000,
    operations: 100000,
    'logical-bytes': 64 * 1024 * 1024 * 1024,
    'resident-payload-bytes': 8 * 1024 * 1024 * 1024
  }
};

/** A group of tasks cloned from one template registered through the real API. */
export interface ICohort {
  readonly prefix: string;
  readonly count: number;
  readonly shape: ITaskShape;
  readonly archive?: boolean;
}

function cohortId(prefix: string, i: number): string {
  return `${prefix}${String(i).padStart(5, '0')}`;
}

/**
 * Seeds a repository with a fixed set of individually registered tasks plus cohorts of clones.
 *
 * @remarks
 * Registering 10,000 tasks one at a time rewrites the inventory 10,000 times, so each cohort's
 * first member is registered (and archived) through the real API and the rest are clones of
 * its committed record with the id and claim ids substituted. The clones are then validated by
 * the one thing that matters: the real `open`, which checks every record, claim and edge exactly
 * as it would any other root. A clone that did not validate would open as a recovery handle.
 */
export async function seedRepository(
  fixed: ReadonlyArray<{ readonly id: string; readonly shape: ITaskShape }>,
  cohorts: ReadonlyArray<ICohort>
): Promise<{ root: FileTree.IFileTreeDirectoryItem; repository: ITaskRepository }> {
  const root = memoryRoot();
  const seeding: ITaskRepository = (
    await FileTreeTaskRepository.initialize(params(root, 'session', { profile: cohortProfile }))
  ).orThrow();
  for (const task of fixed) {
    await addTask(seeding, task.id, task.shape);
  }
  const templates: Array<{ cohort: ICohort; text: string; record: ITaskCommitRecord }> = [];
  for (const cohort of cohorts) {
    if (cohort.count === 0) {
      continue;
    }
    const id: string = cohortId(cohort.prefix, 0);
    await addTask(seeding, id, cohort.shape);
    if (cohort.archive === true) {
      await finishAndArchive(seeding, id);
    }
    const record: ITaskCommitRecord = (await seeding.readCommit(id as TaskId)).orThrow()!;
    templates.push({ cohort, record, text: encodeRecord(record).orThrow().text });
  }
  seeding.close().orThrow();

  const dir = root as FileTree.IAtomicFileTreeDirectoryItem;
  const manifestFile = (dir
    .getChildren()
    .orThrow()
    .find((c) => c.name === 'repository.json') as FileTree.IFileTreeFileItem)!;
  const manifest: ITaskRepositoryManifest = JSON.parse(manifestFile.getRawContents().orThrow());
  const entries = [...manifest.tasks];
  for (const { cohort, record, text } of templates) {
    const templateId: string = cohortId(cohort.prefix, 0);
    const claimIds: string[] = record.capacityClaims.map((c) => c.claimId);
    for (let i = 1; i < cohort.count; i++) {
      const id: string = cohortId(cohort.prefix, i);
      let clone: string = text.split(templateId).join(id);
      for (const claimId of claimIds) {
        clone = clone.split(`"${claimId}"`).join(`"${claimId}x${id}"`);
      }
      dir.writeChildAtomically(`task-${id}.json`, clone, { guarantee: 'session' }).orThrow();
      entries.push({ id, state: 'live' });
    }
  }
  entries.sort((a, b) => (a.id < b.id ? -1 : 1));
  const next: ITaskRepositoryManifest = {
    ...manifest,
    manifestRevision: manifest.manifestRevision + 1,
    tasks: entries
  };
  dir
    .writeChildAtomically('repository.json', encodeRecord(next).orThrow().text, { guarantee: 'session' })
    .orThrow();

  const opened = (await FileTreeTaskRepository.open(params(root, 'session'))).orThrow();
  if (opened.state !== 'ready') {
    throw new Error(
      `seedRepository: the seeded root did not open: ${opened.recovery.report.issues
        .slice(0, 5)
        .map((i) => i.message)
        .join('; ')}`
    );
  }
  return { root, repository: opened.repository };
}
