// Copyright (c) 2026 Erik Fortune
// SPDX-License-Identifier: MIT

// B-3 cast-pressure regression tests for the typed qualifier-name
// Converter pipeline plus the F2 / F6 round-2 absorbs (`buildSimpleDescriptor`,
// README React-wiring; only the helper-export is exercised here).

import '@fgv/ts-utils-jest';
import {
  FileTreePromptStore,
  IPromptCandidateRecord,
  IPromptDescriptor,
  IPromptStoreFixtureSeed,
  PromptId,
  PromptStoreFixture,
  ScopeKey,
  buildSimpleDescriptor,
  promptFileConverter,
  typedPromptFileConverter
} from '../../index';
import { Converter, Converters } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';

const TEST_SCOPE = 'global' as unknown as ScopeKey;
const TEST_PROMPT = 'greeting' as unknown as PromptId;

describe('B-3 typed qualifier-name converter pipeline', () => {
  describe('buildSimpleDescriptor (F2)', () => {
    test('builds a free-text chat descriptor from minimal input', () => {
      const descriptor: IPromptDescriptor = buildSimpleDescriptor({
        id: TEST_PROMPT,
        title: 'Simple greeting'
      });
      expect(descriptor).toEqual({
        id: TEST_PROMPT,
        title: 'Simple greeting',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'free-text' }
      });
    });

    test('threads an explicit surface override through', () => {
      const descriptor = buildSimpleDescriptor({
        id: TEST_PROMPT,
        title: 'Custom-surface prompt',
        surface: 'completion'
      });
      expect(descriptor.surface).toBe('completion');
      // Output remains free-text — the helper is deliberately limited to
      // the free-text-output shape so a consumer who needs JSON output
      // authors the full IPromptDescriptor and sets `output.converterId`
      // explicitly.
      expect(descriptor.output).toEqual({ kind: 'free-text' });
    });

    test('threads an optional description through', () => {
      const descriptor = buildSimpleDescriptor({
        id: TEST_PROMPT,
        title: 'Documented prompt',
        description: 'Longer-form description for editor surfaces'
      });
      expect(descriptor.description).toBe('Longer-form description for editor surfaces');
    });
  });

  describe('cast-pressure regression (B-3)', () => {
    // The load-bearing test surface: a consumer who supplies a
    // qualifierNameConverter on the store / fixture build gets
    // convert-time rejection of typo'd axis names — not just compile-
    // time discipline on the seed type.
    const validNames = ['tone', 'language'] as const;
    type ValidName = (typeof validNames)[number];
    const qualifierNameConverter: Converter<ValidName> = Converters.enumeratedValue<ValidName>([
      ...validNames
    ]);

    test('typedPromptFileConverter rejects record-form typo at convert time', () => {
      const yaml = {
        id: 'greeting',
        title: 'Greeting',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'free-text' },
        candidates: [{ conditions: { tonr: 'formal' }, body: 'Hi {{{audience}}}' }]
      };
      expect(typedPromptFileConverter(qualifierNameConverter).convert(yaml)).toFailWith(/tonr/);
    });

    test('typedPromptFileConverter rejects array-form typo at convert time', () => {
      const yaml = {
        id: 'greeting',
        title: 'Greeting',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'free-text' },
        candidates: [
          {
            conditions: [{ qualifierName: 'tonr', value: 'formal' }],
            body: 'Hi {{{audience}}}'
          }
        ]
      };
      expect(typedPromptFileConverter(qualifierNameConverter).convert(yaml)).toFailWith(/tonr/);
    });

    test('typedPromptFileConverter accepts valid record-form axis names', () => {
      const yaml = {
        id: 'greeting',
        title: 'Greeting',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'free-text' },
        candidates: [
          { conditions: {}, body: 'base' },
          { conditions: { tone: 'formal' }, isPartial: true, body: 'partial' }
        ]
      };
      expect(typedPromptFileConverter(qualifierNameConverter).convert(yaml)).toSucceedAndSatisfy((c) => {
        // The candidates' conditions threaded through ts-res's typed
        // sibling — the run-time shape is unchanged, but the Converter
        // would have rejected a typo above.
        expect(c.candidates.length).toBe(2);
      });
    });

    test('default promptFileConverter accepts a typo (back-compat baseline)', () => {
      // Documents the baseline: B-3's opt-in adds a teeth path; the
      // default-string converter is permissive by design, exactly as
      // today's untyped consumers behave.
      const yaml = {
        id: 'greeting',
        title: 'Greeting',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'free-text' },
        candidates: [{ conditions: { tonr: 'formal' }, body: 'Hi' }]
      };
      expect(promptFileConverter.convert(yaml)).toSucceed();
    });

    test('FileTreePromptStore.create with qualifierNameConverter rejects a typo at load time', async () => {
      // End-to-end: a YAML file with a typo'd axis name on a typed
      // store fails at load time (store.get rejects), not just on the
      // seed-author's compile.
      const tree = FileTree.inMemory([
        {
          path: `/${TEST_SCOPE}/${TEST_PROMPT}.yaml`,
          contents: [
            "id: 'greeting'",
            "title: 'Greeting'",
            "schemaVersion: '1'",
            "surface: 'chat'",
            'slots: []',
            "output: { kind: 'free-text' }",
            "candidates: [{ conditions: { tonr: 'formal' }, body: 'Hi' }]"
          ].join('\n')
        }
      ]).orThrow();
      const root = tree.getDirectory('/').orThrow();
      const store = (await FileTreePromptStore.create({ root, qualifierNameConverter })).orThrow();
      const got = await store.get(TEST_SCOPE, TEST_PROMPT);
      expect(got).toFailWith(/tonr/);
    });

    test('FileTreePromptStore.create with qualifierNameConverter loads a valid typed YAML', async () => {
      const tree = FileTree.inMemory([
        {
          path: `/${TEST_SCOPE}/${TEST_PROMPT}.yaml`,
          contents: [
            "id: 'greeting'",
            "title: 'Greeting'",
            "schemaVersion: '1'",
            "surface: 'chat'",
            'slots: []',
            "output: { kind: 'free-text' }",
            "candidates: [{ conditions: { tone: 'formal' }, body: 'Hi' }]"
          ].join('\n')
        }
      ]).orThrow();
      const root = tree.getDirectory('/').orThrow();
      const store = (await FileTreePromptStore.create({ root, qualifierNameConverter })).orThrow();
      const got = (await store.get(TEST_SCOPE, TEST_PROMPT)).orThrow();
      expect(got?.candidates[0].body).toBe('Hi');
    });

    test('PromptStoreFixture.build threads qualifierNameConverter through to the loader', async () => {
      // Structurally valid seed (tone is a declared axis) — build
      // succeeds and a subsequent get round-trips through the typed
      // converter without rejection.
      const seed: IPromptStoreFixtureSeed<ValidName> = {
        records: [
          {
            scope: TEST_SCOPE,
            id: TEST_PROMPT,
            descriptor: buildSimpleDescriptor({ id: TEST_PROMPT, title: 'typed-fixture test' }),
            candidates: [
              { conditions: {}, body: 'base' },
              { conditions: { tone: 'formal' }, isPartial: true, body: 'partial' }
            ]
          }
        ],
        qualifierNameConverter
      };
      const store = (await PromptStoreFixture.build(seed)).orThrow();
      const got = (await store.get(TEST_SCOPE, TEST_PROMPT)).orThrow();
      expect(got?.candidates.length).toBe(2);
    });

    test('PromptStoreFixture.build with qualifierNameConverter and a runtime typo in candidate rejects on get', async () => {
      // The seed type at the TypeScript level rejects the typo, but a
      // runtime cast bypasses the compile check — and the convert-time
      // teeth must still catch it. This is the cast-pressure
      // regression test core: the narrow is enforced at the Converter
      // boundary, so escape-hatch consumers cannot smuggle typos in.
      const malformedCandidate = {
        conditions: { tonr: 'formal' },
        body: 'oops'
      } as unknown as IPromptCandidateRecord<ValidName>;
      const seed: IPromptStoreFixtureSeed<ValidName> = {
        records: [
          {
            scope: TEST_SCOPE,
            id: TEST_PROMPT,
            descriptor: buildSimpleDescriptor({ id: TEST_PROMPT, title: 'typo-rejection' }),
            candidates: [malformedCandidate]
          }
        ],
        qualifierNameConverter
      };
      const store = (await PromptStoreFixture.build(seed)).orThrow();
      const got = await store.get(TEST_SCOPE, TEST_PROMPT);
      expect(got).toFailWith(/tonr/);
    });
  });

  describe('compile-time seed-type discipline (B-3)', () => {
    test('a TQualifierNames-narrowed seed compiles for the expected axis keys', () => {
      // Smoke: the type machinery allows the expected key on the
      // record-form conditions. The negative case ('tonr' typo) is
      // verified by the @ts-expect-error block below.
      const seed: IPromptStoreFixtureSeed<'tone'> = {
        records: [
          {
            scope: TEST_SCOPE,
            id: TEST_PROMPT,
            descriptor: buildSimpleDescriptor({ id: TEST_PROMPT, title: 'typed-seed test' }),
            candidates: [
              { conditions: {}, body: 'base' },
              { conditions: { tone: 'formal' }, isPartial: true, body: 'partial' }
            ]
          }
        ]
      };
      expect(seed.records?.length).toBe(1);
    });

    test('a TQualifierNames-narrowed seed rejects a typo at compile time', () => {
      // The @ts-expect-error directive captures B-3's compile-side
      // contract: 'tonr' (instead of 'tone') on the record-form
      // conditions is a compile error when TQualifierNames is
      // narrowed. Convert-time enforcement is verified in the
      // cast-pressure regression block above.
      const seed: IPromptStoreFixtureSeed<'tone'> = {
        records: [
          {
            scope: TEST_SCOPE,
            id: TEST_PROMPT,
            descriptor: buildSimpleDescriptor({ id: TEST_PROMPT, title: 'typo-rejection' }),
            candidates: [
              {
                // @ts-expect-error — 'tonr' is not assignable to 'tone'
                conditions: { tonr: 'formal' },
                body: 'will not compile'
              }
            ]
          }
        ]
      };
      // Runtime shape is unchanged — the seed object still constructs;
      // the contract is purely compile-time on this branch.
      expect(seed.records?.length).toBe(1);
    });

    test('the default TQualifierNames = string compiles arbitrary axis keys', () => {
      // Back-compat: unannotated seeds still accept any string key.
      const seed: IPromptStoreFixtureSeed = {
        records: [
          {
            scope: TEST_SCOPE,
            id: TEST_PROMPT,
            descriptor: buildSimpleDescriptor({ id: TEST_PROMPT, title: 'untyped seed' }),
            candidates: [{ conditions: { arbitrary: 'value' }, body: 'ok' }]
          }
        ]
      };
      expect(seed.records?.length).toBe(1);
    });
  });
});
