// Copyright (c) 2026 Erik Fortune
// SPDX-License-Identifier: MIT

import '@fgv/ts-utils-jest';
import {
  ConverterId,
  IPromptStore,
  IPromptStoreFixtureSeed,
  IStoredPromptRecord,
  PromptId,
  PromptLibrary,
  PromptStoreFixture,
  ResourceId,
  ScopeKey,
  SlotBinding,
  SlotName
} from '../../index';
import { QualifierTypes, Qualifiers } from '@fgv/ts-res';

const TEST_QUALIFIER_TYPES = QualifierTypes.QualifierTypeCollector.create({
  qualifierTypes: [
    QualifierTypes.LiteralQualifierType.create({ name: 'lang' }).orThrow(),
    QualifierTypes.LiteralQualifierType.create({ name: 'tone' }).orThrow(),
    QualifierTypes.LiteralQualifierType.create({ name: 'region' }).orThrow()
  ]
}).orThrow();

const TEST_QUALIFIER_COLLECTOR = Qualifiers.QualifierCollector.create({
  qualifierTypes: TEST_QUALIFIER_TYPES,
  qualifiers: [
    { name: 'lang', typeName: 'lang', defaultPriority: 1000 },
    { name: 'tone', typeName: 'tone', defaultPriority: 500 },
    { name: 'region', typeName: 'region', defaultPriority: 700 }
  ]
}).orThrow();

const TEST_SCOPE = 'global' as unknown as ScopeKey;
const TENANT_SCOPE = 'tenant_acme' as unknown as ScopeKey;

async function buildStore(seed: IPromptStoreFixtureSeed): Promise<IPromptStore> {
  return (await PromptStoreFixture.build(seed)).orThrow();
}

function buildPrompt(
  id: string,
  body: string,
  slots: Array<{ name: string; defaultBinding?: SlotBinding }>,
  scope: ScopeKey = TEST_SCOPE
): IStoredPromptRecord {
  return {
    scope,
    id: id as unknown as PromptId,
    descriptor: {
      id: id as unknown as PromptId,
      title: id,
      schemaVersion: '1',
      surface: 'chat',
      slots: slots.map((s) => ({
        name: s.name as unknown as SlotName,
        description: s.name,
        defaultBinding: s.defaultBinding
      })),
      output: { kind: 'free-text' }
    },
    candidates: [{ conditions: {}, body }]
  };
}

function resourceBinding(resourceId: string, extra: Partial<SlotBinding> = {}): SlotBinding {
  return {
    kind: 'resource',
    resourceId: resourceId as unknown as ResourceId,
    directive: 'prose',
    ...extra
  } as SlotBinding;
}

