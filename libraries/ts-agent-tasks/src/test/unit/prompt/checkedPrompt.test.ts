/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * `checkTaskPrompt` against a real `PromptLibrary` and a real `TaskContextRenderer`. Every positive
 * claim here is made on a real resolve; `EditingLibrary` appears only where a check exists to refuse
 * an `ITaskPromptLibrary` that misdescribes its own body, which a real library never does.
 */

import '@fgv/ts-utils-jest';
import {
  IPromptSection,
  IResolvedPrompt,
  IScopeSlotBindingsRecord,
  PromptLibrary,
  SlotName
} from '@fgv/ts-prompt-assist';
import {
  ICheckedTaskPrompt,
  ITaskContext,
  checkTaskPrompt,
  defaultTaskContextSlotName,
  taskDataInterpretationRules
} from '../../../index';
import {
  EditingLibrary,
  globalScope,
  instructions,
  library,
  measure,
  persona,
  personaSlot,
  personaText,
  promptId,
  recordWithBody,
  render,
  request,
  standardRecord,
  task,
  tenantScope
} from '../../helpers/promptFixtures';

const two: ITaskContext = render([task('t1', 3, 4, 'survey sources'), task('t2', 5, 1, 'draft summary')]);

async function check(
  lib: PromptLibrary | EditingLibrary,
  extra?: object
): Promise<ReturnType<typeof checkTaskPrompt>> {
  return checkTaskPrompt({ library: lib, request, context: two, ...extra });
}

function editSections(
  lib: PromptLibrary,
  edit: (sections: ReadonlyArray<IPromptSection>) => ReadonlyArray<IPromptSection>
): EditingLibrary {
  return new EditingLibrary(lib, (r: IResolvedPrompt) => ({
    ...r,
    composition: { ...r.composition!, sections: edit(r.composition!.sections) }
  }));
}

describe('a well-formed task prompt passes, and what it says is about the real body', () => {
  test('the system text is the analyzed body: fixed text, rules, stable slot, then the task context last', async () => {
    const lib = await library([standardRecord()]);
    expect(await check(lib)).toSucceedAndSatisfy((checked: ICheckedTaskPrompt) => {
      const expected: string = [instructions, taskDataInterpretationRules, personaText, two.text].join(
        '\n\n'
      );
      expect(checked.system).toBe(expected);
      expect(checked.system).toBe(checked.resolved.body);
      expect(checked.taskSlot).toEqual({
        name: defaultTaskContextSlotName,
        start: expected.length - two.text.length,
        chars: two.text.length
      });
      expect(checked.stablePrefixChars).toBe(checked.taskSlot.start);
      // One breakpoint, at the boundary between the frozen prefix and the per-request slot.
      expect(checked.cacheRequest).toEqual({ systemBreakpoints: [checked.taskSlot.start] });
      // No tokenizer was supplied: the threshold is classified unknown, neither failure nor proof.
      expect(checked.threshold.verdict).toBe('unknown');
      expect(checked.threshold.detail).toMatch(/no measure was supplied/);
    });
  });

  test('cache hints pass through to the plan', async () => {
    const lib = await library([standardRecord()]);
    expect(await check(lib, { cacheHints: { cacheKey: 'conversation-7' } })).toSucceedAndSatisfy(
      (checked) => {
        expect(checked.cacheRequest).toEqual({
          systemBreakpoints: [checked.taskSlot.start],
          cacheKey: 'conversation-7'
        });
      }
    );
  });

  test('a host slot under another name, and a task slot under another name, both work', async () => {
    const slot: SlotName = 'work' as SlotName;
    const lib = await library([
      standardRecord({ taskSlot: { ...persona, name: slot, cacheStability: 'per-request' } })
    ]);
    expect(await check(lib, { taskSlot: slot })).toSucceedAndSatisfy((checked) => {
      expect(checked.taskSlot.name).toBe(slot);
      expect(checked.system.endsWith(two.text)).toBe(true);
    });
  });
});

describe('threshold-unknown is classified, never a failure and never proof', () => {
  test('a tokenizer without a minimum: unknown, with the measured size reported', async () => {
    const lib = await library([standardRecord()]);
    expect(await check(lib, { composition: { measure } })).toSucceedAndSatisfy((checked) => {
      expect(checked.threshold.verdict).toBe('unknown');
      expect(checked.threshold.detail).toMatch(/stable prefix measures \d+ token\(s\)/);
    });
  });

  test('a minimum the prefix meets: met', async () => {
    const lib = await library([standardRecord()]);
    const composition = { measure, cacheDiagnostics: { minCacheablePrefixTokens: 10 } };
    expect(await check(lib, { composition })).toSucceedAndSatisfy((checked) => {
      expect(checked.threshold).toEqual({ verdict: 'met' });
    });
  });

  test('a minimum the prefix falls short of: below — classified, the prompt still usable', async () => {
    const lib = await library([standardRecord()]);
    const composition = { measure, cacheDiagnostics: { minCacheablePrefixTokens: 4096 } };
    expect(await check(lib, { composition })).toSucceedAndSatisfy((checked) => {
      expect(checked.threshold.verdict).toBe('below');
      expect(checked.threshold.detail).toMatch(/4096/);
    });
  });
});

