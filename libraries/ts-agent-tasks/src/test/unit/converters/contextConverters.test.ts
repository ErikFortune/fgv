/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonObject } from '@fgv/ts-json-base';
import { omit } from '@fgv/ts-utils';
import { IContextConverters, ITaskInclusionReceipt, taskContextLimits } from '../../../index';
import { converters } from '../../helpers/fixtures';
import { envelope, summary, unresolved, update } from '../../helpers/contextFixtures';

const context: IContextConverters = converters.context;

describe('context converters', () => {
  describe('summary and presentable', () => {
    test('summary is strict: a snapshot with details is not a summary', () => {
      expect(context.summary.convert(summary('t1', 1))).toSucceed();
      expect(context.summary.convert({ envelope: envelope('t1', 1), details: {} })).toFailWith(/details/i);
    });

    test('presentable accepts a summary or a snapshot, and discards details', () => {
      expect(
        context.presentable.convert({ envelope: envelope('t1', 1), details: { x: 1 } })
      ).toSucceedAndSatisfy((value) => {
        expect(Object.keys(value)).toEqual(['envelope']);
      });
      expect(context.presentable.convert(summary('t1', 1))).toSucceed();
      expect(context.presentable.convert({ envelope: envelope('t1', 1), other: 1 })).toFailWith(/other/i);
    });
  });

  describe('update', () => {
    test('a well-formed update converts', () => {
      expect(context.update.convert(update('u1', 't1', 2, 'result', true))).toSucceedAndSatisfy((u) => {
        expect(u.category).toBe('result');
        expect(u.snapshot.envelope.revision).toBe(2);
      });
    });

    test('an unknown category fails', () => {
      expect(
        context.update.convert({ ...update('u1', 't1', 2, 'result', true), category: 'gossip' })
      ).toFail();
    });

    test('a payload for a different task or revision fails', () => {
      expect(
        context.update.convert({ ...update('u1', 't1', 2, 'result', true), snapshot: summary('t2', 2) })
      ).toFailWith(/names t1@2 but carries t2@2/i);
      expect(
        context.update.convert({ ...update('u1', 't1', 2, 'result', true), snapshot: summary('t1', 1) })
      ).toFailWith(/names t1@2 but carries t1@1/i);
    });

    test('an audience is bounded and may not repeat a subscription', () => {
      const base: JsonObject = update('u1', 't1', 2, 'result', true);
      expect(context.update.convert({ ...base, audience: [] })).toSucceed();
      expect(context.update.convert({ ...base, audience: ['s1', 's1'] })).toFailWith(
        /duplicate subscription id/i
      );
      const tooMany: string[] = Array.from(
        { length: converters.bounds.maxReferences + 1 },
        (__v, i) => `s${i}`
      );
      expect(context.update.convert({ ...base, audience: tooMany })).toFailWith(/exceeds the maximum/i);
    });
  });

  describe('unresolved reference', () => {
    test('converts, and requires its binding and reason', () => {
      expect(context.unresolvedReference.convert(unresolved('x1', { parentId: 'p' }))).toSucceed();
      expect(context.unresolvedReference.convert(omit(unresolved('x1'), ['binding']))).toFail();
      expect(context.unresolvedReference.convert(unresolved('x1', { reason: '' }))).toFailWith(/empty/i);
    });
  });

  describe('input', () => {
    test('requires completeness and bounds every list', () => {
      expect(context.input.convert({ tasks: [] })).toFail();
      expect(context.input.convert({ tasks: [], completeness: 'mostly' })).toFail();
      const tooMany: JsonObject[] = Array.from({ length: taskContextLimits.maxInputEntries + 1 }, () =>
        summary('t1', 1)
      );
      expect(context.input.convert({ tasks: tooMany, completeness: 'complete' })).toFailWith(
        /exceeds the maximum/i
      );
    });
  });

  describe('budget', () => {
    test('accepts the default shape and rejects malformed values', () => {
      expect(context.budget.convert({ maxItems: 20, maxDepth: 0, maxChars: 8000 })).toSucceed();
      expect(context.budget.convert({ maxItems: 20, maxDepth: 3 })).toFail();
      expect(context.budget.convert({ maxItems: 201, maxDepth: 3, maxChars: 8000 })).toFailWith(
        /limit of 200/i
      );
      expect(context.budget.convert({ maxItems: 20, maxDepth: 3, maxChars: 8000, extra: 1 })).toFail();
    });
  });

  describe('receipt', () => {
    const entry = (taskId: string, revision: number, updateIds: string[] = []): JsonObject => ({
      taskId,
      revision,
      updateIds
    });

    test('a canonical receipt converts, with or without a delivery id', () => {
      const receipt: JsonObject = {
        version: 1,
        included: [entry('a', 1, ['u1', 'u2']), entry('a', 2), entry('b', 1, ['u3'])]
      };
      expect(context.receipt.convert(receipt)).toSucceedWith(receipt as unknown as ITaskInclusionReceipt);
      expect(context.receipt.convert({ ...receipt, deliveryId: 'd-1' })).toSucceed();
      expect(context.receipt.convert({ version: 1, included: [] })).toSucceed();
    });

    test('an out-of-order or repeated entry fails', () => {
      expect(context.receipt.convert({ version: 1, included: [entry('b', 1), entry('a', 1)] })).toFailWith(
        /out of order or repeated/i
      );
      expect(context.receipt.convert({ version: 1, included: [entry('a', 2), entry('a', 1)] })).toFailWith(
        /out of order or repeated/i
      );
      expect(context.receipt.convert({ version: 1, included: [entry('a', 1), entry('a', 1)] })).toFailWith(
        /out of order or repeated/i
      );
    });

    test('update ids must be unique and ascending within an entry, and unique across entries', () => {
      expect(context.receipt.convert({ version: 1, included: [entry('a', 1, ['u2', 'u1'])] })).toFailWith(
        /unique and ascending/i
      );
      expect(context.receipt.convert({ version: 1, included: [entry('a', 1, ['u1', 'u1'])] })).toFailWith(
        /unique and ascending/i
      );
      expect(
        context.receipt.convert({ version: 1, included: [entry('a', 1, ['u1']), entry('b', 1, ['u1'])] })
      ).toFailWith(/more than one entry/i);
    });

    test('an entry carries at most one update per category', () => {
      const eight: string[] = Array.from({ length: 8 }, (__v, i) => `u${i}`);
      expect(
        context.receipt.convert({ version: 1, included: [entry('a', 1, eight.slice(0, 7))] })
      ).toSucceed();
      expect(context.receipt.convert({ version: 1, included: [entry('a', 1, eight)] })).toFailWith(
        /exceeds the maximum/i
      );
    });

    test('version, strictness and the entry limit are enforced', () => {
      expect(context.receipt.convert({ version: 2, included: [] })).toFail();
      expect(context.receipt.convert({ version: 1, included: [], acknowledged: true })).toFail();
      const many: JsonObject[] = Array.from({ length: taskContextLimits.maxItems + 1 }, (__v, i) =>
        entry(`t${String(i).padStart(4, '0')}`, 1)
      );
      expect(context.receipt.convert({ version: 1, included: many })).toFailWith(/exceeds the maximum/i);
    });
  });

  describe('a coalescing marker', () => {
    test('is carried by a routine update that supersedes earlier revisions', () => {
      expect(
        context.update.convert({
          ...update('t1:3:1', 't1', 3, 'progress', false),
          coalesced: { fromRevision: 1 }
        })
      ).toSucceed();
    });

    test('is refused on a required update, and must name an earlier revision', () => {
      expect(
        context.update.convert({
          ...update('t1:3:0', 't1', 3, 'lifecycle', true),
          coalesced: { fromRevision: 1 }
        })
      ).toFailWith(/never coalesces/i);
      // The category decides, not the flag: a lifecycle update marked routine is still required.
      expect(
        context.update.convert({
          ...update('t1:3:0', 't1', 3, 'lifecycle', false),
          coalesced: { fromRevision: 1 }
        })
      ).toFailWith(/never coalesces/i);
      expect(
        context.update.convert({
          ...update('t1:3:1', 't1', 3, 'progress', false),
          coalesced: { fromRevision: 3 }
        })
      ).toFailWith(/earlier revisions/i);
    });
  });
});
