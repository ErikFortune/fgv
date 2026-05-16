// Copyright (c) 2026 Erik Fortune
// SPDX-License-Identifier: MIT

// Note on `as unknown as BrandedType` in test fixtures: per the repo
// CODING_STANDARDS ("Special Cases → Test Files"), branded-type
// construction in test data may use this pattern. Copilot review on
// PR #362 flagged the repeated casts as a style concern; the casts
// stay because the alternative (`Convert.<brand>.convert(...).orThrow()`)
// adds visual noise to fixture setup without strengthening any contract
// — the brand validators currently only check non-empty (see ids.ts
// brandedString review note).

import '@fgv/ts-utils-jest';
import {
  Convert,
  EnumConvert,
  FileTreePromptStore,
  IPromptCandidateRecord,
  IPromptFileContents,
  IPromptStore,
  IPromptStoreFixtureSeed,
  IQualifiersFileContents,
  IResolvedPrompt,
  IScopeSlotBindingsRecord,
  IStoredPromptRecord,
  MustacheTemplateCache,
  PromptId,
  PromptLibrary,
  PromptRegistry,
  PromptStoreFixture,
  ScopeKey,
  SlotName,
  SlotBinding,
  allOutputContractKindValues,
  allPromptStoreEventKindValues,
  allResourceSubstitutionModeValues,
  allSlotBindingKindValues,
  allSlotDirectiveValues,
  allSlotWritabilityValues,
  bindingsFileConverter,
  buildBindingsRecord,
  buildStoredPromptRecord,
  defaultScopeDecoding,
  defaultScopeEncoding,
  descriptorConverter,
  joinBodies,
  mergeBindings,
  promptFileConverter,
  promptSubstitutionsConverter,
  qualifiersFileConverter,
  scanCandidateBody,
  slotBindingConverter
} from '../../index';
import { ConverterRegistry, OutputValidationRegistry, SlotKindRegistry } from '../../index';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { FileTree } from '@fgv/ts-json-base';
import { QualifierTypes, Qualifiers } from '@fgv/ts-res';

// Test-fixture qualifier collector — covers every axis used by the
// fixtures below. Each axis is a permissive LiteralQualifierType with no
// enumerated-values constraint so arbitrary literal values resolve cleanly.
const TEST_QUALIFIER_TYPES = QualifierTypes.QualifierTypeCollector.create({
  qualifierTypes: [
    QualifierTypes.LiteralQualifierType.create({ name: 'lang' }).orThrow(),
    QualifierTypes.LiteralQualifierType.create({ name: 'tone' }).orThrow(),
    QualifierTypes.LiteralQualifierType.create({ name: 'region' }).orThrow()
  ]
}).orThrow();

const TEST_QUALIFIERS: ReadonlyArray<Qualifiers.IQualifierDecl> = [
  { name: 'lang', typeName: 'lang', defaultPriority: 1000 },
  { name: 'tone', typeName: 'tone', defaultPriority: 500 },
  { name: 'region', typeName: 'region', defaultPriority: 700 }
];

const TEST_QUALIFIER_COLLECTOR = Qualifiers.QualifierCollector.create({
  qualifierTypes: TEST_QUALIFIER_TYPES,
  qualifiers: [...TEST_QUALIFIERS]
}).orThrow();

const TEST_SCOPE = 'global' as unknown as ScopeKey;
const TENANT_SCOPE = 'tenant_acme' as unknown as ScopeKey;
const TEST_PROMPT = 'greeting' as unknown as PromptId;

function buildDescriptor(over?: Partial<IStoredPromptRecord>): IStoredPromptRecord {
  return {
    scope: TEST_SCOPE,
    id: TEST_PROMPT,
    descriptor: {
      id: TEST_PROMPT,
      title: 'Greeting',
      schemaVersion: '1',
      surface: 'chat',
      slots: [
        {
          name: 'audience' as unknown as SlotName,
          description: 'Who to greet'
        }
      ],
      output: { kind: 'free-text' }
    },
    candidates: [
      {
        conditions: {},
        body: 'Hello, {{{audience}}}!'
      }
    ],
    ...(over ?? {})
  };
}

