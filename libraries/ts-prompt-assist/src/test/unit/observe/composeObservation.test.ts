// Copyright (c) 2026 Erik Fortune
// SPDX-License-Identifier: MIT

import '@fgv/ts-utils-jest';
import {
  HorizontalComposer,
  IContributorSpec,
  IHorizontalComposeParams,
  ILogicalSlotConfig,
  IPromptComposeObservation,
  IPromptDescriptor,
  IPromptObservationRecord,
  IPromptObserver,
  IPromptSafetyPolicy,
  IPromptStore,
  IPromptStoreFixtureSeed,
  IResolvedPrompt,
  ISafeguardFinding,
  IScreener,
  IStoredPromptRecord,
  PromptId,
  PromptLibrary,
  PromptObservationStore,
  PromptStoreFixture,
  ScopeKey,
  SlotBinding,
  SlotName
} from '../../../index';
import { Logging, Result, fail, succeed } from '@fgv/ts-utils';
import { QualifierTypes, Qualifiers } from '@fgv/ts-res';

const QUALIFIER_TYPES = QualifierTypes.QualifierTypeCollector.create({
  qualifierTypes: [QualifierTypes.LiteralQualifierType.create({ name: 'lang' }).orThrow()]
}).orThrow();
const QUALIFIERS = Qualifiers.QualifierCollector.create({
  qualifierTypes: QUALIFIER_TYPES,
  qualifiers: [{ name: 'lang', typeName: 'lang', defaultPriority: 1000 }]
}).orThrow();

const SCOPE = 'global' as unknown as ScopeKey;

function promptId(id: string): PromptId {
  return id as unknown as PromptId;
}
function slotName(name: string): SlotName {
  return name as unknown as SlotName;
}

/**
 * A stored prompt with a single slot bound to a literal value. Resolving it
 * yields an `IResolvedPrompt` whose `slots` map carries the value — the input
 * a horizontal-composition contributor is built from.
 */
function contributorRecord(id: string, slot: string, value: string): IStoredPromptRecord {
  return {
    scope: SCOPE,
    id: promptId(id),
    descriptor: {
      id: promptId(id),
      title: id,
      schemaVersion: '1',
      surface: 'chat',
      slots: [
        {
          name: slotName(slot),
          description: slot,
          defaultBinding: { kind: 'literal', value, directive: 'hint' } as SlotBinding
        }
      ],
      output: { kind: 'free-text' }
    },
    candidates: [{ conditions: {}, body: `{{{${slot}}}}` }]
  };
}

function composedDescriptor(slots: ReadonlyArray<{ name: string; maxLength?: number }>): IPromptDescriptor {
  return {
    id: promptId('composed'),
    title: 'composed',
    schemaVersion: '1',
    surface: 'chat',
    slots: slots.map((s) => ({
      name: slotName(s.name),
      description: s.name,
      ...(s.maxLength !== undefined ? { maxLength: s.maxLength } : {})
    })),
    output: { kind: 'free-text' }
  };
}

const CONTRIBUTORS: ReadonlyArray<IStoredPromptRecord> = [
  contributorRecord('a', 'sA', 'alpha'),
  contributorRecord('b', 'sB', 'beta')
];

async function buildStore(seed: IPromptStoreFixtureSeed): Promise<IPromptStore> {
  return (await PromptStoreFixture.build(seed)).orThrow();
}

async function buildLib(options?: {
  readonly observers?: ReadonlyArray<IPromptObserver>;
  readonly logger?: Logging.ILogger;
}): Promise<PromptLibrary> {
  const store = await buildStore({ records: [...CONTRIBUTORS] });
  return (
    await PromptLibrary.create({
      store,
      qualifiers: QUALIFIERS,
      observers: options?.observers,
      logger: options?.logger
    })
  ).orThrow();
}

async function resolveContributor(lib: PromptLibrary, id: string): Promise<IResolvedPrompt> {
  return (await lib.resolve({ id: promptId(id), chain: [SCOPE], qualifiers: {} })).orThrow();
}

/**
 * Resolves contributors `a` and `b` off `lib` (firing their `'resolve'`
 * observations) and returns two `IContributorSpec`s tagged provenance 10 / 20.
 */
async function twoContributors(lib: PromptLibrary): Promise<ReadonlyArray<IContributorSpec>> {
  const a = await resolveContributor(lib, 'a');
  const b = await resolveContributor(lib, 'b');
  return [
    { provenance: 10, resolved: a },
    { provenance: 20, resolved: b }
  ];
}

