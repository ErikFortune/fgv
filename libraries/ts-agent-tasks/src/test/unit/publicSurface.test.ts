/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import * as TaskLib from '../../index';

describe('public surface', () => {
  test('exports the FileTree repository (T3) and one broker (T5), but no filesystem of its own', () => {
    const names: ReadonlyArray<string> = Object.keys(TaskLib);
    // T3 adds exactly one repository implementation, over an injected FileTree root; T4 adds the
    // behavioural conformance runner a custom implementation is checked with.
    expect(names.filter((n) => /repository/i.test(n))).toEqual([
      'FileTreeTaskRepository',
      'runTaskRepositoryConformance'
    ]);
    // It does not re-export FileTree. T5 adds exactly one broker and its request converters.
    expect(names).not.toContain('FileTree');
    expect(names.filter((n) => /broker/i.test(n)).sort()).toEqual(['TaskBroker', 'buildBrokerConverters']);
    // The update-audience seam sees whole envelopes; it is reachable only inside the package.
    expect(Object.getOwnPropertyNames(TaskLib.TaskBroker).filter((n) => n.startsWith('_'))).toEqual([]);
    expect(names.filter((n) => /^fs|filesystem/i.test(n))).toEqual([]);
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
