/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Hash, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { LinkType, MemoryId } from '../types';

/**
 * A directed edge in the link graph the cycle guard reasons over: `source` links
 * to `target` under relation `type`.
 * @public
 */
export interface ICycleGuardEdge {
  readonly source: MemoryId;
  readonly target: MemoryId;
  readonly type: LinkType;
}

/**
 * Build the design's `buildCycleKey` — a deterministic, canonical (RFC-8785,
 * via `Crc32Normalizer` from `@fgv/ts-utils`) identity for a directed edge. Used
 * to de-duplicate proposed edges so a repeated `(source, target, type)` proposal
 * contributes a single graph edge (and never spuriously "re-closes" a cycle).
 * @public
 */
export function buildCycleKey(edge: ICycleGuardEdge): Result<string> {
  return new Hash.Crc32Normalizer().computeHash({
    source: edge.source,
    target: edge.target,
    type: edge.type
  });
}

/**
 * Write-time cycle guard. Given the graph's EXISTING directed edges plus a set of
 * PROPOSED edges, verify that adding the proposed edges keeps the union graph a
 * DAG. Fails loudly, naming the first proposed edge that would close a directed
 * cycle.
 *
 * @remarks
 * Distinct from the read-time BFS in `LinkTraversalRetriever` (which tolerates
 * cycles via a visited-set): this is a WRITE-time admission check. Cycle
 * detection is DFS reachability — a proposed `source -> target` edge closes a
 * cycle iff `target` already reaches `source` in the graph built so far. Proposed
 * edges are folded in one at a time (in order), so an intra-batch cycle
 * (`A->B`, `B->A` both proposed) is caught as well as a batch-vs-existing cycle.
 *
 * See the design note §4: this enforces GLOBAL directed-acyclicity over all link
 * types (conservative — a mutual associative pair is rejected). Callers that need
 * mutual links disable the guard.
 * @public
 */
export function assertNoCycles(
  existing: ReadonlyArray<ICycleGuardEdge>,
  proposed: ReadonlyArray<ICycleGuardEdge>
): Result<true> {
  // Canonically key every edge up front (the only fallible step); the graph
  // building + cycle detection below is then pure.
  return keyEdges(existing).onSuccess((existingKeyed) =>
    keyEdges(proposed).onSuccess((proposedKeyed) => {
      // Adjacency map, de-duplicated by canonical edge key so a repeated edge is
      // one arc. Seed with the existing edges, then fold in each proposed edge,
      // checking reachability BEFORE inserting it.
      const adjacency: Map<string, Set<string>> = new Map<string, Set<string>>();
      const seenKeys: Set<string> = new Set<string>();
      for (const keyed of existingKeyed) {
        addEdge(adjacency, seenKeys, keyed);
      }
      for (const keyed of proposedKeyed) {
        const edge: ICycleGuardEdge = keyed.edge;
        // A self-loop is the degenerate one-node cycle.
        if (edge.source === edge.target) {
          return fail(
            `ingest cycle guard: edge '${edge.source}' -${edge.type}-> '${edge.target}' is a self-loop`
          );
        }
        // Reachability: does `target` already reach `source`? If so, adding
        // `source -> target` closes a directed cycle.
        if (reaches(adjacency, edge.target, edge.source)) {
          return fail(
            `ingest cycle guard: edge '${edge.source}' -${edge.type}-> '${edge.target}' would create a cycle`
          );
        }
        addEdge(adjacency, seenKeys, keyed);
      }
      return succeed(true);
    })
  );
}

/** An edge paired with its canonical cycle key. */
interface IKeyedEdge {
  readonly edge: ICycleGuardEdge;
  readonly key: string;
}

/** Canonically key a set of edges (the guard's only fallible step). */
function keyEdges(edges: ReadonlyArray<ICycleGuardEdge>): Result<ReadonlyArray<IKeyedEdge>> {
  return mapResults(edges.map((edge) => buildCycleKey(edge).onSuccess((key) => succeed({ edge, key }))));
}

/** Add an edge to the adjacency map, de-duplicated by its canonical key. */
function addEdge(adjacency: Map<string, Set<string>>, seenKeys: Set<string>, keyed: IKeyedEdge): void {
  if (seenKeys.has(keyed.key)) {
    return;
  }
  seenKeys.add(keyed.key);
  const source: string = keyed.edge.source;
  const target: string = keyed.edge.target;
  const targets: Set<string> | undefined = adjacency.get(source);
  if (targets === undefined) {
    adjacency.set(source, new Set<string>([target]));
  } else {
    targets.add(target);
  }
}

/** DFS reachability: is `to` reachable from `from` over `adjacency`? */
function reaches(adjacency: ReadonlyMap<string, Set<string>>, from: string, to: string): boolean {
  const visited: Set<string> = new Set<string>();
  const stack: string[] = [from];
  while (stack.length > 0) {
    const node: string = stack.pop() as string;
    if (node === to) {
      return true;
    }
    if (visited.has(node)) {
      continue;
    }
    visited.add(node);
    const neighbors: Set<string> | undefined = adjacency.get(node);
    if (neighbors !== undefined) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }
  return false;
}