describe('met is never inferred from silence', () => {
  test('no threshold finding, but nothing measured: unknown, not met', async () => {
    const lib = new EditingLibrary(await library([standardRecord()]), (r) => ({
      ...r,
      composition: { ...r.composition!, cacheFindings: [] }
    }));
    const minimumOnly = { cacheDiagnostics: { minCacheablePrefixTokens: 1 } };
    expect(await check(lib, { composition: minimumOnly })).toSucceedAndSatisfy((checked) => {
      expect(checked.threshold.verdict).toBe('unknown');
    });
    expect(await check(lib)).toSucceedAndSatisfy((checked) => {
      expect(checked.threshold).toEqual({
        verdict: 'unknown',
        detail: expect.stringMatching(/not judged/)
      });
    });
  });
});

describe('met needs a judgement the request asked for', () => {
  test('measured, but no valid minimum, and a library reporting no threshold finding: unknown', async () => {
    const lib = new EditingLibrary(await library([standardRecord()]), (r) => ({
      ...r,
      composition: { ...r.composition!, cacheFindings: [] }
    }));
    for (const minCacheablePrefixTokens of [undefined, Number.NaN, -1]) {
      const composition = {
        measure,
        ...(minCacheablePrefixTokens !== undefined ? { cacheDiagnostics: { minCacheablePrefixTokens } } : {})
      };
      expect(await check(lib, { composition })).toSucceedAndSatisfy((checked) => {
        expect(checked.threshold.verdict).toBe('unknown');
      });
    }
  });
});

describe('composition must be positively available', () => {
  test('deliberately unavailable composition, with empty findings, fails', async () => {
    // A Mustache section makes the body unsegmentable: prompt-assist reports `unavailable` and
    // empty findings. The empty findings are what must not pass for "analyzed, nothing wrong".
    const body: string = `${instructions}\n\n{{#persona}}{{{persona}}}{{/persona}}\n\n{{{taskContext}}}`;
    const lib = await library([recordWithBody(body)]);
    const direct = (
      await lib.resolve({
        ...request,
        substitutions: { persona: personaText, taskContext: two.text },
        composition: {}
      })
    ).orThrow();
    expect(direct.composition!.unavailable).toBeDefined();
    expect(direct.composition!.cacheFindings).toEqual([]);
    expect(await check(lib)).toFailWith(
      /composition is unavailable .* empty findings are no evidence of analysis/
    );
  });

  test('a library answering with no composition fails', async () => {
    const lib = new EditingLibrary(await library([standardRecord()]), (r) => ({
      ...r,
      composition: undefined
    }));
    expect(await check(lib)).toFailWith(/returned no composition/);
  });

  test('a composition no check can read fails, rather than throwing', async () => {
    const lib = new EditingLibrary(await library([standardRecord()]), (r) => ({
      ...r,
      composition: { ...r.composition!, sections: undefined as unknown as [] }
    }));
    expect(await check(lib)).toFailWith(/^task prompt agent: /);
  });

  test('sections with a gap, or that do not cover the body, fail', async () => {
    const lib = await library([standardRecord()]);
    const gap = editSections(lib, (sections) =>
      sections.map((s, i) => (i === 1 ? { ...s, start: s.start + 1, chars: s.chars - 1 } : s))
    );
    expect(await check(gap)).toFailWith(/does not follow the previous one/);
    const short = editSections(lib, (sections) => sections.slice(0, -1));
    expect(await check(short)).toFailWith(/composition covers \d+ of \d+ characters/);
    const total = new EditingLibrary(lib, (r) => ({
      ...r,
      composition: { ...r.composition!, totalChars: 1 }
    }));
    expect(await check(total)).toFailWith(/composition covers/);
  });

  test('a section length that is not a count of characters fails, even when the offsets still add up', async () => {
    const lib = await library([standardRecord()]);
    // The first section claims extra characters and the next one gives them back: every start still
    // matches the running offset and the total is still the body's length.
    for (const [over, under] of [
      [5, -5],
      [0.5, -0.5]
    ]) {
      const overlapping = editSections(lib, ([first, ...rest]) => [
        { ...first, chars: first.chars + over },
        { kind: 'template', start: first.start + first.chars + over, chars: under },
        ...rest
      ]);
      expect(await check(overlapping)).toFailWith(/not a count of characters/);
    }
  });
});

