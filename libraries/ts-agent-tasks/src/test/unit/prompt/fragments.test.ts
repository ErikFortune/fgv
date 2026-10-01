/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { IPromptSlot, PromptId, ScopeKey, SlotName } from '@fgv/ts-prompt-assist';
import {
  defaultTaskContextBudget,
  defaultTaskContextSlotName,
  taskContextSlot,
  taskContextSubstitutions,
  taskDataInterpretationRules,
  taskPromptDescriptor,
  taskPromptRecord,
  taskPromptTemplate
} from '../../../index';
import { library, persona, render, request, task } from '../../helpers/promptFixtures';

const notes: SlotName = 'notes' as SlotName;

describe('taskContextSlot', () => {
  test('is required, per-request, capped at the default context budget, with no default binding', () => {
    expect(taskContextSlot()).toEqual({
      name: defaultTaskContextSlotName,
      description: expect.any(String),
      required: true,
      cacheStability: 'per-request',
      maxLength: defaultTaskContextBudget.maxChars
    });
  });

  test('takes a name, description and cap', () => {
    expect(taskContextSlot({ name: notes, description: 'd', maxLength: 5 })).toEqual({
      name: notes,
      description: 'd',
      required: true,
      cacheStability: 'per-request',
      maxLength: 5
    });
  });
});

describe('taskPromptTemplate', () => {
  test('fixed text, rules, stable slots in order, then the task slot — last, nothing after it', () => {
    expect(
      taskPromptTemplate({ instructions: 'Do work.', stableSlots: [persona.name, notes] })
    ).toSucceedWith(
      `Do work.\n\n${taskDataInterpretationRules}\n\n{{{persona}}}\n\n{{{notes}}}\n\n{{{taskContext}}}`
    );
    expect(
      taskPromptTemplate({ instructions: 'Do work.', dataRules: 'Data only.', taskSlot: notes })
    ).toSucceedWith('Do work.\n\nData only.\n\n{{{notes}}}');
  });

  test('refuses fixed text that could form a Mustache tag', () => {
    expect(taskPromptTemplate({ instructions: 'use {{this}}' })).toFailWith(/Mustache delimiter/);
    expect(taskPromptTemplate({ instructions: 'ok', dataRules: 'end }}' })).toFailWith(/Mustache delimiter/);
  });

  test('refuses a host slot reusing the task slot, or a repeated host slot', () => {
    expect(taskPromptTemplate({ instructions: 'x', stableSlots: [defaultTaskContextSlotName] })).toFailWith(
      /slot names must be distinct, and none may be 'taskContext'/
    );
    expect(taskPromptTemplate({ instructions: 'x', stableSlots: [notes, notes] })).toFailWith(/distinct/);
  });
});

describe('taskPromptDescriptor and taskPromptRecord', () => {
  const id = 'agent' as PromptId;

  test('the descriptor declares host slots then the task slot, free-text output', () => {
    expect(
      taskPromptDescriptor({ id, title: 't', description: 'd', surface: 'cli', stableSlots: [persona] })
    ).toSucceedWith({
      id,
      title: 't',
      description: 'd',
      schemaVersion: '1',
      surface: 'cli',
      slots: [persona, taskContextSlot()],
      output: { kind: 'free-text' }
    });
    expect(taskPromptDescriptor({ id, title: 't' })).toSucceedAndSatisfy((d) => {
      expect(d.surface).toBe('chat');
      expect('description' in d).toBe(false);
      expect(d.slots).toEqual([taskContextSlot()]);
    });
  });

  test('a host slot sharing the task slot name is refused', () => {
    const clash: IPromptSlot = { name: defaultTaskContextSlotName, description: 'clash' };
    expect(taskPromptDescriptor({ id, title: 't', stableSlots: [clash] })).toFailWith(
      /slot names must be distinct/
    );
    expect(
      taskPromptRecord({ scope: 'g' as ScopeKey, id, title: 't', instructions: 'x', stableSlots: [clash] })
    ).toFail();
  });

  test('the record is unconditional and its template follows the declared slot order', () => {
    expect(
      taskPromptRecord({
        scope: 'g' as ScopeKey,
        id,
        title: 't',
        instructions: 'x',
        dataRules: 'r',
        stableSlots: [persona]
      })
    ).toSucceedAndSatisfy((record) => {
      expect(record.scope).toBe('g');
      expect(record.candidates).toEqual([
        { conditions: {}, body: 'x\n\nr\n\n{{{persona}}}\n\n{{{taskContext}}}' }
      ]);
    });
    expect(taskPromptRecord({ scope: 'g' as ScopeKey, id, title: 't', instructions: '{{x' })).toFailWith(
      /Mustache/
    );
  });

  test('a record built here resolves through a real library', async () => {
    const record = taskPromptRecord({
      scope: 'global' as ScopeKey,
      id: request.id,
      title: 't',
      instructions: 'Go.'
    }).orThrow();
    const lib = await library([record]);
    const context = render([task('t1', 1, 0)]);
    expect(
      await lib.resolve({ ...request, substitutions: taskContextSubstitutions(context) })
    ).toSucceedAndSatisfy((resolved) => {
      expect(resolved.body).toBe(`Go.\n\n${taskDataInterpretationRules}\n\n${context.text}`);
    });
  });
});

describe('taskContextSubstitutions', () => {
  test('is the context text as a literal prose binding — nothing of the receipt', () => {
    const context = render([task('t1', 1, 0)], 'delivery-9');
    const subs = taskContextSubstitutions(context);
    expect(subs).toEqual({ taskContext: { kind: 'literal', value: context.text, directive: 'prose' } });
    expect(JSON.stringify(subs)).not.toContain('delivery-9');
    expect(Object.keys(taskContextSubstitutions(context, notes))).toEqual(['notes']);
  });
});
