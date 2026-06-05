// Copyright (c) 2026 Erik Fortune
// SPDX-License-Identifier: MIT

import '@fgv/ts-utils-jest';
import {
  IPromptObservationRecord,
  IPromptOutputObservation,
  IPromptResolveObservation,
  ISafeguardFinding,
  PromptId,
  PromptObservationStore,
  SafeguardDisposition,
  ScopeKey,
  SlotName
} from '../../../index';

function pid(id: string): PromptId {
  return id as unknown as PromptId;
}
function scope(s: string): ScopeKey {
  return s as unknown as ScopeKey;
}
function finding(disposition: SafeguardDisposition): ISafeguardFinding {
  return {
    slot: 'topic' as unknown as SlotName,
    kind: 'suspicious-pattern',
    disposition,
    detail: 'detail'
  };
}

interface IResolveOver {
  readonly timestamp?: number;
  readonly promptId?: string;
  readonly chain?: ReadonlyArray<string>;
  readonly qualifierContext?: Readonly<Record<string, string>>;
  readonly outcome?: 'success' | 'failure';
  readonly winningScope?: string;
  readonly body?: string;
  readonly outputKind?: 'free-text' | 'json';
  readonly safeguardFindings?: ReadonlyArray<ISafeguardFinding>;
  readonly error?: string;
}

function resolveRec(seq: number, over?: IResolveOver): IPromptResolveObservation {
  return {
    seq,
    contentHash: `h${seq}`,
    timestamp: over?.timestamp ?? seq * 1000,
    durationMs: 1,
    promptId: pid(over?.promptId ?? 'p'),
    chain: (over?.chain ?? ['global']).map(scope),
    qualifierContext: over?.qualifierContext ?? {},
    phase: 'resolve',
    outcome: over?.outcome ?? 'success',
    winningScope: over?.winningScope === undefined ? undefined : scope(over.winningScope),
    body: over?.body,
    outputKind: over?.outputKind,
    safeguardFindings: over?.safeguardFindings,
    error: over?.error
  };
}

function outputRec(
  seq: number,
  over?: {
    readonly phase?: 'json-output' | 'free-text-output';
    readonly linkedResolveSeq?: number;
    readonly outcome?: 'success' | 'failure';
    readonly rawOutput?: string;
    readonly promptId?: string;
    readonly chain?: ReadonlyArray<string>;
    readonly timestamp?: number;
  }
): IPromptOutputObservation {
  return {
    seq,
    contentHash: `h${seq}`,
    timestamp: over?.timestamp ?? seq * 1000,
    durationMs: 1,
    promptId: pid(over?.promptId ?? 'p'),
    chain: (over?.chain ?? ['global']).map(scope),
    qualifierContext: {},
    phase: over?.phase ?? 'json-output',
    linkedResolveSeq: over?.linkedResolveSeq ?? seq - 1,
    outcome: over?.outcome ?? 'success',
    rawOutput: over?.rawOutput ?? 'raw'
  };
}

async function seed(
  store: PromptObservationStore,
  records: ReadonlyArray<IPromptObservationRecord>
): Promise<void> {
  for (const record of records) {
    await store.observe(record);
  }
}