describe('ts-prompt-assist foundation', () => {
  describe('types / enums', () => {
    test('all-foo-values arrays expose every union member', () => {
      expect(allSlotBindingKindValues).toEqual(['literal', 'resource']);
      expect(allSlotDirectiveValues).toEqual(['constraint', 'hint', 'prose']);
      expect(allSlotWritabilityValues).toEqual(['any-scope', 'schema-only', 'system-only']);
      expect(allOutputContractKindValues).toEqual(['free-text', 'json']);
      expect(allResourceSubstitutionModeValues).toEqual(['replace', 'inherit']);
      expect(allPromptStoreEventKindValues).toEqual([
        'descriptor-changed',
        'descriptor-removed',
        'bindings-changed',
        'qualifier-axes-changed'
      ]);
    });

    test('EnumConvert routes valid values', () => {
      expect(EnumConvert.slotBindingKind.convert('literal')).toSucceedWith('literal');
      expect(EnumConvert.slotDirective.convert('hint')).toSucceedWith('hint');
      expect(EnumConvert.slotWritability.convert('system-only')).toSucceedWith('system-only');
      expect(EnumConvert.outputContractKind.convert('json')).toSucceedWith('json');
      expect(EnumConvert.resourceSubstitutionMode.convert('replace')).toSucceedWith('replace');
      expect(EnumConvert.promptStoreEventKind.convert('descriptor-removed')).toSucceedWith(
        'descriptor-removed'
      );
      expect(EnumConvert.slotBindingKind.convert('nope')).toFail();
    });

    test('Convert validates branded scalars', () => {
      expect(Convert.promptId.convert('hello')).toSucceedWith('hello' as unknown as PromptId);
      expect(Convert.promptId.convert('')).toFailWith(/non-empty/);
      expect(Convert.slotName.convert('a')).toSucceedWith('a' as unknown as SlotName);
      expect(Convert.scopeKey.convert('global')).toSucceedWith('global' as unknown as ScopeKey);
    });

    test('Convert.slotName tightens to the Mustache "name" production', () => {
      // Mustache "name" is `[A-Za-z_][A-Za-z0-9_]*` — dot-separated keys
      // are tokenized as section paths, not flat keys.
      expect(Convert.slotName.convert('audience')).toSucceed();
      expect(Convert.slotName.convert('_underscore')).toSucceed();
      expect(Convert.slotName.convert('foo.bar')).toFailWith(/Mustache name/);
      expect(Convert.slotName.convert('1starts-with-digit')).toFailWith(/Mustache name/);
      expect(Convert.slotName.convert('has space')).toFailWith(/Mustache name/);
    });

    test('Convert.promptId rejects the cache-key delimiter "::"', () => {
      // PromptId is used in the `MustacheTemplateCache` key as
      // `${promptId}::${bodyHash}`; rejecting `::` keeps the flat key
      // collision-free.
      expect(Convert.promptId.convert('greet')).toSucceed();
      expect(Convert.promptId.convert('greet::v1')).toFailWith(/must not contain '::'/);
    });

    test('branded scalars reject leading / trailing whitespace and exceed-length input', () => {
      expect(Convert.promptId.convert(' leading')).toFailWith(/whitespace/);
      expect(Convert.promptId.convert('trailing ')).toFailWith(/whitespace/);
      // 257 chars exceeds the 256-char cap on every brand.
      const tooLong = 'a'.repeat(257);
      expect(Convert.promptId.convert(tooLong)).toFailWith(/exceeds maximum length/);
      expect(Convert.resourceId.convert(tooLong)).toFailWith(/exceeds maximum length/);
      expect(Convert.converterId.convert(tooLong)).toFailWith(/exceeds maximum length/);
      expect(Convert.serializerId.convert(tooLong)).toFailWith(/exceeds maximum length/);
      expect(Convert.validatorId.convert(tooLong)).toFailWith(/exceeds maximum length/);
      expect(Convert.axisName.convert(tooLong)).toFailWith(/exceeds maximum length/);
      expect(Convert.scopeKey.convert(tooLong)).toFailWith(/exceeds maximum length/);
    });
  });

  describe('descriptor converter / body scanner', () => {
    test('rejects bodies with double-brace tokens', () => {
      expect(scanCandidateBody('Hi {{name}}!', TEST_PROMPT, 0)).toFailWith(/{{name}}/);
      expect(scanCandidateBody('Hi {{&name}}!', TEST_PROMPT, 0)).toFailWith(/{{&name}}/);
      expect(scanCandidateBody('Hi {{{name}}}!', TEST_PROMPT, 0)).toSucceedWith(true);
    });

    test('rejects mustache parse errors with prompt id', () => {
      // unbalanced delimiters
      expect(scanCandidateBody('Hi {{name', TEST_PROMPT, 0)).toFailWith(/greeting/);
    });

    test('promptFileConverter rejects free-text descriptors that declare outputValidations', () => {
      const yaml = {
        id: 'greeting',
        title: 'Greeting',
        schemaVersion: '1',
        surface: 'chat',
        slots: [{ name: 'a', description: '' }],
        output: { kind: 'free-text' },
        outputValidations: ['v'],
        candidates: [{ conditions: {}, body: 'Hi' }]
      };
      expect(promptFileConverter.convert(yaml)).toFailWith(/free-text descriptors cannot declare/);
    });

    test('promptFileConverter rejects unknown output kinds', () => {
      const yaml = {
        id: 'greeting',
        title: 'Greeting',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'streaming-json' },
        candidates: [{ conditions: {}, body: 'Hi' }]
      };
      expect(promptFileConverter.convert(yaml)).toFailWith(/unknown kind/);
    });

    test('descriptorConverter parses a json output descriptor', () => {
      const descYaml = {
        id: 'g',
        title: 'G',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'json', converterId: 'my-conv' }
      };
      expect(descriptorConverter.convert(descYaml)).toSucceedAndSatisfy((d) => {
        expect(d.output.kind).toBe('json');
      });
    });

    test('promptFileConverter fails on non-object input', () => {
      expect(promptFileConverter.convert('not an object')).toFailWith(/expected an object/);
    });

    test('descriptor output converter rejects non-object', () => {
      const yaml = {
        id: 'g',
        title: 'G',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: 'free-text',
        candidates: []
      };
      expect(promptFileConverter.convert(yaml)).toFail();
    });
  });

  describe('slot binding converters', () => {
    test('literal binding round-trips', () => {
      expect(
        slotBindingConverter.convert({ kind: 'literal', value: 'x', directive: 'prose' })
      ).toSucceedAndSatisfy((b) => {
        expect(b.kind).toBe('literal');
      });
    });

    test('resource binding accepts nested substitutions (recursive)', () => {
      expect(
        slotBindingConverter.convert({
          kind: 'resource',
          resourceId: 'inner',
          directive: 'hint',
          substitutions: {
            x: 'bare-string-sugar',
            y: { kind: 'literal', value: 'v', directive: 'prose' }
          }
        })
      ).toSucceed();
    });

    test('unknown slot binding kind rejected', () => {
      expect(slotBindingConverter.convert({ kind: 'who-knows', value: 'x', directive: 'prose' })).toFailWith(
        /unknown kind/
      );
    });

    test('non-object rejected', () => {
      expect(slotBindingConverter.convert('nope')).toFailWith(/expected an object/);
    });

    test('promptSubstitutionsConverter accepts bare strings and nested bindings', () => {
      expect(
        promptSubstitutionsConverter.convert({
          a: 'bare',
          b: { kind: 'literal', value: 'wrapped', directive: 'hint' }
        })
      ).toSucceedAndSatisfy((subs) => {
        expect(subs.a).toBe('bare');
      });
    });
  });

  describe('bindingsFileConverter / buildBindingsRecord', () => {
    test('parses scoped bindings shape', () => {
      const yaml = {
        bindings: {
          tone: { kind: 'literal', value: 'formal', directive: 'constraint' }
        }
      };
      expect(bindingsFileConverter.convert(yaml)).toSucceedAndSatisfy((contents) => {
        const record = buildBindingsRecord(TEST_SCOPE, contents);
        expect(record.scope).toBe(TEST_SCOPE);
        expect(record.bindings.size).toBe(1);
      });
    });

    test('rejects non-object input', () => {
      expect(bindingsFileConverter.convert('not')).toFailWith(/expected an object/);
    });

    test('rejects missing bindings key', () => {
      expect(bindingsFileConverter.convert({})).toFailWith(/expected an object under key/);
    });

    test('rejects invalid slot name', () => {
      const bindings: Record<string, unknown> = {};
      bindings[''] = { kind: 'literal', value: 'x', directive: 'prose' };
      expect(bindingsFileConverter.convert({ bindings })).toFailWith(/invalid slot name/);
    });

    test('rejects invalid binding shape', () => {
      expect(
        bindingsFileConverter.convert({
          bindings: { slot: { kind: 'literal' /* missing value */ } }
        })
      ).toFailWith(/slot 'slot'/);
    });
  });

  describe('qualifiersFileConverter', () => {
    test('parses ts-res qualifier decls', () => {
      const yaml = {
        qualifiers: [{ name: 'lang', typeName: 'language', defaultPriority: 1000 }]
      };
      expect(qualifiersFileConverter.convert(yaml)).toSucceedAndSatisfy(
        (contents: IQualifiersFileContents) => {
          expect(contents.qualifiers).toHaveLength(1);
        }
      );
    });

    test('rejects non-object', () => {
      expect(qualifiersFileConverter.convert('nope')).toFailWith(/expected an object/);
    });
  });

  describe('scope encoding', () => {
    test('default encoding rejects invalid characters', () => {
      expect(defaultScopeEncoding('a/b' as unknown as ScopeKey)).toFailWith(
        /outside the POSIX portable filename set/
      );
      expect(defaultScopeEncoding('' as unknown as ScopeKey)).toFailWith(/non-empty/);
      expect(defaultScopeEncoding('.hidden' as unknown as ScopeKey)).toFailWith(/may not begin with/);
      expect(defaultScopeEncoding('CON' as unknown as ScopeKey)).toFailWith(/reserved Windows/);
      expect(defaultScopeEncoding('global' as unknown as ScopeKey)).toSucceedWith('global');
    });

    test('default decoding round-trips identity', () => {
      expect(defaultScopeDecoding('tenant_acme')).toSucceedWith('tenant_acme' as unknown as ScopeKey);
      expect(defaultScopeDecoding('a/b')).toFailWith(/outside the POSIX/);
    });
  });

  describe('registries', () => {
    test('PromptRegistry.create produces three sub-registries', () => {
      expect(PromptRegistry.create()).toSucceedAndSatisfy((reg) => {
        expect(reg.converters.has('x' as unknown as import('../../index').ConverterId)).toBe(false);
        expect(reg.slotKinds.has('x')).toBe(false);
        expect(reg.outputValidations.has('y' as unknown as import('../../index').ValidatorId)).toBe(false);
      });
    });

    test('ConverterRegistry: register / get / getKind / has', () => {
      interface ICitedResponse {
        readonly kind: 'cited-response';
        readonly answer: string;
      }
      type Responses = ICitedResponse;
      const conv: Converter<ICitedResponse> = Converters.object<ICitedResponse>({
        kind: Converters.literal<'cited-response'>('cited-response'),
        answer: Converters.string
      });
      expect(ConverterRegistry.create<Responses>()).toSucceedAndSatisfy((reg) => {
        const id = 'cited' as unknown as import('../../index').ConverterId;
        expect(reg.register(id, 'cited-response', conv)).toSucceedWith(id);
        expect(reg.has(id)).toBe(true);
        expect(reg.getKind(id)).toSucceedWith('cited-response');
        expect(reg.get<ICitedResponse>(id)).toSucceedAndSatisfy((c) => {
          expect(c.convert({ kind: 'cited-response', answer: 'a' })).toSucceed();
        });
        // Duplicate registration rejected
        expect(reg.register(id, 'cited-response', conv)).toFailWith(/already registered/);
        // Missing id
        const missing = 'missing' as unknown as import('../../index').ConverterId;
        expect(reg.get(missing)).toFailWith(/not registered/);
        expect(reg.getKind(missing)).toFailWith(/not registered/);
        // Kind-verified overload succeeds when the kind matches and
        // fails with a clear error when it doesn't.
        expect(reg.get<ICitedResponse>(id, 'cited-response')).toSucceed();
      });
    });

    test('ConverterRegistry: kind-verified overload rejects mismatched kind at runtime', () => {
      interface IPlainResponse {
        readonly kind: 'plain';
        readonly text: string;
      }
      interface IAltResponse {
        readonly kind: 'alt';
        readonly text: string;
      }
      type Responses = IPlainResponse | IAltResponse;
      const conv: Converter<IPlainResponse> = Converters.object<IPlainResponse>({
        kind: Converters.literal<'plain'>('plain'),
        text: Converters.string
      });
      expect(ConverterRegistry.create<Responses>()).toSucceedAndSatisfy((reg) => {
        const id = 'plain' as unknown as import('../../index').ConverterId;
        expect(reg.register(id, 'plain', conv)).toSucceed();
        // Asking for the same id under the other union member's kind
        // fails the runtime check.
        expect(reg.get<IAltResponse>(id, 'alt')).toFailWith(
          /registered kind 'plain' does not match requested kind 'alt'/
        );
      });
    });

    test('SlotKindRegistry: register / get / has', () => {
      expect(SlotKindRegistry.create()).toSucceedAndSatisfy((reg) => {
        expect(
          reg.register('', { serialize: (): import('@fgv/ts-utils').Result<string> => succeed('') })
        ).toFailWith(/non-empty/);
        const serializer = { serialize: (): import('@fgv/ts-utils').Result<string> => succeed('s') };
        expect(reg.register('color', serializer)).toSucceedWith('color');
        expect(reg.register('color', serializer)).toFailWith(/already registered/);
        expect(reg.has('color')).toBe(true);
        expect(reg.get('color')).toSucceed();
        expect(reg.get('missing')).toFailWith(/not registered/);
      });
    });

    test('OutputValidationRegistry: register / get / has', () => {
      interface IR {
        readonly kind: 'r';
      }
      expect(OutputValidationRegistry.create<IR>()).toSucceedAndSatisfy((reg) => {
        const id = 'v' as unknown as import('../../index').ValidatorId;
        const validator = {
          appliesTo: 'r' as const,
          validate: (): import('@fgv/ts-utils').Result<true> => succeed(true as const)
        };
        expect(reg.register(id, validator)).toSucceedWith(id);
        expect(reg.register(id, validator)).toFailWith(/already registered/);
        expect(reg.get(id)).toSucceed();
        expect(reg.get('missing' as unknown as import('../../index').ValidatorId)).toFailWith(
          /not registered/
        );
        expect(reg.has(id)).toBe(true);
      });
    });
  });

  describe('MustacheTemplateCache', () => {
    test('rejects non-positive cap', () => {
      expect(MustacheTemplateCache.create(0)).toFailWith(/positive/);
    });

    test('caches parsed templates and evicts on capacity', () => {
      expect(MustacheTemplateCache.create(2)).toSucceedAndSatisfy((cache) => {
        expect(cache.getOrParse(TEST_PROMPT, 'a {{{x}}}')).toSucceed();
        expect(cache.size).toBe(1);
        expect(cache.getOrParse(TEST_PROMPT, 'a {{{x}}}')).toSucceed();
        expect(cache.size).toBe(1);
        expect(cache.getOrParse(TEST_PROMPT, 'b {{{y}}}')).toSucceed();
        expect(cache.size).toBe(2);
        // Adding a third should evict (cap=2)
        expect(cache.getOrParse(TEST_PROMPT, 'c {{{z}}}')).toSucceed();
        expect(cache.size).toBe(2);
      });
    });

    test('surfaces mustache parse errors', () => {
      expect(MustacheTemplateCache.create()).toSucceedAndSatisfy((cache) => {
        expect(cache.getOrParse(TEST_PROMPT, 'unbalanced {{x')).toFail();
      });
    });
  });

  describe('bindingMerger', () => {
    const slots = [{ name: 'audience' as unknown as SlotName, description: 'who' }];

    test('caller substitution can be an explicit SlotBinding', () => {
      const scopeBindings = new Map<ScopeKey, IScopeSlotBindingsRecord>();
      expect(
        mergeBindings([TEST_SCOPE], scopeBindings, slots, {
          audience: { kind: 'literal', value: 'explicit', directive: 'hint' } as SlotBinding
        })
      ).toSucceedAndSatisfy((result) => {
        const entry = result.merged.get('audience' as unknown as SlotName)!;
        expect(entry.directive).toBe('hint');
        expect(entry.value).toBe('explicit');
      });
    });

    test('caller substitution wins over non-enforced binding', () => {
      const scopeBindings = new Map<ScopeKey, IScopeSlotBindingsRecord>([
        [
          TEST_SCOPE,
          {
            scope: TEST_SCOPE,
            bindings: new Map([
              [
                'audience' as unknown as SlotName,
                { kind: 'literal', value: 'world', directive: 'prose' } as SlotBinding
              ]
            ])
          }
        ]
      ]);
      expect(mergeBindings([TEST_SCOPE], scopeBindings, slots, { audience: 'friend' })).toSucceedAndSatisfy(
        (result) => {
          const entry = result.merged.get('audience' as unknown as SlotName)!;
          expect(entry.source).toBe('caller-sub');
          expect(entry.value).toBe('friend');
        }
      );
    });

    test('enforced binding wins and records safeguard finding', () => {
      const scopeBindings = new Map<ScopeKey, IScopeSlotBindingsRecord>([
        [
          TEST_SCOPE,
          {
            scope: TEST_SCOPE,
            bindings: new Map([
              [
                'audience' as unknown as SlotName,
                { kind: 'literal', value: 'global', directive: 'prose', enforced: true } as SlotBinding
              ]
            ])
          }
        ]
      ]);
      expect(mergeBindings([TEST_SCOPE], scopeBindings, slots, { audience: 'friend' })).toSucceedAndSatisfy(
        (result) => {
          expect(result.merged.get('audience' as unknown as SlotName)!.value).toBe('global');
          expect(result.safeguardFindings).toHaveLength(1);
          expect(result.safeguardFindings[0].kind).toBe('enforced-override-ignored');
        }
      );
    });

    test('more-specific scope wins for non-enforced bindings', () => {
      const scopeBindings = new Map<ScopeKey, IScopeSlotBindingsRecord>([
        [
          TENANT_SCOPE,
          {
            scope: TENANT_SCOPE,
            bindings: new Map([
              [
                'audience' as unknown as SlotName,
                { kind: 'literal', value: 'acme', directive: 'prose' } as SlotBinding
              ]
            ])
          }
        ],
        [
          TEST_SCOPE,
          {
            scope: TEST_SCOPE,
            bindings: new Map([
              [
                'audience' as unknown as SlotName,
                { kind: 'literal', value: 'world', directive: 'prose' } as SlotBinding
              ]
            ])
          }
        ]
      ]);
      expect(mergeBindings([TENANT_SCOPE, TEST_SCOPE], scopeBindings, slots, undefined)).toSucceedAndSatisfy(
        (result) => {
          const entry = result.merged.get('audience' as unknown as SlotName)!;
          expect(entry.value).toBe('acme');
          expect(entry.winningScope).toBe(TENANT_SCOPE);
        }
      );
    });

    test('enforced binding at a more-general scope wins over a more-specific scope', () => {
      const scopeBindings = new Map<ScopeKey, IScopeSlotBindingsRecord>([
        [
          TENANT_SCOPE,
          {
            scope: TENANT_SCOPE,
            bindings: new Map([
              [
                'audience' as unknown as SlotName,
                { kind: 'literal', value: 'acme', directive: 'prose' } as SlotBinding
              ]
            ])
          }
        ],
        [
          TEST_SCOPE,
          {
            scope: TEST_SCOPE,
            bindings: new Map([
              [
                'audience' as unknown as SlotName,
                {
                  kind: 'literal',
                  value: 'global-enforced',
                  directive: 'prose',
                  enforced: true
                } as SlotBinding
              ]
            ])
          }
        ]
      ]);
      expect(mergeBindings([TENANT_SCOPE, TEST_SCOPE], scopeBindings, slots, undefined)).toSucceedAndSatisfy(
        (result) => {
          expect(result.merged.get('audience' as unknown as SlotName)!.value).toBe('global-enforced');
        }
      );
    });

    test('falls back to defaultBinding then to empty for unbound optional slots', () => {
      const slotsWithDefault = [
        {
          name: 'a' as unknown as SlotName,
          description: '',
          defaultBinding: { kind: 'literal', value: 'd', directive: 'prose' } as SlotBinding
        },
        {
          name: 'b' as unknown as SlotName,
          description: '',
          required: false
        }
      ];
      expect(mergeBindings([TEST_SCOPE], new Map(), slotsWithDefault, undefined)).toSucceedAndSatisfy(
        (result) => {
          expect(result.merged.get('a' as unknown as SlotName)!.source).toBe('default');
          expect(result.merged.get('b' as unknown as SlotName)!.source).toBe('empty');
        }
      );
    });

    test('required slot with no binding fails', () => {
      expect(mergeBindings([TEST_SCOPE], new Map(), slots, undefined)).toFailWith(/required slot 'audience'/);
    });

    test('non-string slot kind rejected for literal binding', () => {
      const customKindSlots = [{ name: 's' as unknown as SlotName, description: '', kind: 'color' }];
      const scopeBindings = new Map<ScopeKey, IScopeSlotBindingsRecord>([
        [
          TEST_SCOPE,
          {
            scope: TEST_SCOPE,
            bindings: new Map([
              [
                's' as unknown as SlotName,
                { kind: 'literal', value: 'red', directive: 'prose' } as SlotBinding
              ]
            ])
          }
        ]
      ]);
      expect(mergeBindings([TEST_SCOPE], scopeBindings, customKindSlots, undefined)).toFailWith(
        /not supported/
      );
    });

    test('resource binding fails with B-2 deferral message', () => {
      const scopeBindings = new Map<ScopeKey, IScopeSlotBindingsRecord>([
        [
          TEST_SCOPE,
          {
            scope: TEST_SCOPE,
            bindings: new Map([
              [
                'audience' as unknown as SlotName,
                {
                  kind: 'resource',
                  resourceId: 'other' as unknown as import('../../index').ResourceId,
                  directive: 'prose'
                } as SlotBinding
              ]
            ])
          }
        ]
      ]);
      expect(mergeBindings([TEST_SCOPE], scopeBindings, slots, undefined)).toFailWith(
        /resource binding to 'other' is not yet implemented/
      );
    });
  });

  describe('PromptStoreFixture + FileTreePromptStore + PromptLibrary', () => {
    async function buildStore(seed: IPromptStoreFixtureSeed): Promise<IPromptStore> {
      const result = await PromptStoreFixture.build(seed);
      return result.orThrow();
    }

    test('end-to-end resolve with caller substitution', async () => {
      const store = await buildStore({ records: [buildDescriptor()] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const resolved = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: {},
        substitutions: { audience: 'world' }
      });
      expect(resolved).toSucceedAndSatisfy((r: IResolvedPrompt) => {
        expect(r.body).toBe('Hello, world!');
        expect(r.trace.winningScope).toBe(TEST_SCOPE);
        expect(r.trace.scopesConsulted).toEqual([TEST_SCOPE]);
        expect(r.trace.candidateMatches).toHaveLength(1);
      });
    });

    test('describe returns descriptor across any scope', async () => {
      const store = await buildStore({ records: [buildDescriptor()] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      expect(await lib.describe(TEST_PROMPT)).toSucceedAndSatisfy((d) => {
        expect(d.title).toBe('Greeting');
      });
      // Second call hits cache.
      expect(await lib.describe(TEST_PROMPT)).toSucceed();
      expect(await lib.describe('nope' as unknown as PromptId)).toFailWith(/not found/);
    });

    test('resolve fails when chain is empty', async () => {
      const store = await buildStore({ records: [buildDescriptor()] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      expect(await lib.resolve({ id: TEST_PROMPT, chain: [], qualifiers: {} })).toFailWith(
        /scope chain is empty/
      );
    });

    test('resolve fails when record not found', async () => {
      const store = await buildStore({});
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      expect(await lib.resolve({ id: TEST_PROMPT, chain: [TEST_SCOPE], qualifiers: {} })).toFailWith(
        /no record found/
      );
    });

    test('cross-scope bindings merge', async () => {
      const tenantRecord: IStoredPromptRecord = {
        ...buildDescriptor(),
        scope: TENANT_SCOPE
      };
      const store = await buildStore({
        records: [tenantRecord],
        bindings: [
          {
            scope: TEST_SCOPE,
            bindings: new Map([
              [
                'audience' as unknown as SlotName,
                { kind: 'literal', value: 'global-binding', directive: 'prose' } as SlotBinding
              ]
            ])
          }
        ]
      });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const resolved = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TENANT_SCOPE, TEST_SCOPE],
        qualifiers: {}
      });
      expect(resolved).toSucceedAndSatisfy((r) => {
        expect(r.body).toBe('Hello, global-binding!');
      });
    });

    test('store.list filters by id and scope', async () => {
      const tenant: IStoredPromptRecord = { ...buildDescriptor(), scope: TENANT_SCOPE };
      const store = await buildStore({ records: [buildDescriptor(), tenant] });
      expect(await store.list()).toSucceedAndSatisfy((list) => {
        expect(list).toHaveLength(2);
      });
      expect(await store.list({ scope: TENANT_SCOPE })).toSucceedAndSatisfy((list) => {
        expect(list).toHaveLength(1);
      });
      expect(await store.list({ id: TEST_PROMPT })).toSucceedAndSatisfy((list) => {
        expect(list.length).toBeGreaterThan(0);
      });
    });

    test('store.getBindings returns the scope-level record', async () => {
      const store = await buildStore({
        bindings: [
          {
            scope: TEST_SCOPE,
            bindings: new Map([
              [
                'audience' as unknown as SlotName,
                { kind: 'literal', value: 'b', directive: 'prose' } as SlotBinding
              ]
            ])
          }
        ]
      });
      expect(await store.getBindings(TEST_SCOPE)).toSucceedAndSatisfy((rec) => {
        expect(rec?.bindings.size).toBe(1);
      });
      expect(await store.getBindings('nonexistent' as unknown as ScopeKey)).toSucceedWith(undefined);
    });

    test('store.getQualifierConfig returns qualifiers when present', async () => {
      const store = await buildStore({
        qualifiers: [{ name: 'lang', typeName: 'language', defaultPriority: 1000 }]
      });
      expect(await store.getQualifierConfig()).toSucceedAndSatisfy((cfg) => {
        expect(cfg).toHaveLength(1);
      });
    });

    test('store.getQualifierConfig returns undefined when absent', async () => {
      const store = await buildStore({});
      expect(await store.getQualifierConfig()).toSucceedWith(undefined);
    });

    test('store.get returns undefined for unknown scope', async () => {
      const store = await buildStore({ records: [buildDescriptor()] });
      expect(await store.get('missing' as unknown as ScopeKey, TEST_PROMPT)).toSucceedWith(undefined);
    });

    test('store.get returns undefined for unknown prompt id', async () => {
      const store = await buildStore({ records: [buildDescriptor()] });
      expect(await store.get(TEST_SCOPE, 'nope' as unknown as PromptId)).toSucceedWith(undefined);
    });

    test('resolveAndValidateOutput fails loudly on free-text descriptors (B-4 deferral)', async () => {
      const store = await buildStore({ records: [buildDescriptor()] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const result = await lib.resolveAndValidateOutput<{ kind: string }>(
        {
          id: TEST_PROMPT,
          chain: [TEST_SCOPE],
          qualifiers: {},
          substitutions: { audience: 'world' }
        },
        'raw LLM output'
      );
      expect(result).toFailWith(/B-4 ships the output validation pipeline/);
      expect(result).toFailWith(/output\.kind 'free-text'/);
    });

    test('resolveAndValidateOutput fails loudly on json descriptors (B-4 deferral)', async () => {
      const jsonRecord: IStoredPromptRecord = buildDescriptor({
        descriptor: {
          ...buildDescriptor().descriptor,
          output: {
            kind: 'json',
            converterId: 'cited' as unknown as import('../../index').ConverterId
          },
          slots: []
        },
        candidates: [{ conditions: {}, body: 'just text' }]
      });
      const store = await buildStore({ records: [jsonRecord] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const result = await lib.resolveAndValidateOutput(
        { id: TEST_PROMPT, chain: [TEST_SCOPE], qualifiers: {} },
        '{"answer":"x"}'
      );
      expect(result).toFailWith(/B-4/);
    });

    test('chain walker surfaces store.get failures with scope context', async () => {
      const failing: IPromptStore = {
        get: async (): Promise<Result<IStoredPromptRecord | undefined>> => fail('disk read error'),
        list: async (): Promise<Result<ReadonlyArray<IStoredPromptRecord>>> => succeed([]),
        getBindings: async (): Promise<Result<IScopeSlotBindingsRecord | undefined>> => succeed(undefined),
        getQualifierConfig: async (): Promise<Result<ReadonlyArray<Qualifiers.IQualifierDecl> | undefined>> =>
          succeed(undefined)
      };
      const lib = (
        await PromptLibrary.create({ store: failing, qualifiers: TEST_QUALIFIER_COLLECTOR })
      ).orThrow();
      const result = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: {}
      });
      expect(result).toFailWith(/store\.get failed: disk read error/);
    });

    test('chain walker surfaces store.getBindings failures', async () => {
      const failing: IPromptStore = {
        get: async (): Promise<Result<IStoredPromptRecord | undefined>> => succeed(buildDescriptor()),
        list: async (): Promise<Result<ReadonlyArray<IStoredPromptRecord>>> => succeed([]),
        getBindings: async (): Promise<Result<IScopeSlotBindingsRecord | undefined>> =>
          fail('bindings IO failure'),
        getQualifierConfig: async (): Promise<Result<ReadonlyArray<Qualifiers.IQualifierDecl> | undefined>> =>
          succeed(undefined)
      };
      const lib = (
        await PromptLibrary.create({ store: failing, qualifiers: TEST_QUALIFIER_COLLECTOR })
      ).orThrow();
      const result = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: {}
      });
      expect(result).toFailWith(/store\.getBindings failed: bindings IO failure/);
    });

    test('describe propagates store.list failures', async () => {
      const failing: IPromptStore = {
        get: async (): Promise<Result<IStoredPromptRecord | undefined>> => succeed(undefined),
        list: async (): Promise<Result<ReadonlyArray<IStoredPromptRecord>>> => fail('list IO failure'),
        getBindings: async (): Promise<Result<IScopeSlotBindingsRecord | undefined>> => succeed(undefined),
        getQualifierConfig: async (): Promise<Result<ReadonlyArray<Qualifiers.IQualifierDecl> | undefined>> =>
          succeed(undefined)
      };
      const lib = (
        await PromptLibrary.create({ store: failing, qualifiers: TEST_QUALIFIER_COLLECTOR })
      ).orThrow();
      expect(await lib.describe(TEST_PROMPT)).toFailWith(/store\.list failed: list IO failure/);
    });

    test('resolve fails when no candidate matches', async () => {
      const record: IStoredPromptRecord = buildDescriptor({
        candidates: [{ conditions: { lang: 'en' }, body: 'english only' }],
        descriptor: { ...buildDescriptor().descriptor, slots: [] }
      });
      const store = await buildStore({ records: [record] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const result = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: { lang: 'fr' }
      });
      expect(result).toFailWith(/no candidate matched/);
    });

    test('binding merge failure during resolve surfaces with prompt id', async () => {
      const record: IStoredPromptRecord = buildDescriptor({
        descriptor: {
          ...buildDescriptor().descriptor,
          slots: [
            {
              name: 'audience' as unknown as SlotName,
              description: '',
              kind: 'unsupported'
            }
          ]
        }
      });
      const store = await buildStore({
        records: [record],
        bindings: [
          {
            scope: TEST_SCOPE,
            bindings: new Map([
              [
                'audience' as unknown as SlotName,
                { kind: 'literal', value: 'x', directive: 'prose' } as SlotBinding
              ]
            ])
          }
        ]
      });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const result = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: {}
      });
      expect(result).toFailWith(/prompt 'greeting':.*not supported/);
    });

    test('joinBodies supports specificity-descending order', () => {
      const selected: ReadonlyArray<{ candidate: IPromptCandidateRecord }> = [
        { candidate: { conditions: {}, body: 'a' } },
        { candidate: { conditions: {}, body: 'b' } }
      ];
      const out = joinBodies(selected, {
        order: 'specificity-descending',
        separator: '|',
        trimTrailingWhitespace: false
      });
      expect(out).toBe('b|a');
    });

    test('FileTreePromptStore accepts custom scopeEncoding', async () => {
      const customEncoding = (s: ScopeKey): Result<string> => succeed(`pre-${s}`);
      const seed: IPromptStoreFixtureSeed = {
        records: [buildDescriptor()],
        scopeEncoding: customEncoding
      };
      const store = (await PromptStoreFixture.build(seed)).orThrow();
      expect(await store.get(TEST_SCOPE, TEST_PROMPT)).toSucceed();
    });

    test('FileTreePromptStore.create accepts explicit scopeDecoding', async () => {
      // Drive the constructor's `params.scopeDecoding ?? default` branch by
      // supplying both encoder + decoder on FileTreePromptStore.create
      // directly. Build an in-memory FileTree root with a directory the
      // custom decoder can handle.
      const customEncoding = (s: ScopeKey): Result<string> => succeed(s);
      const customDecoding = (encoded: string): Result<ScopeKey> => succeed(encoded as unknown as ScopeKey);

      const tree = FileTree.inMemory([
        { path: `/${TEST_SCOPE}/${TEST_PROMPT}.yaml`, contents: 'irrelevant' }
      ]).orThrow();
      const root = tree.getDirectory('/').orThrow();
      const store = (
        await FileTreePromptStore.create({
          root,
          scopeEncoding: customEncoding,
          scopeDecoding: customDecoding
        })
      ).orThrow();
      // .list() walks the tree and invokes the decoder once per scope dir.
      // We don't care whether the YAML parses — only that the decoder ran.
      await store.list();
    });

    test('resolveAndValidateOutput propagates resolve failures', async () => {
      const store = await buildStore({});
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const result = await lib.resolveAndValidateOutput(
        { id: TEST_PROMPT, chain: [TEST_SCOPE], qualifiers: {} },
        'x'
      );
      expect(result).toFailWith(/no record found/);
    });

    test('buildStoredPromptRecord composes scope + contents', () => {
      const contents: IPromptFileContents = {
        descriptor: buildDescriptor().descriptor,
        candidates: [{ conditions: {}, body: 'b' }]
      };
      const record = buildStoredPromptRecord(TEST_SCOPE, contents);
      expect(record.scope).toBe(TEST_SCOPE);
      expect(record.id).toBe(TEST_PROMPT);
    });

    test('PromptLibrary.create fails when cache cap is invalid', async () => {
      const store = await buildStore({});
      const result = await PromptLibrary.create({
        store,
        qualifiers: TEST_QUALIFIER_COLLECTOR,
        templateCacheSize: 0
      });
      expect(result).toFailWith(/positive/);
    });

    test('resolve composes partial candidates in specificity-ascending order, stops at terminal', async () => {
      const record: IStoredPromptRecord = buildDescriptor({
        candidates: [
          { conditions: {}, isPartial: true, body: 'Be helpful.' },
          { conditions: { tone: 'formal' }, isPartial: true, body: 'Use formal address.' },
          { conditions: { tone: 'formal', region: 'emea' }, body: 'EMEA addendum.' }
        ],
        descriptor: {
          ...buildDescriptor().descriptor,
          slots: []
        }
      });
      const store = await buildStore({ records: [record] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const resolved = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: { tone: 'formal', region: 'emea' }
      });
      expect(resolved).toSucceedAndSatisfy((r: IResolvedPrompt) => {
        expect(r.body).toBe('Be helpful.\n\nUse formal address.\n\nEMEA addendum.');
        expect(r.trace.candidateMatches.map((m) => m.candidateIndex)).toEqual([0, 1, 2]);
        // All three matched as regular matches; conditions array reflects
        // the per-condition matches surfaced by ts-res (forwarded
        // unchanged — see design §4.2).
        expect(r.trace.candidateMatches.every((m) => m.matchType === 'match')).toBe(true);
        expect(r.trace.candidateMatches[2].conditions.length).toBeGreaterThan(0);
      });
    });

    test('resolve surfaces matchAsDefault when ts-res falls back via scoreAsDefault', async () => {
      const record: IStoredPromptRecord = buildDescriptor({
        candidates: [
          {
            conditions: { tone: { value: 'formal', scoreAsDefault: 0.5 } },
            body: 'formal default'
          }
        ],
        descriptor: {
          ...buildDescriptor().descriptor,
          slots: []
        }
      });
      const store = await buildStore({ records: [record] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      // Context value for `tone` is omitted — ts-res falls back via
      // scoreAsDefault.
      const resolved = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: {}
      });
      expect(resolved).toSucceedAndSatisfy((r: IResolvedPrompt) => {
        expect(r.body).toBe('formal default');
        expect(r.trace.candidateMatches[0].matchType).toBe('matchAsDefault');
      });
    });

    test('describe rejects diverging descriptors across scopes', async () => {
      const recordA: IStoredPromptRecord = buildDescriptor();
      const recordB: IStoredPromptRecord = buildDescriptor({
        scope: TENANT_SCOPE,
        descriptor: { ...buildDescriptor().descriptor, title: 'DIVERGED' }
      });
      const store = await buildStore({ records: [recordA, recordB] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      expect(await lib.describe(TEST_PROMPT)).toFailWith(/not structurally equal/);
    });

    test('invalidateDescriptor drops the cached entry', async () => {
      const store = await buildStore({ records: [buildDescriptor()] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      expect(await lib.describe(TEST_PROMPT)).toSucceed();
      lib.invalidateDescriptor(TEST_PROMPT);
      // Invalidation drops the cache; the next describe re-reads from
      // the store. We don't have an externally observable signal that
      // the cache was used vs not, but invalidating a non-cached id is
      // a no-op (safe to call repeatedly).
      lib.invalidateDescriptor('never-cached' as unknown as PromptId);
      expect(await lib.describe(TEST_PROMPT)).toSucceed();
    });

    test('PromptLibrary.create fails when qualifierTypes missing for decl-array qualifiers', async () => {
      const store = await buildStore({});
      const result = await PromptLibrary.create({
        store,
        qualifiers: [{ name: 'lang', typeName: 'lang', defaultPriority: 100 }]
      });
      expect(result).toFailWith(/qualifierTypes must be supplied/);
    });

    test('PromptLibrary.create accepts qualifier decls plus qualifierTypes', async () => {
      const store = await buildStore({});
      const result = await PromptLibrary.create({
        store,
        qualifiers: TEST_QUALIFIERS,
        qualifierTypes: TEST_QUALIFIER_TYPES
      });
      expect(result).toSucceed();
    });

    test('PromptLibrary.create honors explicit logger / resourceBindingDepthLimit / qualifierTypes', async () => {
      const store = await buildStore({});
      const noOp = new (await import('@fgv/ts-utils')).Logging.NoOpLogger();
      const result = await PromptLibrary.create({
        store,
        qualifiers: TEST_QUALIFIER_COLLECTOR,
        // Explicit qualifierTypes alongside a collector — the collector
        // already exposes its qualifierTypes, but the explicit value
        // takes precedence and exercises the branch.
        qualifierTypes: TEST_QUALIFIER_TYPES,
        logger: noOp,
        resourceBindingDepthLimit: 7
      });
      expect(result).toSucceedAndSatisfy((lib) => {
        expect(lib.resourceBindingDepthLimit).toBe(7);
        expect(lib.logger).toBe(noOp);
      });
    });

    test('resolve hits the materialized-resource cache on second call for the same prompt', async () => {
      const store = await buildStore({ records: [buildDescriptor()] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const first = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: {},
        substitutions: { audience: 'world' }
      });
      expect(first).toSucceed();
      // Second resolve with the same `(scope, id, candidate-hash)` reuses
      // the materialized ts-res resource. Body content is identical.
      const second = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: {},
        substitutions: { audience: 'world' }
      });
      expect(second).toSucceedAndSatisfy((r: IResolvedPrompt) => {
        expect(r.body).toBe('Hello, world!');
      });
    });

    test('resolve fails when ts-res addLooseCandidate rejects invalid conditions', async () => {
      // Per design §10.1 conditions delegate to ts-res's
      // ConditionSetDecl. A condition referencing an unknown qualifier
      // axis surfaces from addLooseCandidate at resolve time.
      const record: IStoredPromptRecord = buildDescriptor({
        candidates: [
          {
            conditions: { 'not-a-real-qualifier': 'x' },
            body: 'no-op'
          }
        ],
        descriptor: { ...buildDescriptor().descriptor, slots: [] }
      });
      const store = await buildStore({ records: [record] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const result = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: {}
      });
      expect(result).toFailWith(/addLooseCandidate failed/);
    });

    test('mustache render failure surfaces with prompt id', async () => {
      const recordWithMissingVar = buildDescriptor({
        candidates: [{ conditions: {}, body: 'hi {{{missing}}}' }],
        descriptor: {
          ...buildDescriptor().descriptor,
          slots: []
        }
      });
      const store = await buildStore({ records: [recordWithMissingVar] });
      const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
      const result = await lib.resolve({
        id: TEST_PROMPT,
        chain: [TEST_SCOPE],
        qualifiers: {}
      });
      expect(result).toFailWith(/greeting/);
    });
  });
});
