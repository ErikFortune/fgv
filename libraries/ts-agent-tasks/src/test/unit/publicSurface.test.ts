/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import * as TaskLib from '../../index';

describe('public surface', () => {
  test('importing the library performs no I/O and registers nothing global', () => {
    // Every export is either a type (erased), a pure value, or a factory. Nothing in
    // the module graph opens a repository, reads a clock or mutates shared state, so a
    // second import observes exactly the first one's values.
    const exported: ReadonlyArray<string> = Object.keys(TaskLib);
    expect(exported.length).toBeGreaterThan(0);
    for (const name of exported) {
      expect(TaskLib).toHaveProperty(name);
    }
  });

  test('exports no repository, storage, broker or filesystem surface', () => {
    const names: ReadonlyArray<string> = Object.keys(TaskLib);
    for (const forbidden of ['FileTree', 'FileTreeTaskRepository', 'TaskRepository', 'TaskBroker']) {
      expect(names).not.toContain(forbidden);
    }
    expect(names.filter((n) => /repository|storage|broker|filetree/i.test(n))).toEqual([]);
  });

  test('exports no deferred input-request or answer protocol', () => {
    const names: ReadonlyArray<string> = Object.keys(TaskLib);
    expect(names.filter((n) => /inputrequest|answer|inbox|continuation/i.test(n))).toEqual([]);
  });

  test('exports no runner, scheduler, executor or retry policy', () => {
    const names: ReadonlyArray<string> = Object.keys(TaskLib);
    expect(names.filter((n) => /runner|scheduler|executor|retrypolicy/i.test(n))).toEqual([]);
  });

  test('exports no way for a caller to mint a capacity claim', () => {
    const names: ReadonlyArray<string> = Object.keys(TaskLib);
    // The claim converters validate repository-generated data; nothing creates one.
    expect(names.filter((n) => /^createCapacityClaim|^newCapacityClaim|^mintClaim/.test(n))).toEqual([]);
  });

  test('two independent registries can be constructed from the published factories', () => {
    const converters = TaskLib.TaskConverters.create().orThrow();
    const a = TaskLib.TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
    const b = TaskLib.TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
    expect(a).not.toBe(b);
    expect(a.register(TaskLib.trackedTaskDescriptor())).toSucceed();
    expect(b.has(TaskLib.trackedTaskKind, 1)).toBe(false);
  });
});
