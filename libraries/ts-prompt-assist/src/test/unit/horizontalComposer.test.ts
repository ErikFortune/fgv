// Copyright (c) 2026 Erik Fortune
// SPDX-License-Identifier: MIT

import '@fgv/ts-utils-jest';
import {
  HorizontalComposer,
  IComposedPrompt,
  IContributorSpec,
  IPromptDescriptor,
  IPromptResolveTrace,
  IPromptSafetyPolicy,
  IResolvedPrompt,
  IResolvedPromptSlot,
  ILogicalSlotConfig,
  IScreener,
  ISafeguardFinding,
  PromptId,
  ScopeKey,
  SlotDirective,
  SlotName
} from '../../index';
import { succeed } from '@fgv/ts-utils';

const SCOPE = 'global' as unknown as ScopeKey;

function slotName(name: string): SlotName {
  return name as unknown as SlotName;
}
function promptId(id: string): PromptId {
  return id as unknown as PromptId;
}

interface ISlotSeed {
  readonly name: string;
  readonly value: string;
  readonly directive?: SlotDirective;
}

/**
 * Builds a minimal `IResolvedPrompt` whose `slots` map carries the supplied
 * seeds. The composer reads only `resolved.slots`, so the body / descriptor /
 * trace are stubbed to satisfy the type.
 */
function makeResolved(id: string, seeds: ReadonlyArray<ISlotSeed>): IResolvedPrompt {
  const slots = new Map<SlotName, IResolvedPromptSlot>();
  for (const seed of seeds) {
    const name = slotName(seed.name);
    slots.set(name, {
      name,
      value: seed.value,
      directive: seed.directive ?? 'prose',
      source: 'binding',
      wasEnforced: false
    });
  }
  const trace: IPromptResolveTrace = {
    winningScope: SCOPE,
    scopesConsulted: [SCOPE],
    mergedBindings: new Map(),
    resourceBindingResolutions: [],
    safeguardFindings: [],
    candidateMatches: []
  };
  return {
    id: promptId(id),
    body: '',
    descriptor: descriptor(id, []),
    trace,
    slots
  };
}

function contributor(provenance: number, id: string, seeds: ReadonlyArray<ISlotSeed>): IContributorSpec {
  return { provenance, resolved: makeResolved(id, seeds) };
}

interface IComposedSlotSeed {
  readonly name: string;
  readonly maxLength?: number;
  readonly allowedDirectives?: ReadonlyArray<SlotDirective>;
}

function descriptor(id: string, slots: ReadonlyArray<IComposedSlotSeed>): IPromptDescriptor {
  return {
    id: promptId(id),
    title: `composed ${id}`,
    schemaVersion: '1',
    surface: 'chat',
    slots: slots.map((s) => ({
      name: slotName(s.name),
      description: s.name,
      ...(s.maxLength !== undefined ? { maxLength: s.maxLength } : {}),
      ...(s.allowedDirectives !== undefined ? { allowedDirectives: s.allowedDirectives } : {})
    })),
    output: { kind: 'free-text' }
  };
}

function logical(
  logicalSlotName: string,
  strategy: ILogicalSlotConfig['strategy'],
  refs: ReadonlyArray<{ readonly provenance: number; readonly slot: string }>,
  separator?: string
): ILogicalSlotConfig {
  return {
    logicalSlotName: slotName(logicalSlotName),
    contributorSlots: refs.map((r) => ({
      contributorProvenance: r.provenance,
      slotName: slotName(r.slot)
    })),
    strategy,
    ...(separator !== undefined ? { separator } : {})
  };
}

