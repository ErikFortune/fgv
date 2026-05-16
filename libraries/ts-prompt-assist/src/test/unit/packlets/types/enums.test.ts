/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import '@fgv/ts-utils-jest';
// eslint-disable-next-line import/no-internal-modules
import {
  allSlotBindingKindValues,
  slotBindingKindConverter,
  allSlotDirectiveValues,
  slotDirectiveConverter,
  allSlotWritabilityValues,
  slotWritabilityConverter,
  allOutputContractKindValues,
  outputContractKindConverter,
  allResourceSubstitutionModeValues,
  resourceSubstitutionModeConverter,
  allSuspiciousDispositionValues,
  allPromptStoreEventKindValues,
  promptStoreEventKindConverter
} from '../../../../packlets/types/enums';

describe('SlotBindingKind', () => {
  test('allSlotBindingKindValues contains the expected values', () => {
    expect(allSlotBindingKindValues).toContain('literal');
    expect(allSlotBindingKindValues).toContain('resource');
    expect(allSlotBindingKindValues).toHaveLength(2);
  });

  test('slotBindingKindConverter converts valid values', () => {
    expect(slotBindingKindConverter.convert('literal')).toSucceedWith('literal');
    expect(slotBindingKindConverter.convert('resource')).toSucceedWith('resource');
  });

  test('slotBindingKindConverter fails on invalid values', () => {
    expect(slotBindingKindConverter.convert('other')).toFail();
    expect(slotBindingKindConverter.convert(null)).toFail();
  });
});

describe('SlotDirective', () => {
  test('allSlotDirectiveValues contains the expected values', () => {
    expect(allSlotDirectiveValues).toContain('constraint');
    expect(allSlotDirectiveValues).toContain('hint');
    expect(allSlotDirectiveValues).toContain('prose');
    expect(allSlotDirectiveValues).toHaveLength(3);
  });

  test('slotDirectiveConverter converts valid values', () => {
    expect(slotDirectiveConverter.convert('constraint')).toSucceedWith('constraint');
    expect(slotDirectiveConverter.convert('hint')).toSucceedWith('hint');
    expect(slotDirectiveConverter.convert('prose')).toSucceedWith('prose');
  });

  test('slotDirectiveConverter fails on invalid values', () => {
    expect(slotDirectiveConverter.convert('unknown')).toFail();
  });
});

describe('SlotWritability', () => {
  test('allSlotWritabilityValues contains the expected values', () => {
    expect(allSlotWritabilityValues).toContain('any-scope');
    expect(allSlotWritabilityValues).toContain('schema-only');
    expect(allSlotWritabilityValues).toContain('system-only');
    expect(allSlotWritabilityValues).toHaveLength(3);
  });

  test('slotWritabilityConverter converts valid values', () => {
    expect(slotWritabilityConverter.convert('any-scope')).toSucceedWith('any-scope');
    expect(slotWritabilityConverter.convert('schema-only')).toSucceedWith('schema-only');
    expect(slotWritabilityConverter.convert('system-only')).toSucceedWith('system-only');
  });

  test('slotWritabilityConverter fails on invalid values', () => {
    expect(slotWritabilityConverter.convert('public')).toFail();
  });
});

describe('OutputContractKind', () => {
  test('allOutputContractKindValues contains the expected values', () => {
    expect(allOutputContractKindValues).toContain('free-text');
    expect(allOutputContractKindValues).toContain('json');
    expect(allOutputContractKindValues).toHaveLength(2);
  });

  test('outputContractKindConverter converts valid values', () => {
    expect(outputContractKindConverter.convert('free-text')).toSucceedWith('free-text');
    expect(outputContractKindConverter.convert('json')).toSucceedWith('json');
  });

  test('outputContractKindConverter fails on invalid values', () => {
    expect(outputContractKindConverter.convert('html')).toFail();
  });
});

describe('ResourceSubstitutionMode', () => {
  test('allResourceSubstitutionModeValues contains the expected values', () => {
    expect(allResourceSubstitutionModeValues).toContain('replace');
    expect(allResourceSubstitutionModeValues).toContain('inherit');
    expect(allResourceSubstitutionModeValues).toHaveLength(2);
  });

  test('resourceSubstitutionModeConverter converts valid values', () => {
    expect(resourceSubstitutionModeConverter.convert('replace')).toSucceedWith('replace');
    expect(resourceSubstitutionModeConverter.convert('inherit')).toSucceedWith('inherit');
  });

  test('resourceSubstitutionModeConverter fails on invalid values', () => {
    expect(resourceSubstitutionModeConverter.convert('merge')).toFail();
  });
});

describe('SuspiciousDisposition', () => {
  test('allSuspiciousDispositionValues contains the expected values', () => {
    expect(allSuspiciousDispositionValues).toContain('warn');
    expect(allSuspiciousDispositionValues).toContain('reject');
    expect(allSuspiciousDispositionValues).toHaveLength(2);
  });
});

describe('PromptStoreEventKind', () => {
  test('allPromptStoreEventKindValues contains the expected values', () => {
    expect(allPromptStoreEventKindValues).toContain('descriptor-changed');
    expect(allPromptStoreEventKindValues).toContain('descriptor-removed');
    expect(allPromptStoreEventKindValues).toContain('bindings-changed');
    expect(allPromptStoreEventKindValues).toContain('qualifier-axes-changed');
    expect(allPromptStoreEventKindValues).toHaveLength(4);
  });

  test('promptStoreEventKindConverter converts valid values', () => {
    expect(promptStoreEventKindConverter.convert('descriptor-changed')).toSucceedWith('descriptor-changed');
    expect(promptStoreEventKindConverter.convert('descriptor-removed')).toSucceedWith('descriptor-removed');
    expect(promptStoreEventKindConverter.convert('bindings-changed')).toSucceedWith('bindings-changed');
    expect(promptStoreEventKindConverter.convert('qualifier-axes-changed')).toSucceedWith(
      'qualifier-axes-changed'
    );
  });

  test('promptStoreEventKindConverter fails on invalid values', () => {
    expect(promptStoreEventKindConverter.convert('not-a-kind')).toFail();
  });
});