describe('ts-prompt-assist resource bindings (B-2)', () => {
  test('happy path: resource binding body is substituted into parent slot', async () => {
    const outer = buildPrompt('outer', 'Hi, {{{audience}}}!', [
      { name: 'audience', defaultBinding: resourceBinding('inner') }
    ]);
    const inner = buildPrompt('inner', 'everyone', []);
    const store = await buildStore({ records: [outer, inner] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'outer' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.body).toBe('Hi, everyone!');
      expect(r.trace.resourceBindingResolutions).toHaveLength(1);
      const entry = r.trace.resourceBindingResolutions[0];
      expect(entry.slot).toBe('audience');
      expect(entry.depth).toBe(1);
      expect(entry.substitutionMode).toBe('inherit');
      expect(entry.innerTrace.winningScope).toBe(TEST_SCOPE);
      expect(entry.innerTrace.candidateMatches).toHaveLength(1);
    });
  });

  test('strict-replace: binding-supplied substitutions replace parent substitutions', async () => {
    const outer = buildPrompt('outer', 'Hi, {{{audience}}}!', [
      { name: 'audience', defaultBinding: resourceBinding('inner', { substitutions: { who: 'bots' } }) }
    ]);
    const inner = buildPrompt('inner', 'inside is {{{who}}}', [{ name: 'who' }]);
    const store = await buildStore({ records: [outer, inner] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'outer' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {},
      substitutions: { who: 'humans' }
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.body).toBe('Hi, inside is bots!');
      expect(r.trace.resourceBindingResolutions[0].substitutionMode).toBe('replace');
    });
  });

  test('inherit: omitted substitutions inherit from parent', async () => {
    const outer = buildPrompt('outer', '{{{audience}}}', [
      { name: 'audience', defaultBinding: resourceBinding('inner') }
    ]);
    const inner = buildPrompt('inner', 'inner sees {{{who}}}', [{ name: 'who' }]);
    const store = await buildStore({ records: [outer, inner] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'outer' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {},
      substitutions: { who: 'humans' }
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.body).toBe('inner sees humans');
      expect(r.trace.resourceBindingResolutions[0].substitutionMode).toBe('inherit');
    });
  });

  test('cycle detection: A -> B -> A fails with cycle path', async () => {
    const a = buildPrompt('A', '{{{slot}}}', [{ name: 'slot', defaultBinding: resourceBinding('B') }]);
    const b = buildPrompt('B', '{{{slot}}}', [{ name: 'slot', defaultBinding: resourceBinding('A') }]);
    const store = await buildStore({ records: [a, b] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'A' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {}
    });
    expect(result).toFailWith(/cycle detected.*'A'.*->.*'B'.*->.*'A'/);
  });

  test('depth cap: default chain longer than 5 fails', async () => {
    const N = 7;
    const records: IStoredPromptRecord[] = [];
    for (let i = 0; i < N; i++) {
      const isLast = i === N - 1;
      records.push(
        buildPrompt(
          `P${i}`,
          isLast ? 'terminal' : '{{{slot}}}',
          isLast ? [] : [{ name: 'slot', defaultBinding: resourceBinding(`P${i + 1}`) }]
        )
      );
    }
    const store = await buildStore({ records });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'P0' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {}
    });
    expect(result).toFailWith(/depth limit \(5\) exceeded/);
  });

  test('depth cap: configurable limit honored', async () => {
    const a = buildPrompt('A', '{{{slot}}}', [{ name: 'slot', defaultBinding: resourceBinding('B') }]);
    const b = buildPrompt('B', '{{{slot}}}', [{ name: 'slot', defaultBinding: resourceBinding('C') }]);
    const c = buildPrompt('C', 'terminal', []);
    const store = await buildStore({ records: [a, b, c] });
    // A -> B -> C is depth 2; limit 1 must reject.
    const lib1 = (
      await PromptLibrary.create({
        store,
        qualifiers: TEST_QUALIFIER_COLLECTOR,
        resourceBindingDepthLimit: 1
      })
    ).orThrow();
    expect(
      await lib1.resolve({ id: 'A' as unknown as PromptId, chain: [TEST_SCOPE], qualifiers: {} })
    ).toFailWith(/depth limit \(1\) exceeded/);

    // Same chain succeeds at limit 2.
    const lib2 = (
      await PromptLibrary.create({
        store,
        qualifiers: TEST_QUALIFIER_COLLECTOR,
        resourceBindingDepthLimit: 2
      })
    ).orThrow();
    expect(
      await lib2.resolve({ id: 'A' as unknown as PromptId, chain: [TEST_SCOPE], qualifiers: {} })
    ).toSucceedAndSatisfy((r) => expect(r.body).toBe('terminal'));
  });

  test('cache hit: same (scope, id) materializes once across outer + inner resolves', async () => {
    const outer = buildPrompt('outer', '{{{a}}}/{{{b}}}', [
      { name: 'a', defaultBinding: resourceBinding('inner') },
      { name: 'b', defaultBinding: resourceBinding('inner') }
    ]);
    const inner = buildPrompt('inner', 'X', []);
    const store = await buildStore({ records: [outer, inner] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'outer' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.body).toBe('X/X');
      expect(r.trace.resourceBindingResolutions).toHaveLength(2);
    });
    // Exactly two distinct records materialized into the long-lived
    // ts-res builder: outer + inner (inner once despite two references).
    expect(lib.materializedCount).toBe(2);
  });

  test('enforced-override-ignored interacts cleanly with resource-binding slot', async () => {
    const outer = buildPrompt('outer', '{{{audience}}}', [{ name: 'audience' }]);
    const inner = buildPrompt('inner', 'enforced-inner', []);
    const store = await buildStore({
      records: [outer, inner],
      bindings: [
        {
          scope: TEST_SCOPE,
          bindings: new Map([
            ['audience' as unknown as SlotName, resourceBinding('inner', { enforced: true })]
          ])
        }
      ]
    });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'outer' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {},
      substitutions: { audience: 'caller-override' }
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.body).toBe('enforced-inner');
      expect(r.trace.safeguardFindings).toHaveLength(1);
      expect(r.trace.safeguardFindings[0].kind).toBe('enforced-override-ignored');
      expect(r.trace.resourceBindingResolutions).toHaveLength(1);
    });
  });

  test('scopeOverride directs the inner resolve to a different chain', async () => {
    const outer = buildPrompt('outer', '{{{slot}}}', [
      { name: 'slot', defaultBinding: resourceBinding('inner', { scopeOverride: [TENANT_SCOPE] }) }
    ]);
    const tenantInner = buildPrompt('inner', 'from-tenant', [], TENANT_SCOPE);
    const store = await buildStore({ records: [outer, tenantInner] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'outer' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {}
    });
    expect(result).toSucceedAndSatisfy((r) => expect(r.body).toBe('from-tenant'));
  });

  test('inner qualifiers override parent qualifiers when supplied', async () => {
    const outer = buildPrompt('outer', '{{{slot}}}', [
      { name: 'slot', defaultBinding: resourceBinding('inner', { qualifiers: { lang: 'en' } }) }
    ]);
    const inner: IStoredPromptRecord = {
      scope: TEST_SCOPE,
      id: 'inner' as unknown as PromptId,
      descriptor: {
        id: 'inner' as unknown as PromptId,
        title: 'inner',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'free-text' }
      },
      candidates: [
        { conditions: { lang: 'en' }, body: 'english' },
        { conditions: {}, body: 'default' }
      ]
    };
    const store = await buildStore({ records: [outer, inner] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'outer' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {}
    });
    expect(result).toSucceedAndSatisfy((r) => expect(r.body).toBe('english'));
  });

  test('json-output target is rejected at resolve time', async () => {
    const outer = buildPrompt('outer', '{{{slot}}}', [
      { name: 'slot', defaultBinding: resourceBinding('inner') }
    ]);
    const innerJson: IStoredPromptRecord = {
      scope: TEST_SCOPE,
      id: 'inner' as unknown as PromptId,
      descriptor: {
        id: 'inner' as unknown as PromptId,
        title: 'inner',
        schemaVersion: '1',
        surface: 'chat',
        slots: [],
        output: { kind: 'json', converterId: 'cvt' as unknown as ConverterId }
      },
      candidates: [{ conditions: {}, body: '{ "ok": true }' }]
    };
    const store = await buildStore({ records: [outer, innerJson] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'outer' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {}
    });
    expect(result).toFailWith(/only 'free-text' output is permitted/);
  });

  test("invalid resource id (contains '::') is rejected with a clear error", async () => {
    const outer = buildPrompt('outer', '{{{slot}}}', [
      { name: 'slot', defaultBinding: resourceBinding('bad::id') }
    ]);
    const store = await buildStore({ records: [outer] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'outer' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {}
    });
    expect(result).toFailWith(/resource 'bad::id' is not a valid prompt id/);
  });

  test('inner resolve failure surfaces with prompt + slot context', async () => {
    const outer = buildPrompt('outer', '{{{slot}}}', [
      { name: 'slot', defaultBinding: resourceBinding('missing') }
    ]);
    const store = await buildStore({ records: [outer] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'outer' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {}
    });
    expect(result).toFailWith(/outer.*slot 'slot'.*missing.*no record found/);
  });

  test('nested resource bindings: inner trace recursively populated', async () => {
    // A -> B -> C; expect outer.trace.resourceBindingResolutions[0]
    // .innerTrace.resourceBindingResolutions[0].innerTrace to describe C.
    const a = buildPrompt('A', '{{{s}}}', [{ name: 's', defaultBinding: resourceBinding('B') }]);
    const b = buildPrompt('B', '{{{s}}}', [{ name: 's', defaultBinding: resourceBinding('C') }]);
    const c = buildPrompt('C', 'leaf', []);
    const store = await buildStore({ records: [a, b, c] });
    const lib = (await PromptLibrary.create({ store, qualifiers: TEST_QUALIFIER_COLLECTOR })).orThrow();
    const result = await lib.resolve({
      id: 'A' as unknown as PromptId,
      chain: [TEST_SCOPE],
      qualifiers: {}
    });
    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.body).toBe('leaf');
      const outerEntry = r.trace.resourceBindingResolutions[0];
      expect(outerEntry.resourceId).toBe('B');
      expect(outerEntry.depth).toBe(1);
      const innerEntry = outerEntry.innerTrace.resourceBindingResolutions[0];
      expect(innerEntry.resourceId).toBe('C');
      expect(innerEntry.depth).toBe(2);
      expect(innerEntry.innerTrace.resourceBindingResolutions).toHaveLength(0);
    });
  });
});