describe('HorizontalComposer', () => {
  describe('create (build-time validation)', () => {
    test('succeeds with a well-formed map', () => {
      const params = {
        contributors: [contributor(10, 'a', [{ name: 'intro', value: 'hi' }])],
        logicalSlots: [logical('body', 'concatenate', [{ provenance: 10, slot: 'intro' }])],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      };
      expect(HorizontalComposer.create(params)).toSucceed();
    });

    test('fails on duplicate contributor provenance', () => {
      const params = {
        contributors: [
          contributor(5, 'a', [{ name: 'x', value: '1' }]),
          contributor(5, 'b', [{ name: 'y', value: '2' }])
        ],
        logicalSlots: [],
        composedDescriptor: descriptor('comp', []),
        composedBody: ''
      };
      expect(HorizontalComposer.create(params)).toFailWith(/duplicate contributor provenance 5/i);
    });

    test('fails on a duplicate logical slot name', () => {
      const params = {
        contributors: [contributor(10, 'a', [{ name: 'intro', value: 'hi' }])],
        logicalSlots: [
          logical('body', 'concatenate', [{ provenance: 10, slot: 'intro' }]),
          logical('body', 'overwrite', [{ provenance: 10, slot: 'intro' }])
        ],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      };
      expect(HorizontalComposer.create(params)).toFailWith(/duplicate logical slot 'body'/i);
    });

    test('fails when a logical slot is not declared in the composed descriptor', () => {
      const params = {
        contributors: [contributor(10, 'a', [{ name: 'intro', value: 'hi' }])],
        logicalSlots: [logical('body', 'concatenate', [{ provenance: 10, slot: 'intro' }])],
        composedDescriptor: descriptor('comp', [{ name: 'other' }]),
        composedBody: '{{other}}'
      };
      expect(HorizontalComposer.create(params)).toFailWith(
        /logical slot 'body' is not declared in the composed descriptor's slots/i
      );
    });

    test('fails when a logical slot references a missing contributor provenance', () => {
      const params = {
        contributors: [contributor(10, 'a', [{ name: 'intro', value: 'hi' }])],
        logicalSlots: [logical('body', 'concatenate', [{ provenance: 99, slot: 'intro' }])],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      };
      expect(HorizontalComposer.create(params)).toFailWith(
        /logical slot 'body' references contributor provenance 99/i
      );
    });

    test('fails when a logical slot references an unknown contributor slot', () => {
      const params = {
        contributors: [contributor(10, 'a', [{ name: 'intro', value: 'hi' }])],
        logicalSlots: [logical('body', 'concatenate', [{ provenance: 10, slot: 'nope' }])],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      };
      expect(HorizontalComposer.create(params)).toFailWith(
        /references slot 'nope' on contributor provenance 10, which has no such resolved slot/i
      );
    });
  });

  describe('compose (directive-aware merge)', () => {
    function composeOrThrow(
      params: Parameters<typeof HorizontalComposer.create>[0]
    ): Promise<IComposedPrompt> {
      return HorizontalComposer.create(params)
        .orThrow()
        .compose()
        .then((r) => r.orThrow());
    }

    test('concatenate joins non-constraints in ascending provenance with default separator', async () => {
      const params = {
        contributors: [
          contributor(20, 'b', [{ name: 's', value: 'second', directive: 'hint' as SlotDirective }]),
          contributor(10, 'a', [{ name: 's', value: 'first', directive: 'hint' as SlotDirective }])
        ],
        logicalSlots: [
          logical('body', 'concatenate', [
            { provenance: 20, slot: 's' },
            { provenance: 10, slot: 's' }
          ])
        ],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      };
      const composed = await composeOrThrow(params);
      expect(composed.body).toBe('first\n\nsecond');
      expect(composed.mergedSlots.get(slotName('body'))?.directive).toBe('hint');
      // provenanceTrace accuracy: all contributions, provenance-ascending.
      expect(composed.provenanceTrace.get(slotName('body'))).toEqual([
        { provenance: 10, contributorSlotName: slotName('s'), value: 'first', directive: 'hint' },
        { provenance: 20, contributorSlotName: slotName('s'), value: 'second', directive: 'hint' }
      ]);
    });

    test('concatenate honors a per-slot separator override', async () => {
      const params = {
        contributors: [
          contributor(10, 'a', [{ name: 's', value: 'A', directive: 'prose' as SlotDirective }]),
          contributor(20, 'b', [{ name: 's', value: 'B', directive: 'prose' as SlotDirective }])
        ],
        logicalSlots: [
          logical(
            'body',
            'concatenate',
            [
              { provenance: 10, slot: 's' },
              { provenance: 20, slot: 's' }
            ],
            ' | '
          )
        ],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      };
      const composed = await composeOrThrow(params);
      expect(composed.body).toBe('A | B');
    });

    test('overwrite keeps only the highest-provenance non-constraint', async () => {
      const params = {
        contributors: [
          contributor(10, 'a', [{ name: 's', value: 'low', directive: 'hint' as SlotDirective }]),
          contributor(30, 'c', [{ name: 's', value: 'high', directive: 'hint' as SlotDirective }]),
          contributor(20, 'b', [{ name: 's', value: 'mid', directive: 'hint' as SlotDirective }])
        ],
        logicalSlots: [
          logical('body', 'overwrite', [
            { provenance: 10, slot: 's' },
            { provenance: 30, slot: 's' },
            { provenance: 20, slot: 's' }
          ])
        ],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      };
      const composed = await composeOrThrow(params);
      expect(composed.body).toBe('high');
      const trace = composed.provenanceTrace.get(slotName('body'));
      expect(trace?.length).toBe(1);
      expect(trace?.[0]).toEqual({
        provenance: 30,
        contributorSlotName: slotName('s'),
        value: 'high',
        directive: 'hint'
      });
    });

    test('constraints concatenate first (ascending) and survive under concatenate, then the hint', async () => {
      const params = {
        contributors: [
          contributor(10, 'a', [{ name: 's', value: 'C1', directive: 'constraint' as SlotDirective }]),
          contributor(20, 'b', [{ name: 's', value: 'C2', directive: 'constraint' as SlotDirective }]),
          contributor(30, 'c', [{ name: 's', value: 'hint!', directive: 'hint' as SlotDirective }])
        ],
        logicalSlots: [
          logical('body', 'concatenate', [
            { provenance: 30, slot: 's' },
            { provenance: 10, slot: 's' },
            { provenance: 20, slot: 's' }
          ])
        ],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      };
      const composed = await composeOrThrow(params);
      expect(composed.body).toBe('C1\n\nC2\n\nhint!');
      expect(composed.mergedSlots.get(slotName('body'))?.directive).toBe('constraint');
    });

    test('constraint survives even under overwrite (prepended before the winning hint)', async () => {
      const params = {
        contributors: [
          contributor(10, 'a', [{ name: 's', value: 'CON', directive: 'constraint' as SlotDirective }]),
          contributor(20, 'b', [{ name: 's', value: 'lowHint', directive: 'hint' as SlotDirective }]),
          contributor(40, 'd', [{ name: 's', value: 'topHint', directive: 'hint' as SlotDirective }])
        ],
        logicalSlots: [
          logical('body', 'overwrite', [
            { provenance: 10, slot: 's' },
            { provenance: 20, slot: 's' },
            { provenance: 40, slot: 's' }
          ])
        ],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      };
      const composed = await composeOrThrow(params);
      // Constraint never dropped; only the highest-provenance non-constraint survives.
      expect(composed.body).toBe('CON\n\ntopHint');
      const trace = composed.provenanceTrace.get(slotName('body'));
      expect(trace?.map((e) => e.value)).toEqual(['CON', 'topHint']);
      // A constraint anywhere dominates the merged framing directive.
      expect(composed.mergedSlots.get(slotName('body'))?.directive).toBe('constraint');
    });

    test('overwrite with only constraints keeps every constraint', async () => {
      const params = {
        contributors: [
          contributor(10, 'a', [{ name: 's', value: 'C1', directive: 'constraint' as SlotDirective }]),
          contributor(20, 'b', [{ name: 's', value: 'C2', directive: 'constraint' as SlotDirective }])
        ],
        logicalSlots: [
          logical('body', 'overwrite', [
            { provenance: 10, slot: 's' },
            { provenance: 20, slot: 's' }
          ])
        ],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      };
      const composed = await composeOrThrow(params);
      expect(composed.body).toBe('C1\n\nC2');
    });

    test('reordering contributor provenance reorders the concatenated output', async () => {
      const make = (p1: number, p2: number): Parameters<typeof HorizontalComposer.create>[0] => ({
        contributors: [
          contributor(p1, 'a', [{ name: 's', value: 'alpha', directive: 'prose' as SlotDirective }]),
          contributor(p2, 'b', [{ name: 's', value: 'beta', directive: 'prose' as SlotDirective }])
        ],
        logicalSlots: [
          logical('body', 'concatenate', [
            { provenance: p1, slot: 's' },
            { provenance: p2, slot: 's' }
          ])
        ],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}'
      });
      expect((await composeOrThrow(make(10, 20))).body).toBe('alpha\n\nbeta');
      expect((await composeOrThrow(make(20, 10))).body).toBe('beta\n\nalpha');
    });

    test('renders a multi-slot composed body template', async () => {
      const params = {
        contributors: [
          contributor(10, 'a', [
            { name: 'greeting', value: 'Hello', directive: 'prose' as SlotDirective },
            { name: 'rule', value: 'Be terse', directive: 'constraint' as SlotDirective }
          ])
        ],
        logicalSlots: [
          logical('intro', 'concatenate', [{ provenance: 10, slot: 'greeting' }]),
          logical('rules', 'concatenate', [{ provenance: 10, slot: 'rule' }])
        ],
        composedDescriptor: descriptor('comp', [{ name: 'intro' }, { name: 'rules' }]),
        composedBody: '{{intro}}\n---\n{{rules}}'
      };
      const composed = await composeOrThrow(params);
      expect(composed.body).toBe('Hello\n---\nBe terse');
      expect(composed.descriptor.id).toBe(promptId('comp'));
    });

    test('a logical slot with no contributions resolves to an empty value', async () => {
      const params = {
        contributors: [contributor(10, 'a', [{ name: 'greeting', value: 'Hi' }])],
        logicalSlots: [
          logical('intro', 'concatenate', [{ provenance: 10, slot: 'greeting' }]),
          logical('empty', 'concatenate', [])
        ],
        composedDescriptor: descriptor('comp', [{ name: 'intro' }, { name: 'empty' }]),
        composedBody: '{{intro}}[{{empty}}]'
      };
      const composed = await composeOrThrow(params);
      expect(composed.body).toBe('Hi[]');
      const emptySlot = composed.mergedSlots.get(slotName('empty'));
      expect(emptySlot?.value).toBe('');
      expect(emptySlot?.source).toBe('empty');
      expect(composed.provenanceTrace.get(slotName('empty'))).toEqual([]);
    });
  });

  describe('compose (safeguard boundary)', () => {
    test('rejects when a merged value exceeds the composed slot maxLength', async () => {
      const params = {
        contributors: [
          contributor(10, 'a', [{ name: 's', value: 'aaaa', directive: 'prose' as SlotDirective }]),
          contributor(20, 'b', [{ name: 's', value: 'bbbb', directive: 'prose' as SlotDirective }])
        ],
        logicalSlots: [
          logical('body', 'concatenate', [
            { provenance: 10, slot: 's' },
            { provenance: 20, slot: 's' }
          ])
        ],
        composedDescriptor: descriptor('comp', [{ name: 'body', maxLength: 5 }]),
        composedBody: '{{body}}'
      };
      const composed = await HorizontalComposer.create(params).orThrow().compose();
      expect(composed).toFailWith(/slot 'body' exceeds maxLength 5/i);
    });

    test('rejects when a contribution directive is not permitted by the composed slot', async () => {
      const params = {
        contributors: [contributor(10, 'a', [{ name: 's', value: 'x', directive: 'hint' as SlotDirective }])],
        logicalSlots: [logical('body', 'concatenate', [{ provenance: 10, slot: 's' }])],
        composedDescriptor: descriptor('comp', [
          { name: 'body', allowedDirectives: ['constraint', 'prose'] }
        ]),
        composedBody: '{{body}}'
      };
      const composed = await HorizontalComposer.create(params).orThrow().compose();
      expect(composed).toFailWith(/directive 'hint', not permitted by allowedDirectives/i);
    });

    test('permits a contribution directive that is in allowedDirectives', async () => {
      const params = {
        contributors: [contributor(10, 'a', [{ name: 's', value: 'x', directive: 'hint' as SlotDirective }])],
        logicalSlots: [logical('body', 'concatenate', [{ provenance: 10, slot: 's' }])],
        composedDescriptor: descriptor('comp', [{ name: 'body', allowedDirectives: ['hint', 'prose'] }]),
        composedBody: '{{body}}'
      };
      expect(await HorizontalComposer.create(params).orThrow().compose()).toSucceed();
    });

    test('ignores allowedDirectives on a composed slot that has no logical-slot config', async () => {
      // 'extra' carries allowedDirectives but no logical slot contributes to it
      // (and the body does not reference it), so the directive check has no
      // entries to screen for it and compose succeeds.
      const params = {
        contributors: [
          contributor(10, 'a', [{ name: 's', value: 'x', directive: 'prose' as SlotDirective }])
        ],
        logicalSlots: [logical('body', 'concatenate', [{ provenance: 10, slot: 's' }])],
        composedDescriptor: descriptor('comp', [
          { name: 'body' },
          { name: 'extra', allowedDirectives: ['constraint'] }
        ]),
        composedBody: '{{body}}'
      };
      expect(await HorizontalComposer.create(params).orThrow().compose()).toSucceed();
    });

    test('a maxLength on a composed slot with no logical-slot config does not falsely reject', async () => {
      // 'extra' carries maxLength: 1 but no logical slot contributes to it, so
      // applySafeguards finds no merged entry for it and skips the length cap.
      const params = {
        contributors: [
          contributor(10, 'a', [{ name: 's', value: 'hello', directive: 'prose' as SlotDirective }])
        ],
        logicalSlots: [logical('body', 'concatenate', [{ provenance: 10, slot: 's' }])],
        composedDescriptor: descriptor('comp', [{ name: 'body' }, { name: 'extra', maxLength: 1 }]),
        composedBody: '{{body}}'
      };
      expect(await HorizontalComposer.create(params).orThrow().compose()).toSucceed();
    });

    test('a reject-disposition screener fails compose', async () => {
      const rejectScreener: IScreener = {
        name: 'reject-all',
        screen: async () =>
          succeed<ReadonlyArray<ISafeguardFinding>>([
            { slot: slotName('body'), kind: 'suspicious-pattern', disposition: 'reject', detail: 'nope' }
          ])
      };
      const policy: IPromptSafetyPolicy = { screeners: [rejectScreener] };
      const params = {
        contributors: [
          contributor(10, 'a', [{ name: 's', value: 'x', directive: 'prose' as SlotDirective }])
        ],
        logicalSlots: [logical('body', 'concatenate', [{ provenance: 10, slot: 's' }])],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}',
        safetyPolicy: policy
      };
      const composed = await HorizontalComposer.create(params).orThrow().compose();
      expect(composed).toFailWith(/screener 'reject-all' rejected/i);
    });

    test('a warn-disposition screener surfaces a finding on the trace without failing', async () => {
      const warnScreener: IScreener = {
        name: 'warn-once',
        screen: async () =>
          succeed<ReadonlyArray<ISafeguardFinding>>([
            { slot: slotName('body'), kind: 'suspicious-pattern', disposition: 'warn', detail: 'heads up' }
          ])
      };
      const policy: IPromptSafetyPolicy = { screeners: [warnScreener] };
      const params = {
        contributors: [
          contributor(10, 'a', [{ name: 's', value: 'x', directive: 'prose' as SlotDirective }])
        ],
        logicalSlots: [logical('body', 'concatenate', [{ provenance: 10, slot: 's' }])],
        composedDescriptor: descriptor('comp', [{ name: 'body' }]),
        composedBody: '{{body}}',
        safetyPolicy: policy
      };
      const composed = await HorizontalComposer.create(params).orThrow().compose();
      expect(composed).toSucceedAndSatisfy((value: IComposedPrompt) => {
        expect(value.safeguardFindings).toHaveLength(1);
        expect(value.safeguardFindings[0]).toMatchObject({
          slot: slotName('body'),
          disposition: 'warn',
          screener: 'warn-once'
        });
      });
    });
  });

  describe('compose (render failures)', () => {
    test('fails when the composed body references an undeclared slot', async () => {
      const params = {
        contributors: [contributor(10, 'a', [{ name: 'greeting', value: 'Hi' }])],
        logicalSlots: [logical('intro', 'concatenate', [{ provenance: 10, slot: 'greeting' }])],
        composedDescriptor: descriptor('comp', [{ name: 'intro' }]),
        composedBody: '{{intro}} {{missing}}'
      };
      const composed = await HorizontalComposer.create(params).orThrow().compose();
      expect(composed).toFailWith(/Missing required variables: missing/i);
    });
  });
});