describe('the task slot: exactly one, last, per-request, carrying the whole issued context', () => {
  test('a missing task slot fails', async () => {
    const lib = await library([recordWithBody(`${instructions}\n\n{{{persona}}}`)]);
    expect(await check(lib)).toFailWith(/holds the task slot 'taskContext' 0 times/);
  });

  test('a repeated task slot fails', async () => {
    const lib = await library([
      recordWithBody(`${instructions}\n\n{{{taskContext}}}\n\n{{{persona}}}\n\n{{{taskContext}}}`)
    ]);
    expect(await check(lib)).toFailWith(/2 times; it must hold it exactly once/);
  });

  test('anything after the task slot fails — no trailing literal, no trailing slot', async () => {
    const trailingText = await library([
      recordWithBody(`${instructions}\n\n{{{persona}}}\n\n{{{taskContext}}}\nEnd.`)
    ]);
    expect(await check(trailingText)).toFailWith(/is not the last section/);
    const trailingSlot = await library([recordWithBody(`${instructions}\n\n{{{taskContext}}}{{{persona}}}`)]);
    expect(await check(trailingSlot)).toFailWith(/is not the last section/);
  });

  test('an enforced binding overriding the task slot fails', async () => {
    const bindings: IScopeSlotBindingsRecord[] = [
      {
        scope: globalScope,
        bindings: new Map([
          [
            defaultTaskContextSlotName,
            { kind: 'literal', value: 'No tasks.', directive: 'prose', enforced: true }
          ]
        ])
      }
    ];
    const lib = await library([standardRecord()], { bindings });
    expect(await check(lib)).toFailWith(/filled from 'binding' \(enforced\), not from the task context/);
  });

  test('a slot reporting any other source fails', async () => {
    const lib = editSections(await library([standardRecord()]), (sections) =>
      sections.map((s) => (s.slot === defaultTaskContextSlotName ? { ...s, source: 'default' } : s))
    );
    expect(await check(lib)).toFailWith(/filled from 'default', not from the task context/);
  });

  test('a length cap that would truncate the context makes the resolve fail rather than cut it', async () => {
    const lib = await library([
      standardRecord({ taskSlot: { name: defaultTaskContextSlotName, description: 't', maxLength: 10 } })
    ]);
    expect(await check(lib)).toFailWith(/resolve failed/);
  });

  test("a slot whose text is not the context's, exactly, fails", async () => {
    // A body whose slot text was altered after the composition was computed.
    const lib = new EditingLibrary(await library([standardRecord()]), (r) => ({
      ...r,
      body: `${r.body.slice(0, -1)}X`
    }));
    expect(await check(lib)).toFailWith(/does not carry the issued task context exactly/);
  });

  test('the context appearing anywhere else in the body fails: it must be included exactly once', async () => {
    const lib = await library([standardRecord()]);
    const echoed = { ...request, substitutions: { persona: two.text } };
    expect(await checkTaskPrompt({ library: lib, request: echoed, context: two })).toFailWith(
      /appears in the body outside its slot/
    );
  });

  test('a false frozen claim on the task slot fails', async () => {
    const lib = await library([standardRecord()]);
    const claimed = {
      ...request,
      cacheStability: new Map([[defaultTaskContextSlotName, 'frozen' as const]])
    };
    expect(await checkTaskPrompt({ library: lib, request: claimed, context: two })).toFailWith(
      /treated as 'frozen', but task context changes per request/
    );
  });

  test('a body that is only the task context has no stable prefix, and fails', async () => {
    const lib = await library([recordWithBody('{{{taskContext}}}')]);
    expect(await check(lib)).toFailWith(/no stable prefix/);
  });

  test('a task slot named like an Object.prototype member is not mistaken for a host substitution', async () => {
    for (const name of ['toString', 'constructor']) {
      const slot = name as SlotName;
      const lib = await library([
        standardRecord({ taskSlot: { name: slot, description: 't', cacheStability: 'per-request' } })
      ]);
      expect(await check(lib, { taskSlot: slot })).toSucceedAndSatisfy((checked) => {
        expect(checked.taskSlot.name).toBe(name);
        expect(checked.system.endsWith(two.text)).toBe(true);
      });
    }
  });

  test("the host's substitutions may not name the task slot", async () => {
    const lib = await library([standardRecord()]);
    const forged = { ...request, substitutions: { persona: personaText, taskContext: 'Nothing to do.' } };
    expect(await checkTaskPrompt({ library: lib, request: forged, context: two })).toFailWith(
      /substitutions name the task slot 'taskContext'/
    );
  });
});

