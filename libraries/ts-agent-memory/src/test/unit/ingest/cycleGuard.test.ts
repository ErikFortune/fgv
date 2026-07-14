/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import {
  ICycleGuardEdge,
  IEdgeTarget,
  LinkType,
  MemoryId,
  MemoryScopeKey,
  assertNoCycles,
  buildCycleKey
} from '../../../index';

const rel: LinkType = 'rel' as LinkType;
const DEFAULT_SCOPE: string = 'exp';

/** A scope-qualified node, `scope#id` or a bare id defaulting to {@link DEFAULT_SCOPE}. */
function node(spec: string): IEdgeTarget {
  const hash: number = spec.indexOf('#');
  const scope: string = hash >= 0 ? spec.slice(0, hash) : DEFAULT_SCOPE;
  const id: string = hash >= 0 ? spec.slice(hash + 1) : spec;
  return { scope: scope as MemoryScopeKey, id: id as MemoryId };
}

function edge(source: string, target: string, type: LinkType = rel): ICycleGuardEdge {
  return { source: node(source), target: node(target), type };
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

  describe('scope-qualified nodes', () => {
    test('does NOT conflate a stem shared across scopes into one node', () => {
      // ca#x -> cb#y and cb#x -> ca#z reuse the stem `x` across scopes ca/cb.
      // If the guard keyed on bare id, the two `x` nodes would merge and a false
      // cycle could appear; with scoped keys they are distinct and the graph is acyclic.
      expect(assertNoCycles([], [edge('ca#x', 'cb#y'), edge('cb#x', 'ca#z')])).toSucceed();
    });

    test('still rejects a genuine within-scope cycle across the same stems', () => {
      expect(assertNoCycles([], [edge('ca#x', 'ca#y'), edge('ca#y', 'ca#x')])).toFailWith(
        /would create a cycle/
      );
    });

    test('a self-loop is detected on the full scoped identity', () => {
      expect(assertNoCycles([], [edge('ca#x', 'ca#x')])).toFailWith(/self-loop/);
      // Same stem, different scope is NOT a self-loop.
      expect(assertNoCycles([], [edge('ca#x', 'cb#x')])).toSucceed();
    });

    test('names the scope in the diagnostic', () => {
      expect(assertNoCycles([], [edge('ca#x', 'ca#x')])).toFailWith(/ca\/x/);
    });
  });
});