const BODY_SLOT: ILogicalSlotConfig = {
  logicalSlotName: slotName('body'),
  contributorSlots: [
    { contributorProvenance: 10, slotName: slotName('sA') },
    { contributorProvenance: 20, slotName: slotName('sB') }
  ],
  strategy: 'concatenate'
};

function composeParams(
  lib: PromptLibrary,
  contributors: ReadonlyArray<IContributorSpec>,
  overrides?: {
    readonly withSeam?: boolean;
    readonly maxLength?: number;
    readonly safetyPolicy?: IPromptSafetyPolicy;
  }
): IHorizontalComposeParams {
  return {
    contributors,
    logicalSlots: [BODY_SLOT],
    composedDescriptor: composedDescriptor([{ name: 'body', maxLength: overrides?.maxLength }]),
    composedBody: '{{body}}',
    ...(overrides?.safetyPolicy !== undefined ? { safetyPolicy: overrides.safetyPolicy } : {}),
    ...(overrides?.withSeam !== false ? { observation: lib.observationSeam } : {})
  };
}

async function compose(params: IHorizontalComposeParams): Promise<Result<unknown>> {
  return HorizontalComposer.create(params).orThrow().compose();
}

function composeRecords(store: PromptObservationStore): ReadonlyArray<IPromptComposeObservation> {
  return store
    .query({ phase: 'compose' })
    .filter((r): r is IPromptComposeObservation => r.phase === 'compose');
}