describe('cache findings are handled: ordering and refutation fail the check', () => {
  test('intentionally cache-hostile placement fails', async () => {
    const news = { name: 'news' as SlotName, description: 'today' };
    const body: string = `${instructions}\n\n{{{news}}}\n\n{{{persona}}}\n\n{{{taskContext}}}`;
    const record = recordWithBody(body, [news, ...standardRecord().descriptor.slots]);
    const lib = await library([record]);
    const req = { ...request, substitutions: { persona: personaText, news: 'rain' } };
    expect(await checkTaskPrompt({ library: lib, request: req, context: two })).toFailWith(
      /cache-hostile-ordering/
    );
  });

  test('a false frozen declaration on a host slot fails', async () => {
    // Two scopes bind the "frozen" persona, so which value wins depends on the chain: refuted.
    const bind = (scope: typeof globalScope, value: string): IScopeSlotBindingsRecord => ({
      scope,
      bindings: new Map([[personaSlot, { kind: 'literal', value, directive: 'prose' }]])
    });
    const lib = await library([standardRecord()], {
      bindings: [bind(globalScope, 'Ada'), bind(tenantScope, 'Grace')]
    });
    const req = { id: promptId, chain: [tenantScope, globalScope], qualifiers: {} };
    expect(await checkTaskPrompt({ library: lib, request: req, context: two })).toFailWith(
      /stability-refuted/
    );
  });

  test('volatile content ahead of everything leaves no cacheable prefix, and fails', async () => {
    const news = { name: 'news' as SlotName, description: 'today' };
    const lib = await library([
      recordWithBody('{{{news}}}\n\n{{{taskContext}}}', [news, ...standardRecord().descriptor.slots])
    ]);
    const req = { ...request, substitutions: { persona: personaText, news: 'rain' } };
    expect(await checkTaskPrompt({ library: lib, request: req, context: two })).toFailWith(
      /no-cacheable-prefix/
    );
  });

  test('a breakpoint cap the plan cannot meet fails', async () => {
    const lib = await library([standardRecord()]);
    expect(await check(lib, { cacheHints: { maxBreakpointWrites: 0 } })).toFail();
  });

  test('a plan whose breakpoints do not end at the task slot fails', async () => {
    // Stabilities that put no breakpoint before the slot, with no finding saying so.
    const lib = editSections(await library([standardRecord()]), (sections) =>
      sections.map((s) => ({ ...s, effectiveStability: 'per-request' as const }))
    );
    expect(await check(lib)).toFailWith(/breakpoints \[\] do not end at the task slot/);
  });
});

describe('resolution failures', () => {
  test('an unknown prompt fails, labelled', async () => {
    const lib = await library([standardRecord()]);
    const req = { ...request, id: 'nope' as typeof promptId };
    expect(await checkTaskPrompt({ library: lib, request: req, context: two })).toFailWith(
      /^task prompt nope: resolve failed/
    );
  });

  test('a library that throws fails, rather than throwing', async () => {
    const lib = {
      resolve: (): never => {
        throw new Error('store offline');
      }
    };
    expect(await checkTaskPrompt({ library: lib, request, context: two })).toFailWith(
      /resolve failed: store offline/
    );
  });
});

describe('the receipt is released only against the exact body that was checked', () => {
  test('the exact system text releases it; any change does not', async () => {
    const lib = await library([standardRecord()]);
    const receiptOf = render([task('t1', 3, 4)], 'delivery-1');
    const checked = (await checkTaskPrompt({ library: lib, request, context: receiptOf })).orThrow();
    expect(checked.receiptFor(checked.system)).toSucceedWith(receiptOf.receipt);
    const slot: string = receiptOf.text;
    for (const sent of [
      `Preamble.\n${checked.system}`,
      `${checked.system}\n`,
      checked.system.replace(slot, render([task('t1', 4, 5)]).text),
      checked.system.slice(0, checked.taskSlot.start),
      checked.system.slice(0, -10)
    ]) {
      expect(checked.receiptFor(sent)).toFailWith(/not the checked body/);
    }
  });

  test('neither the receipt nor its delivery id is anywhere in the body, the trace or the substitutions', async () => {
    const lib = await library([standardRecord()]);
    const context = render([task('t1', 3, 4)], 'delivery-zq9');
    const checked = (await checkTaskPrompt({ library: lib, request, context })).orThrow();
    expect(checked.system).not.toContain('delivery-zq9');
    expect(JSON.stringify([...checked.resolved.trace.mergedBindings.values()])).not.toContain('delivery-zq9');
    expect(JSON.stringify(checked.cacheRequest)).not.toContain('delivery-zq9');
    expect(JSON.stringify({ ...checked, resolved: undefined })).not.toContain('delivery-zq9');
  });
});
