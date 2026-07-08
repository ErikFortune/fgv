/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { ICycleGuardEdge, LinkType, MemoryId, assertNoCycles, buildCycleKey } from '../../../index';

const rel: LinkType = 'rel' as LinkType;

function edge(source: string, target: string, type: LinkType = rel): ICycleGuardEdge {
  return { source: source as MemoryId, target: target as MemoryId, type };
}

describe('buildCycleKey', () => {
  test('is deterministic for the same edge', () => {
    expect(buildCycleKey(edge('a', 'b'))).toSucceedAndSatisfy((key: string) => {
      expect(buildCycleKey(edge('a', 'b'))).toSucceedWith(key);
    });
  });

  test('differs by direction and type', () => {
    const forward = buildCycleKey(edge('a', 'b')).orThrow();
    const reverse = buildCycleKey(edge('b', 'a')).orThrow();
    const typed = buildCycleKey(edge('a', 'b', 'other' as LinkType)).orThrow();
    expect(forward).not.toBe(reverse);
    expect(forward).not.toBe(typed);
  });
});

describe('assertNoCycles', () => {
  test('accepts an acyclic graph', () => {
    expect(assertNoCycles([edge('a', 'b')], [edge('b', 'c'), edge('c', 'd')])).toSucceed();
  });

  test('rejects a proposed edge that closes a cycle against existing edges', () => {
    expect(assertNoCycles([edge('a', 'b'), edge('b', 'c')], [edge('c', 'a')])).toFailWith(
      /would create a cycle/
    );
  });

  test('rejects a cycle formed entirely within the proposed batch', () => {
    expect(assertNoCycles([], [edge('a', 'b'), edge('b', 'a')])).toFailWith(/would create a cycle/);
  });

  test('rejects a self-loop', () => {
    expect(assertNoCycles([], [edge('a', 'a')])).toFailWith(/self-loop/);
  });

  test('tolerates a duplicate proposed edge (deduped by canonical key)', () => {
    expect(assertNoCycles([], [edge('a', 'b'), edge('a', 'b')])).toSucceed();
  });

  test('tolerates a duplicate existing edge', () => {
    expect(assertNoCycles([edge('a', 'b'), edge('a', 'b')], [edge('b', 'c')])).toSucceed();
  });

  test('accepts a diamond (shared descendant is not a cycle)', () => {
    expect(assertNoCycles([], [edge('a', 'b'), edge('a', 'c'), edge('b', 'd'), edge('c', 'd')])).toSucceed();
  });

  test('reachability tolerates a frontier node reached by two paths (revisit guard)', () => {
    // Existing graph: a->c, a->b, b->c. A proposed edge z->a runs reachability
    // from `a`, whose DFS pushes `c` twice before it is visited — exercising the
    // visited-node skip in the traversal.
    expect(assertNoCycles([edge('a', 'c'), edge('a', 'b'), edge('b', 'c')], [edge('z', 'a')])).toSucceed();
  });
});