describe('PromptObservationStore', () => {
  describe('create', () => {
    test('succeeds with no params', () => {
      expect(PromptObservationStore.create()).toSucceedAndSatisfy((store) => {
        expect(store.size).toBe(0);
        expect(store.lastSeq).toBe(0);
      });
    });

    test('succeeds with a valid maxRecords', () => {
      expect(PromptObservationStore.create({ maxRecords: 10 })).toSucceed();
    });

    test.each([
      ['zero', 0],
      ['negative', -1],
      ['fractional', 2.5]
    ])('fails when maxRecords is %s', (__label, maxRecords) => {
      expect(PromptObservationStore.create({ maxRecords })).toFailWith(
        /maxRecords must be a positive integer/
      );
    });
  });

  describe('observe', () => {
    test('retains the record and returns it as a success', async () => {
      const store = PromptObservationStore.create().orThrow();
      const record = resolveRec(1);
      expect(await store.observe(record)).toSucceedWith(record);
      expect(store.size).toBe(1);
      expect(store.lastSeq).toBe(1);
    });

    test('evicts the oldest beyond maxRecords (size is bounded)', async () => {
      const store = PromptObservationStore.create({ maxRecords: 2 }).orThrow();
      await seed(store, [resolveRec(1), resolveRec(2), resolveRec(3)]);
      expect(store.size).toBe(2);
      expect(store.query().map((r) => r.seq)).toEqual([2, 3]);
      expect(store.lastSeq).toBe(3);
    });

    test('retains body, rawOutput, and substitutions verbatim (most-permissive)', async () => {
      const store = PromptObservationStore.create().orThrow();
      const resolve: IPromptResolveObservation = {
        ...resolveRec(1, { body: 'rendered PII body' }),
        substitutions: { topic: 'secret-value' }
      };
      const output = outputRec(2, { rawOutput: 'raw LLM PII output' });
      await seed(store, [resolve, output]);
      const stored = store.query();
      expect(stored[0]).toMatchObject({
        body: 'rendered PII body',
        substitutions: { topic: 'secret-value' }
      });
      expect(stored[1]).toMatchObject({ rawOutput: 'raw LLM PII output' });
    });
  });

  describe('query', () => {
    async function seeded(): Promise<PromptObservationStore> {
      const store = PromptObservationStore.create().orThrow();
      await seed(store, [
        resolveRec(1, {
          promptId: 'a',
          outputKind: 'json',
          winningScope: 'global',
          chain: ['user', 'global']
        }),
        resolveRec(2, {
          promptId: 'b',
          outcome: 'failure',
          error: 'boom',
          chain: ['global'],
          qualifierContext: { lang: 'fr' }
        }),
        resolveRec(3, {
          promptId: 'a',
          outputKind: 'free-text',
          winningScope: 'global',
          safeguardFindings: [finding('warn')]
        }),
        outputRec(4, { phase: 'json-output', linkedResolveSeq: 1, outcome: 'success' }),
        outputRec(5, { phase: 'free-text-output', linkedResolveSeq: 3, outcome: 'failure' })
      ]);
      return store;
    }

    test('returns all records oldest-first with no criteria', async () => {
      expect((await seeded()).query().map((r) => r.seq)).toEqual([1, 2, 3, 4, 5]);
    });

    test('filters by promptId', async () => {
      expect((await seeded()).query({ promptId: pid('a') }).map((r) => r.seq)).toEqual([1, 3]);
    });

    test('filters by phase', async () => {
      expect((await seeded()).query({ phase: 'free-text-output' }).map((r) => r.seq)).toEqual([5]);
    });

    test('filters by outcome', async () => {
      expect((await seeded()).query({ outcome: 'failure' }).map((r) => r.seq)).toEqual([2, 5]);
    });

    test('filters by outputKind (resolve records only)', async () => {
      const store = await seeded();
      expect(store.query({ outputKind: 'json' }).map((r) => r.seq)).toEqual([1]);
      expect(store.query({ outputKind: 'free-text' }).map((r) => r.seq)).toEqual([3]);
    });

    test('filters by scope via chain membership', async () => {
      expect((await seeded()).query({ scope: scope('user') }).map((r) => r.seq)).toEqual([1]);
    });

    test('filters by scope via winningScope even when not in the chain', async () => {
      const store = PromptObservationStore.create().orThrow();
      // chain does NOT include 'tenant'; only the winningScope does.
      await seed(store, [resolveRec(1, { chain: ['user'], winningScope: 'tenant' })]);
      expect(store.query({ scope: scope('tenant') }).map((r) => r.seq)).toEqual([1]);
      // an output record with the same chain but no winningScope field does NOT match.
      await seed(store, [outputRec(2, { chain: ['user'] })]);
      expect(store.query({ scope: scope('tenant') }).map((r) => r.seq)).toEqual([1]);
    });

    test('filters by qualifiers (partial match)', async () => {
      const store = await seeded();
      expect(store.query({ qualifiers: { lang: 'fr' } }).map((r) => r.seq)).toEqual([2]);
      expect(store.query({ qualifiers: { lang: 'de' } })).toEqual([]);
    });

    test('filters by hasSafeguardFindings', async () => {
      const store = await seeded();
      expect(store.query({ hasSafeguardFindings: true }).map((r) => r.seq)).toEqual([3]);
      expect(store.query({ hasSafeguardFindings: false }).map((r) => r.seq)).toEqual([1, 2, 4, 5]);
    });

    test('filters by safeguardDisposition', async () => {
      const store = await seeded();
      expect(store.query({ safeguardDisposition: 'warn' }).map((r) => r.seq)).toEqual([3]);
      expect(store.query({ safeguardDisposition: 'reject' })).toEqual([]);
    });

    test('filters by sinceSeq cursor', async () => {
      expect((await seeded()).query({ sinceSeq: 3 }).map((r) => r.seq)).toEqual([4, 5]);
    });

    test('filters by timestamp range (since / until)', async () => {
      const store = await seeded();
      // timestamps are seq*1000
      expect(store.query({ since: 2000, until: 4000 }).map((r) => r.seq)).toEqual([2, 3, 4]);
      expect(store.query({ since: 4000 }).map((r) => r.seq)).toEqual([4, 5]);
      expect(store.query({ until: 2000 }).map((r) => r.seq)).toEqual([1, 2]);
    });

    test('limit returns the most-recent N', async () => {
      expect((await seeded()).query({ limit: 2 }).map((r) => r.seq)).toEqual([4, 5]);
    });

    test('applies an escape-hatch filter predicate', async () => {
      const evens = (await seeded()).query({ filter: (r) => r.seq % 2 === 0 });
      expect(evens.map((r) => r.seq)).toEqual([2, 4]);
    });

    test('AND-combines multiple criteria', async () => {
      expect(
        (await seeded()).query({ promptId: pid('a'), outputKind: 'free-text' }).map((r) => r.seq)
      ).toEqual([3]);
    });
  });

  describe('clear', () => {
    test('empties the store but preserves lastSeq', async () => {
      const store = PromptObservationStore.create().orThrow();
      await seed(store, [resolveRec(1), resolveRec(2), resolveRec(3)]);
      const cursor = store.lastSeq;
      store.clear();
      expect(store.size).toBe(0);
      expect(store.query()).toEqual([]);
      expect(store.lastSeq).toBe(3);
      await seed(store, [resolveRec(4)]);
      expect(store.query({ sinceSeq: cursor }).map((r) => r.seq)).toEqual([4]);
    });
  });
});
