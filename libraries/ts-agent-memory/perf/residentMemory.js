/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * Resident-memory measurement for the partial-read `IMemoryIndex` redesign.
 *
 * Deliberately NOT a jest test. It is a measurement, not a behavior — putting it
 * in the suite would put a machine-dependent number behind the coverage gate and
 * make CI's runtime a function of N. It lives here so it can be run on demand and
 * its output pasted into a stream's `result.md`.
 *
 *   node --expose-gc perf/residentMemory.js [N] [bodyKiB] [storeN]
 *
 * Requires a built `lib/` (`rushx build` first).
 *
 * Two things here are easy to get wrong, and both were, first time:
 *
 * 1. **Each pass must build its own corpus** and let its source references die as
 *    it goes. The claim under test is that the index no longer keeps bodies
 *    ALIVE; if both passes read from one pre-built array, that array retains
 *    every body and the whole-record map costs a pointer per entry, reporting no
 *    difference for entirely the wrong reason.
 * 2. **The bodies must be incompressible.** A body built with `padEnd` measures
 *    as ~1/8th of its own length and frees nothing when dropped — V8 shares the
 *    padding's backing store across every call, so the corpus was never resident
 *    to begin with and the A/B compares two numbers that are both noise. Random
 *    hex retains and releases exactly its own size, so it is what is used.
 *
 * Reported alongside is a real `FileTreeMemoryStore.create()` open delta — the
 * number a consumer actually pays. It runs at a smaller N by default because
 * seeding is quadratic: content-hash dedup scans the cohort on every `put`.
 */

/* eslint-disable no-console */

const crypto = require('crypto');
const { FileTree } = require('@fgv/ts-json-base');
const { Converters } = require('@fgv/ts-utils');
const {
  BodyConverterRegistry,
  FileTreeMemoryStore,
  KnowledgeIdentityCodec,
  envelopeConverter
} = require('../lib/index');

const N = Number(process.argv[2] ?? 2000);
const BODY_KIB = Number(process.argv[3] ?? 4);
const BODY_BYTES = BODY_KIB * 1024;
const STORE_N = Number(process.argv[4] ?? 400);

if (typeof global.gc !== 'function') {
  console.error('run with --expose-gc, e.g. `node --expose-gc perf/residentMemory.js`');
  process.exit(1);
}

/** Settle the heap and read `heapUsed`. Several passes: one gc leaves float. */
function sample() {
  for (let i = 0; i < 4; i++) {
    global.gc();
  }
  return process.memoryUsage().heapUsed;
}

function mib(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function makeRecord(i) {
  return {
    envelope: envelopeConverter
      .convert({
        id: `rec-${i}`,
        entityId: `rec-${i}`,
        kind: 'knowledge',
        tags: ['bulk'],
        links: [],
        created: i,
        updated: i,
        seq: i,
        contentHash: `h${i}`,
        provenance: { source: 'agent' }
      })
      .orThrow(),
    // Incompressible and distinct per record: nothing is deduped by the store's
    // content hash, and — the load-bearing half — nothing shares a backing store
    // with anything else, so what is retained is what is measured.
    body: crypto.randomBytes(BODY_BYTES / 2).toString('hex')
  };
}

/**
 * Retain N records through `project` and report the resident cost of what was
 * retained. The corpus is minted inside the loop so the only thing keeping a
 * body alive is `project`'s return value.
 */
function measureRetained(project) {
  const base = sample();
  let held = new Map();
  for (let i = 0; i < N; i++) {
    const record = makeRecord(i);
    held.set(record.envelope.id, project(record));
  }
  const delta = sample() - base;
  held = undefined;
  sample();
  return delta;
}

async function main() {
  console.log(`N=${N} records, body=${BODY_KIB} KiB → ${mib(N * BODY_BYTES)} of body\n`);

  const wholeDelta = measureRetained((record) => ({ scope: 'knowledge', record }));
  const projectedDelta = measureRetained((record) => ({
    scope: 'knowledge',
    envelope: record.envelope
  }));

  console.log('what the index retains, same corpus:');
  console.log(`  whole records (before):     ${mib(wholeDelta)}`);
  console.log(`  projected entries (after):  ${mib(projectedDelta)}`);
  console.log(`  reduction:                  ${(100 * (1 - projectedDelta / wholeDelta)).toFixed(1)}%\n`);

  // ---- The number a consumer pays: a real store open -----------------------
  const tree = FileTree.inMemory([], { mutable: true }).orThrow();
  const root = tree.getDirectory('/').orThrow();
  const registry = BodyConverterRegistry.create().orThrow();
  registry.register('knowledge', Converters.string);
  const codecs = new Map([['knowledge', new KnowledgeIdentityCodec()]]);

  const seed = FileTreeMemoryStore.create({ root, registry, codecs }).orThrow();
  for (let i = 0; i < STORE_N; i++) {
    (await seed.put(makeRecord(i))).orThrow();
  }

  const beforeOpen = sample();
  const store = FileTreeMemoryStore.create({ root, registry, codecs }).orThrow();
  const opened = (await store.listEntries()).orThrow().length;
  const openDelta = sample() - beforeOpen;

  console.log(`store open (${opened} entries, ${mib(STORE_N * BODY_BYTES)} of body): ${mib(openDelta)}`);
  console.log(`  as a fraction of body volume:  ${(100 * (openDelta / (STORE_N * BODY_BYTES))).toFixed(1)}%`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
