// Copyright (c) 2026 Erik Fortune
// SPDX-License-Identifier: MIT

import '@fgv/ts-utils-jest';
import {
  ConverterId,
  IPromptObservationRecord,
  IPromptObserver,
  IPromptStore,
  IPromptStoreFixtureSeed,
  IStoredPromptRecord,
  PromptId,
  PromptLibrary,
  PromptObservationStore,
  PromptRegistry,
  PromptStoreFixture,
  ResourceId,
  ScopeKey,
  SlotBinding,
  SlotName
} from '../../../index';
import { Converters, Hash, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import { QualifierTypes, Qualifiers } from '@fgv/ts-res';

const QUALIFIER_TYPES = QualifierTypes.QualifierTypeCollector.create({
  qualifierTypes: [QualifierTypes.LiteralQualifierType.create({ name: 'lang' }).orThrow()]
}).orThrow();
const QUALIFIERS = Qualifiers.QualifierCollector.create({
  qualifierTypes: QUALIFIER_TYPES,
  qualifiers: [{ name: 'lang', typeName: 'lang', defaultPriority: 1000 }]
}).orThrow();

const SCOPE = 'global' as unknown as ScopeKey;
const PROMPT = 'p' as unknown as PromptId;

interface IClassifierResponse {
  readonly kind: 'classifier';
  readonly label: string;
}
type Responses = IClassifierResponse;
const CLASSIFIER_ID = 'classifier' as unknown as ConverterId;

function freeTextRecord(id: PromptId = PROMPT, body: string = 'hello'): IStoredPromptRecord {
  return {
    scope: SCOPE,
    id,
    descriptor: {
      id,
      title: 'p',
      schemaVersion: '1',
      surface: 'chat',
      slots: [],
      output: { kind: 'free-text' }
    },
    candidates: [{ conditions: {}, body }]
  };
}

function jsonRecord(id: PromptId = PROMPT): IStoredPromptRecord {
  return {
    scope: SCOPE,
    id,
    descriptor: {
      id,
      title: 'p',
      schemaVersion: '1',
      surface: 'chat',
      slots: [],
      output: { kind: 'json', converterId: CLASSIFIER_ID }
    },
    candidates: [{ conditions: {}, body: 'classify this' }]
  };
}

function classifierRegistry(): PromptRegistry<Responses> {
  const reg = PromptRegistry.create<Responses>().orThrow();
  reg.converters
    .register(
      CLASSIFIER_ID,
      'classifier',
      Converters.object<IClassifierResponse>({
        kind: Converters.literal<'classifier'>('classifier'),
        label: Converters.string
      })
    )
    .orThrow();
  return reg;
}

async function buildStore(seed: IPromptStoreFixtureSeed): Promise<IPromptStore> {
  return (await PromptStoreFixture.build(seed)).orThrow();
}

async function buildLib(
  records: ReadonlyArray<IStoredPromptRecord>,
  options?: {
    readonly observers?: ReadonlyArray<IPromptObserver>;
    readonly registry?: PromptRegistry<Responses>;
    readonly logger?: Logging.ILogger;
  }
): Promise<PromptLibrary<Responses>> {
  const store = await buildStore({ records: [...records] });
  return (
    await PromptLibrary.create<Responses>({
      store,
      qualifiers: QUALIFIERS,
      observers: options?.observers,
      registry: options?.registry,
      logger: options?.logger
    })
  ).orThrow();
}

/** An observer that delays before recording, for OQ-3 latency tests. */
class SlowObserver implements IPromptObserver {
  public readonly fireAndForget?: boolean;
  public readonly observed: IPromptObservationRecord[] = [];
  private readonly _delayMs: number;
  public constructor(delayMs: number, fireAndForget?: boolean) {
    this._delayMs = delayMs;
    this.fireAndForget = fireAndForget;
  }
  public async observe(record: IPromptObservationRecord): Promise<Result<unknown>> {
    await new Promise((resolve) => setTimeout(resolve, this._delayMs));
    this.observed.push(record);
    return succeed(record);
  }
}

describe('PromptLibrary observability wiring', () => {
  describe('firing surface', () => {
    test('resolve() fires exactly one success resolve record', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib([freeTextRecord()], { observers: [store] });
      expect(await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: {} })).toSucceed();
      const records = store.query();
      expect(records).toHaveLength(1);
      const [record] = records;
      expect(record.phase).toBe('resolve');
      expect(record.outcome).toBe('success');
      expect(record.promptId).toBe(PROMPT);
      expect(record.seq).toBe(1);
      expect(record.contentHash).not.toBe('');
      if (record.phase === 'resolve') {
        expect(record.body).toBe('hello');
        expect(record.outputKind).toBe('free-text');
        expect(record.winningScope).toBe(SCOPE);
        expect(record.trace).toBeDefined();
        expect(record.error).toBeUndefined();
      }
    });

    test('resolve() failure fires a failure record carrying error-only (no trace/body)', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib([freeTextRecord()], { observers: [store] });
      const result = await lib.resolve({
        id: 'missing' as unknown as PromptId,
        chain: [SCOPE],
        qualifiers: {}
      });
      expect(result).toFail();
      const records = store.query();
      expect(records).toHaveLength(1);
      const [record] = records;
      expect(record.outcome).toBe('failure');
      if (record.phase === 'resolve') {
        expect(record.error).toMatch(/no record found/i);
        expect(record.body).toBeUndefined();
        expect(record.trace).toBeUndefined();
        expect(record.winningScope).toBeUndefined();
      }
    });

    test('resolveFreeTextOutput fires a resolve record + a cross-linked output record', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib([freeTextRecord()], { observers: [store] });
      expect(
        await lib.resolveFreeTextOutput({ id: PROMPT, chain: [SCOPE], qualifiers: {} }, 'raw output')
      ).toSucceedWith('raw output');
      const records = store.query();
      expect(records.map((r) => r.phase)).toEqual(['resolve', 'free-text-output']);
      const [resolveRecord, outputRecord] = records;
      expect(outputRecord.phase).toBe('free-text-output');
      if (outputRecord.phase === 'free-text-output' || outputRecord.phase === 'json-output') {
        expect(outputRecord.linkedResolveSeq).toBe(resolveRecord.seq);
        expect(outputRecord.rawOutput).toBe('raw output');
        expect(outputRecord.outcome).toBe('success');
      }
    });

    test('resolveJsonOutput fires a resolve record + a cross-linked json-output record', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib([jsonRecord()], { observers: [store], registry: classifierRegistry() });
      const result = await lib.resolveJsonOutput(
        { id: PROMPT, chain: [SCOPE], qualifiers: {} },
        '{"kind":"classifier","label":"spam"}',
        'classifier'
      );
      expect(result).toSucceed();
      const records = store.query();
      expect(records.map((r) => r.phase)).toEqual(['resolve', 'json-output']);
      const outputRecord = records[1];
      if (outputRecord.phase === 'free-text-output' || outputRecord.phase === 'json-output') {
        expect(outputRecord.linkedResolveSeq).toBe(records[0].seq);
        expect(outputRecord.outcome).toBe('success');
      }
    });

    test('a failed output validation records the output observation as a failure', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib([jsonRecord()], { observers: [store], registry: classifierRegistry() });
      const result = await lib.resolveJsonOutput(
        { id: PROMPT, chain: [SCOPE], qualifiers: {} },
        'not json at all',
        'classifier'
      );
      expect(result).toFail();
      const outputRecord = store.query({ phase: 'json-output' })[0];
      expect(outputRecord.outcome).toBe('failure');
      if (outputRecord.phase !== 'resolve') {
        expect(outputRecord.error).toBeDefined();
      }
    });

    test('a resource-binding inner resolve does NOT fire its own observation', async () => {
      const outer: IStoredPromptRecord = {
        scope: SCOPE,
        id: 'outer' as unknown as PromptId,
        descriptor: {
          id: 'outer' as unknown as PromptId,
          title: 'outer',
          schemaVersion: '1',
          surface: 'chat',
          slots: [
            {
              name: 'audience' as unknown as SlotName,
              description: 'audience',
              defaultBinding: {
                kind: 'resource',
                resourceId: 'inner' as unknown as ResourceId,
                directive: 'prose'
              } as SlotBinding
            }
          ],
          output: { kind: 'free-text' }
        },
        candidates: [{ conditions: {}, body: 'Hi, {{{audience}}}!' }]
      };
      const inner = freeTextRecord('inner' as unknown as PromptId, 'everyone');
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib([outer, inner], { observers: [store] });
      const result = await lib.resolve({
        id: 'outer' as unknown as PromptId,
        chain: [SCOPE],
        qualifiers: {}
      });
      expect(result).toSucceedAndSatisfy((r) => {
        expect(r.body).toBe('Hi, everyone!');
      });
      // exactly one record — the inner resolve rolled up under the outer trace.
      const records = store.query();
      expect(records).toHaveLength(1);
      if (records[0].phase === 'resolve') {
        expect(records[0].trace?.resourceBindingResolutions).toHaveLength(1);
      }
    });
  });

  describe('seq + contentHash semantics', () => {
    test('seq is monotonic across calls and shared across observers', async () => {
      const a = PromptObservationStore.create().orThrow();
      const b = PromptObservationStore.create().orThrow();
      const lib = await buildLib([freeTextRecord()], { observers: [a, b] });
      await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: {} });
      await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: {} });
      expect(a.query().map((r) => r.seq)).toEqual([1, 2]);
      // both observers saw the same records with the same seq values.
      expect(b.query().map((r) => r.seq)).toEqual([1, 2]);
      // Both observers received structurally-identical records (same values,
      // same seq across observers). Use the normalizing hash to compare on
      // structural equality without coupling to whether the implementation
      // shares one reference or clones per observer — the public contract is
      // identical values, not identical references.
      const normalizer = new Hash.Crc32Normalizer();
      const hashA = normalizer.computeHash(a.query()[0]).orThrow();
      const hashB = normalizer.computeHash(b.query()[0]).orThrow();
      expect(hashB).toBe(hashA);
    });

    test('the same request produces a stable contentHash; a different request differs', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib([freeTextRecord()], { observers: [store] });
      await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: { lang: 'fr' } });
      await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: { lang: 'fr' } });
      await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: { lang: 'de' } });
      const hashes = store.query().map((r) => r.contentHash);
      expect(hashes[0]).toBe(hashes[1]);
      expect(hashes[0]).not.toBe(hashes[2]);
    });

    test('records caller substitutions on the observation (and in the contentHash)', async () => {
      const withSlot: IStoredPromptRecord = {
        scope: SCOPE,
        id: PROMPT,
        descriptor: {
          id: PROMPT,
          title: 'p',
          schemaVersion: '1',
          surface: 'chat',
          slots: [{ name: 'topic' as unknown as SlotName, description: 'topic' }],
          output: { kind: 'free-text' }
        },
        candidates: [{ conditions: {}, body: 'about {{{topic}}}' }]
      };
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib([withSlot], { observers: [store] });
      const result = await lib.resolve({
        id: PROMPT,
        chain: [SCOPE],
        qualifiers: {},
        substitutions: { topic: 'cats' }
      });
      expect(result).toSucceedAndSatisfy((r) => expect(r.body).toBe('about cats'));
      const [record] = store.query();
      expect(record.phase).toBe('resolve');
      if (record.phase === 'resolve') {
        expect(record.substitutions).toEqual({ topic: 'cats' });
      }
      expect(record.contentHash).not.toBe('');
    });
  });

  describe('observer-error isolation (MultiLogger-shaped)', () => {
    test('a failing or throwing observer never breaks resolve() and is logged; siblings still record', async () => {
      const failing: IPromptObserver = { observe: () => Promise.resolve(fail('observer-said-no')) };
      const throwing: IPromptObserver = {
        observe: () => {
          throw new Error('observer-threw');
        }
      };
      const good = PromptObservationStore.create().orThrow();
      const logger = new Logging.InMemoryLogger('warning');
      const lib = await buildLib([freeTextRecord()], { observers: [failing, throwing, good], logger });
      const result = await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: {} });
      expect(result).toSucceed();
      expect(good.query()).toHaveLength(1);
      expect(logger.logged.join('\n')).toMatch(/observer failed \(swallowed\): observer-said-no/);
      expect(logger.logged.join('\n')).toMatch(/observer threw \(swallowed\): Error: observer-threw/);
    });
  });

  // Fake timers make the awaited-vs-fire-and-forget contract deterministic:
  // resolve()'s settling is gated on the observer's (faked) setTimeout rather
  // than on real wall-clock thresholds (which flake on loaded CI runners).
  describe('OQ-3: awaited default vs fire-and-forget opt-in', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    test('a slow awaited observer blocks resolve() until it completes (awaited is the default)', async () => {
      const slow = new SlowObserver(60);
      const lib = await buildLib([freeTextRecord()], { observers: [slow] });
      jest.useFakeTimers();
      let settled = false;
      const pending = lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: {} }).then((r) => {
        settled = true;
        return r;
      });
      // Drain microtasks (ts-res resolve + fan-out) up to the observer's timer.
      await jest.advanceTimersByTimeAsync(0);
      expect(settled).toBe(false); // resolve() is parked on the observer's 60ms timer
      expect(slow.observed).toHaveLength(0);
      await jest.advanceTimersByTimeAsync(60);
      expect(await pending).toSucceed();
      expect(settled).toBe(true);
      expect(slow.observed).toHaveLength(1);
    });

    test('a fire-and-forget observer does NOT block resolve(); it records after the call returns', async () => {
      const slow = new SlowObserver(60, true);
      const lib = await buildLib([freeTextRecord()], { observers: [slow] });
      jest.useFakeTimers();
      // resolve() does not await the detached observer, so it settles without
      // advancing the observer's timer.
      expect(await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: {} })).toSucceed();
      expect(slow.observed).toHaveLength(0);
      // the detached observer completes once its timer fires.
      await jest.advanceTimersByTimeAsync(60);
      expect(slow.observed).toHaveLength(1);
    });

    test('mixes awaited and fire-and-forget observers in one resolve', async () => {
      const awaited = new SlowObserver(50);
      const detached = new SlowObserver(200, true);
      const lib = await buildLib([freeTextRecord()], { observers: [awaited, detached] });
      jest.useFakeTimers();
      let settled = false;
      const pending = lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: {} }).then((r) => {
        settled = true;
        return r;
      });
      await jest.advanceTimersByTimeAsync(0);
      expect(settled).toBe(false); // parked on the awaited observer's 50ms timer
      await jest.advanceTimersByTimeAsync(50);
      expect(await pending).toSucceed();
      expect(settled).toBe(true);
      expect(awaited.observed).toHaveLength(1);
      // resolve() did NOT wait for the detached observer's 200ms timer.
      expect(detached.observed).toHaveLength(0);
      await jest.advanceTimersByTimeAsync(200);
      expect(detached.observed).toHaveLength(1);
    });
  });

  describe('no observers (additive default)', () => {
    test('resolve works with no observers and produces no records anywhere', async () => {
      const lib = await buildLib([freeTextRecord()]);
      expect(await lib.resolve({ id: PROMPT, chain: [SCOPE], qualifiers: {} })).toSucceedAndSatisfy((r) => {
        expect(r.body).toBe('hello');
      });
    });

    test('resolveFreeTextOutput works with no observers', async () => {
      const lib = await buildLib([freeTextRecord()]);
      expect(
        await lib.resolveFreeTextOutput({ id: PROMPT, chain: [SCOPE], qualifiers: {} }, 'raw')
      ).toSucceedWith('raw');
    });

    test('resolveJsonOutput works with no observers', async () => {
      const lib = await buildLib([jsonRecord()], { registry: classifierRegistry() });
      expect(
        await lib.resolveJsonOutput(
          { id: PROMPT, chain: [SCOPE], qualifiers: {} },
          '{"kind":"classifier","label":"spam"}',
          'classifier'
        )
      ).toSucceed();
    });
  });
});