describe('HorizontalComposer compose observation', () => {
  describe('seam present', () => {
    test('emits one compose record sharing the library seq space', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib({ observers: [store] });
      const contributors = await twoContributors(lib);
      // Two resolve records so far, seq 1 and 2.
      expect(store.query({ phase: 'resolve' }).map((r) => r.seq)).toEqual([1, 2]);

      const result = await compose(composeParams(lib, contributors));
      expect(result).toSucceed();

      const composed = composeRecords(store);
      expect(composed).toHaveLength(1);
      const [record] = composed;
      // seq continues the same authority the resolve records drew from.
      expect(record.seq).toBe(3);
      expect(store.lastSeq).toBe(3);
      expect(record.phase).toBe('compose');
      expect(record.outcome).toBe('success');
      expect(record.promptId).toBe(promptId('composed'));
      expect(record.chain).toEqual([]);
      expect(record.contentHash).not.toBe('');
      expect(record.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('nests each contributor resolve trace in declared order', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib({ observers: [store] });
      const contributors = await twoContributors(lib);
      expect(await compose(composeParams(lib, contributors))).toSucceed();

      const [record] = composeRecords(store);
      expect(record.contributors).toHaveLength(2);
      expect(record.contributors.map((c) => c.provenance)).toEqual([10, 20]);
      expect(record.contributors.map((c) => c.promptId)).toEqual([promptId('a'), promptId('b')]);
      // The nested trace is the contributor's own full resolve trace.
      expect(record.contributors[0].trace).toBe(contributors[0].resolved.trace);
      expect(record.contributors[0].trace.winningScope).toBe(SCOPE);
      expect(record.contributors[1].trace).toBe(contributors[1].resolved.trace);
    });

    test('carries the merged provenance trace and safeguard findings on success', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib({ observers: [store] });
      const contributors = await twoContributors(lib);
      expect(await compose(composeParams(lib, contributors))).toSucceed();

      const [record] = composeRecords(store);
      expect(record.provenanceTrace).toBeDefined();
      expect(record.provenanceTrace?.get(slotName('body'))?.map((e) => e.value)).toEqual(['alpha', 'beta']);
      expect(record.safeguardFindings).toEqual([]);
      expect(record.error).toBeUndefined();
    });

    test('stores a distinct compose record per compose but a stable contentHash for identical inputs', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib({ observers: [store] });
      const contributors = await twoContributors(lib);
      expect(await compose(composeParams(lib, contributors))).toSucceed();
      expect(await compose(composeParams(lib, contributors))).toSucceed();

      const composed = composeRecords(store);
      expect(composed).toHaveLength(2);
      expect(composed[0].seq).toBe(3);
      expect(composed[1].seq).toBe(4);
      // Same composed id + same contributor (provenance, promptId) set → same hash.
      expect(composed[0].contentHash).toBe(composed[1].contentHash);
    });

    test('records a failure outcome with error and no success-only fields', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib({ observers: [store] });
      const contributors = await twoContributors(lib);
      // maxLength 3 rejects the merged 'alpha\n\nbeta' value.
      const result = await compose(composeParams(lib, contributors, { maxLength: 3 }));
      expect(result).toFailWith(/max/i);

      const [record] = composeRecords(store);
      expect(record.outcome).toBe('failure');
      expect(record.error).toMatch(/max/i);
      expect(record.provenanceTrace).toBeUndefined();
      expect(record.safeguardFindings).toBeUndefined();
      // Contributors (inputs) are present even on failure.
      expect(record.contributors.map((c) => c.provenance)).toEqual([10, 20]);
    });

    test('surfaces compose-level warn findings queryable on the store', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib({ observers: [store] });
      const contributors = await twoContributors(lib);
      const warnScreener: IScreener = {
        name: 'warn-once',
        screen: async () =>
          succeed<ReadonlyArray<ISafeguardFinding>>([
            { slot: slotName('body'), kind: 'suspicious-pattern', disposition: 'warn', detail: 'heads up' }
          ])
      };
      const safetyPolicy: IPromptSafetyPolicy = { screeners: [warnScreener] };
      expect(await compose(composeParams(lib, contributors, { safetyPolicy }))).toSucceed();

      const [record] = composeRecords(store);
      expect(record.safeguardFindings?.length).toBeGreaterThan(0);
      expect(record.safeguardFindings?.every((f) => f.disposition === 'warn')).toBe(true);
      // The store's safeguard filters see compose records.
      expect(store.query({ phase: 'compose', hasSafeguardFindings: true })).toHaveLength(1);
      expect(store.query({ phase: 'compose', safeguardDisposition: 'warn' })).toHaveLength(1);
      expect(store.query({ phase: 'compose', safeguardDisposition: 'reject' })).toHaveLength(0);
    });

    test('a compose record does not match a qualifiers query and hasSafeguardFindings:false', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib({ observers: [store] });
      const contributors = await twoContributors(lib);
      expect(await compose(composeParams(lib, contributors))).toSucceed();

      // No qualifier context on a compose record → excluded, never throws.
      expect(store.query({ phase: 'compose', qualifiers: { lang: 'en' } })).toHaveLength(0);
      // Success compose with no findings is hasSafeguardFindings:false.
      expect(store.query({ phase: 'compose', hasSafeguardFindings: false })).toHaveLength(1);
      expect(store.query({ phase: 'compose', hasSafeguardFindings: true })).toHaveLength(0);
    });

    test('an observer error never breaks compose', async () => {
      const store = PromptObservationStore.create().orThrow();
      const logger = new Logging.InMemoryLogger('warning');
      const failing: IPromptObserver = { observe: () => Promise.resolve(fail('nope')) };
      const throwing: IPromptObserver = {
        observe: () => {
          throw new Error('boom');
        }
      };
      const lib = await buildLib({ observers: [failing, throwing, store], logger });
      const contributors = await twoContributors(lib);
      expect(await compose(composeParams(lib, contributors))).toSucceed();

      // The healthy sibling still recorded the compose observation.
      expect(composeRecords(store)).toHaveLength(1);
      expect(logger.logged.join('\n')).toMatch(/observer (failed|threw)/i);
    });

    test('a fire-and-forget observer receives the compose record', async () => {
      const received: IPromptObservationRecord[] = [];
      const observer: IPromptObserver = {
        fireAndForget: true,
        observe: (record) => {
          received.push(record);
          return Promise.resolve(succeed(record));
        }
      };
      const lib = await buildLib({ observers: [observer] });
      const contributors = await twoContributors(lib);
      expect(await compose(composeParams(lib, contributors))).toSucceed();
      // Give the detached dispatch a tick to land.
      await Promise.resolve();
      expect(received.some((r) => r.phase === 'compose')).toBe(true);
    });
  });

  describe('seam absent', () => {
    test('emits no compose record and mints no seq', async () => {
      const store = PromptObservationStore.create().orThrow();
      const lib = await buildLib({ observers: [store] });
      const contributors = await twoContributors(lib);
      expect(store.lastSeq).toBe(2);

      const result = await compose(composeParams(lib, contributors, { withSeam: false }));
      expect(result).toSucceed();

      // No compose record, and the seq authority did not advance.
      expect(composeRecords(store)).toHaveLength(0);
      expect(store.lastSeq).toBe(2);
    });

    test('the seam still works when the library has no observers', async () => {
      const lib = await buildLib();
      const contributors = await twoContributors(lib);
      // seam.observe fans out to zero observers — a no-op — but compose succeeds.
      expect(await compose(composeParams(lib, contributors))).toSucceed();
    });
  });
});
