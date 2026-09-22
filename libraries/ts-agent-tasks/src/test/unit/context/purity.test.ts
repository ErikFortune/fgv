/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import crypto from 'crypto';
import fs from 'fs';
import fsPromises from 'fs/promises';
import * as path from 'path';
import { Result, succeed } from '@fgv/ts-utils';
import { ITaskContext, ITaskSummary, TaskContextRenderer } from '../../../index';
import { input, summary, unresolved, update } from '../../helpers/contextFixtures';

/**
 * Spies on every function-valued own property of `target`, passing calls through. Returns
 * the spies so a test can assert none was called.
 */
function spyOnAll(target: object, label: string): Array<{ name: string; spy: jest.SpyInstance }> {
  const spies: Array<{ name: string; spy: jest.SpyInstance }> = [];
  for (const name of Object.keys(target)) {
    const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(target, name);
    if (
      descriptor &&
      typeof descriptor.value === 'function' &&
      descriptor.configurable &&
      descriptor.writable
    ) {
      spies.push({
        name: `${label}.${name}`,
        spy: jest.spyOn(target as Record<string, (...args: unknown[]) => unknown>, name)
      });
    }
  }
  return spies;
}

describe('rendering has no side effects', () => {
  const t1: { description: string; attention: Array<{ namespace: string; key: string }> } = {
    description: 'a task',
    attention: [{ namespace: 'thread', key: 'q' }]
  };
  const parts = {
    tasks: [summary('t1', 2, t1), summary('t2', 1, { parentId: 't1', progress: { completed: 1 } })],
    updates: [update('u1', 't1', 1, 'lifecycle', true), update('u2', 't1', 2, 'attention', true, t1)],
    unresolved: [unresolved('x1')],
    deliveryId: 'delivery-1'
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('no clock, random, crypto or filesystem call is made while rendering', () => {
    const projection = jest.fn((s: ITaskSummary): Result<ITaskSummary> => succeed(s));
    const renderer: TaskContextRenderer = TaskContextRenderer.create({ projection }).orThrow();

    const spies: Array<{ name: string; spy: jest.SpyInstance }> = [
      { name: 'Date.now', spy: jest.spyOn(Date, 'now') },
      { name: 'Math.random', spy: jest.spyOn(Math, 'random') },
      { name: 'performance.now', spy: jest.spyOn(performance, 'now') },
      { name: 'process.hrtime.bigint', spy: jest.spyOn(process.hrtime, 'bigint') },
      { name: 'globalThis.crypto.randomUUID', spy: jest.spyOn(globalThis.crypto, 'randomUUID') },
      { name: 'globalThis.crypto.getRandomValues', spy: jest.spyOn(globalThis.crypto, 'getRandomValues') },
      ...spyOnAll(crypto, 'crypto'),
      ...spyOnAll(fs, 'fs'),
      ...spyOnAll(fsPromises, 'fs/promises')
    ];
    // Sanity: the spies are live, so a silent pass below means something.
    expect(spies.length).toBeGreaterThan(50);
    expect(spies.find((s) => s.name === 'fs.writeFileSync')).toBeDefined();
    expect(spies.find((s) => s.name === 'fs.readFileSync')).toBeDefined();

    const context: ITaskContext = renderer.render(input(parts)).orThrow();

    expect(spies.filter((s) => s.spy.mock.calls.length > 0).map((s) => s.name)).toEqual([]);
    // The one injected dependency is the projection, called once per distinct revision.
    expect(projection).toHaveBeenCalledTimes(3);
    expect(context.receipt.included).toHaveLength(3);
  });

  test('the renderer takes no store, clock, ID factory or logger to call', () => {
    // Its construction parameters are the whole of what it can reach.
    const renderer: TaskContextRenderer = TaskContextRenderer.create().orThrow();
    expect(Object.keys(renderer).sort()).toEqual([
      '_normalizer',
      '_projection',
      '_unresolvedProjection',
      'converters',
      'framingReserve'
    ]);
  });

  test('the context packlet imports nothing that could reach a store, clock or filesystem', () => {
    const dir: string = path.resolve(__dirname, '../../../packlets/context');
    const allowed: ReadonlyArray<string> = [
      '@fgv/ts-utils',
      '../types',
      '../converters',
      './escaping',
      './framing',
      './normalize',
      './renderer'
    ];
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
      const source: string = fs.readFileSync(path.join(dir, file), 'utf8');
      const imported: string[] = Array.from(source.matchAll(/from '([^']+)'/g)).map((m) => m[1]);
      expect({ file, disallowed: imported.filter((m) => !allowed.includes(m)) }).toEqual({
        file,
        disallowed: []
      });
    }
  });

  test('rendering does not mutate its input', () => {
    const renderer: TaskContextRenderer = TaskContextRenderer.create().orThrow();
    const value = input(parts);
    const before: string = JSON.stringify(value);
    renderer.render(value).orThrow();
    expect(JSON.stringify(value)).toBe(before);
  });
});
