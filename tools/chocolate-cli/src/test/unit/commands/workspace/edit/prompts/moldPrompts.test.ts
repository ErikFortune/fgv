/*
 * MIT License
 *
 * Copyright (c) 2025 Erik Fortune
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

// Mock the shared module (which wraps @inquirer/prompts + chalk)
const mockPromptInput = jest.fn();
const mockConfirmAction = jest.fn();
const mockShowMenu = jest.fn();
jest.mock('../../../../../../commands/workspace/shared', () => ({
  promptInput: mockPromptInput,
  confirmAction: mockConfirmAction,
  showMenu: mockShowMenu,
  showInfo: jest.fn(),
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn()
}));

import '@fgv/ts-utils-jest';
import type { BaseMoldId, Measurement, MoldId, NoteCategory, UrlCategory } from '@fgv/ts-chocolate';
import type { Entities } from '@fgv/ts-chocolate';
import { promptNewMold, promptEditMold } from '../../../../../../commands/workspace/edit/prompts/moldPrompts';
import { createResponder } from './helpers/promptTestHelper';
import type { IMockSharedPrompts } from './helpers/promptTestHelper';

const mocks: IMockSharedPrompts = {
  promptInput: mockPromptInput,
  confirmAction: mockConfirmAction,
  showMenu: mockShowMenu
};

describe('moldPrompts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('promptNewMold', () => {
    describe('happy path scenarios', () => {
      test('should create mold with grid cavities and weight', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme Molds')
          .onInput(/^Product number/i, 'TRF-1000')
          .onInput(/^Base ID/i, 'acme-trf1000')
          .onInput(/^Description/i, 'Premium truffle mold')
          .onInput(/^Number of columns/i, '6')
          .onInput(/^Number of rows/i, '4')
          .onInput(/^Cavity weight/i, '15.5')
          .onMenu(/^Select mold format/i, 'series-1000')
          .onMenu(/^Select cavity configuration/i, 'grid')
          .onConfirm(/weight/i, true)
          .install(mocks);

        expect(await promptNewMold()).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('acme-trf1000');
          expect(entity.manufacturer).toBe('Acme Molds');
          expect(entity.productNumber).toBe('TRF-1000');
          expect(entity.description).toBe('Premium truffle mold');
          expect(entity.format).toBe('series-1000');
          expect(entity.cavities.kind).toBe('grid');
          if (entity.cavities.kind === 'grid') {
            expect(entity.cavities.columns).toBe(6);
            expect(entity.cavities.rows).toBe(4);
          }
          expect(entity.cavities.info?.weight).toBe(15.5);
        });
      });

      test('should create mold with count cavities', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Best Molds')
          .onInput(/^Product number/i, 'BM-500')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, '')
          .onInput(/^Number of cavities/i, '24')
          .onMenu(/^Select mold format/i, 'series-2000')
          .onMenu(/^Select cavity configuration/i, 'count')
          .onConfirm(/weight/i, false)
          .install(mocks);

        expect(await promptNewMold()).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('best-molds-bm-500');
          expect(entity.manufacturer).toBe('Best Molds');
          expect(entity.productNumber).toBe('BM-500');
          expect(entity.description).toBeUndefined();
          expect(entity.format).toBe('series-2000');
          expect(entity.cavities.kind).toBe('count');
          if (entity.cavities.kind === 'count') {
            expect(entity.cavities.count).toBe(24);
          }
        });
      });

      test('should auto-generate baseId from manufacturer and product number', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Chef Supply')
          .onInput(/^Product number/i, 'PRO 2000')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, 'Professional grade')
          .onInput(/^Number of cavities/i, '12')
          .onMenu(/^Select mold format/i, 'other')
          .onMenu(/^Select cavity configuration/i, 'count')
          .onConfirm(/weight/i, false)
          .install(mocks);

        expect(await promptNewMold()).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('chef-supply-pro-2000');
        });
      });

      test('should use explicit baseId when provided', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Maker')
          .onInput(/^Product number/i, 'M-100')
          .onInput(/^Base ID/i, 'custom-id-123')
          .onInput(/^Description/i, '')
          .onInput(/^Number of cavities/i, '8')
          .onMenu(/^Select mold format/i, 'other')
          .onMenu(/^Select cavity configuration/i, 'count')
          .onConfirm(/weight/i, false)
          .install(mocks);

        expect(await promptNewMold()).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('custom-id-123');
        });
      });

      test('should omit cavity info when weight declined', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Maker')
          .onInput(/^Product number/i, 'M-300')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, '')
          .onInput(/^Number of cavities/i, '10')
          .onMenu(/^Select mold format/i, 'other')
          .onMenu(/^Select cavity configuration/i, 'count')
          .onConfirm(/weight/i, false)
          .install(mocks);

        expect(await promptNewMold()).toSucceedAndSatisfy((entity) => {
          expect(entity.cavities.info).toBeUndefined();
        });
      });
    });

    describe('validation failure scenarios', () => {
      test('should return failure for empty manufacturer', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, '   ')
          .install(mocks);

        expect(await promptNewMold()).toFailWith(/manufacturer is required/i);
      });

      test('should return failure for empty product number', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, '')
          .install(mocks);

        expect(await promptNewMold()).toFailWith(/product number is required/i);
      });

      test('should return failure for invalid explicit baseId', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'A-100')
          .onInput(/^Base ID/i, 'invalid.with.dots')
          .install(mocks);

        expect(await promptNewMold()).toFailWith(/invalid base id/i);
      });

      test('should return failure when format menu is cancelled', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'A-100')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, '')
          .onMenuBack(/^Select mold format/i)
          .install(mocks);

        expect(await promptNewMold()).toFailWith(/mold format selection cancelled/i);
      });

      test('should return failure when cavity kind menu is cancelled', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'A-100')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, '')
          .onMenu(/^Select mold format/i, 'series-1000')
          .onMenuBack(/^Select cavity configuration/i)
          .install(mocks);

        expect(await promptNewMold()).toFailWith(/cavity configuration selection cancelled/i);
      });

      test('should return failure for non-positive columns', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'A-100')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, '0')
          .onMenu(/^Select mold format/i, 'series-1000')
          .onMenu(/^Select cavity configuration/i, 'grid')
          .install(mocks);

        expect(await promptNewMold()).toFailWith(/columns must be a positive integer/i);
      });

      test('should return failure for NaN columns', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'A-100')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, 'not-a-number')
          .onMenu(/^Select mold format/i, 'series-1000')
          .onMenu(/^Select cavity configuration/i, 'grid')
          .install(mocks);

        expect(await promptNewMold()).toFailWith(/columns must be a positive integer/i);
      });

      test('should return failure for non-positive rows', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'A-100')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, '4')
          .onInput(/^Number of rows/i, '-2')
          .onMenu(/^Select mold format/i, 'series-1000')
          .onMenu(/^Select cavity configuration/i, 'grid')
          .install(mocks);

        expect(await promptNewMold()).toFailWith(/rows must be a positive integer/i);
      });

      test('should return failure for non-positive count', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'A-100')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, '')
          .onInput(/^Number of cavities/i, '0')
          .onMenu(/^Select mold format/i, 'series-2000')
          .onMenu(/^Select cavity configuration/i, 'count')
          .install(mocks);

        expect(await promptNewMold()).toFailWith(/count must be a positive integer/i);
      });

      test('should return failure for invalid weight value', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'A-100')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, '5')
          .onInput(/^Number of rows/i, '5')
          .onInput(/^Cavity weight/i, 'invalid-weight')
          .onMenu(/^Select mold format/i, 'series-1000')
          .onMenu(/^Select cavity configuration/i, 'grid')
          .onConfirm(/weight/i, true)
          .install(mocks);

        expect(await promptNewMold()).toFailWith(/invalid weight value/i);
      });
    });
  });

  describe('promptEditMold', () => {
    const existingMold: Entities.IMoldEntity = {
      baseId: 'acme-trf-original' as unknown as BaseMoldId,
      manufacturer: 'Acme Original',
      productNumber: 'TRF-ORIG',
      description: 'Original description',
      format: 'series-1000',
      cavities: {
        kind: 'grid',
        columns: 4,
        rows: 3,
        info: {
          weight: 10.5 as unknown as Measurement
        }
      },
      tags: ['tag1', 'tag2'],
      related: ['default.related-mold' as unknown as MoldId],
      notes: [{ category: 'general' as unknown as NoteCategory, note: 'Note 1' }],
      urls: [{ category: 'manufacturer' as unknown as UrlCategory, url: 'https://example.com' }]
    };

    describe('happy path scenarios', () => {
      test('should edit mold with updated values', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme Updated')
          .onInput(/^Product number/i, 'TRF-UPD')
          .onInput(/^Description/i, 'Updated description')
          .onInput(/^Number of columns/i, '6')
          .onInput(/^Number of rows/i, '5')
          .onInput(/^Cavity weight/i, '12.0')
          .onMenu(/mold format/i, 'series-2000')
          .onMenu(/cavity configuration/i, 'grid')
          .onConfirm(/weight/i, true)
          .install(mocks);

        expect(await promptEditMold(existingMold)).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('acme-trf-original');
          expect(entity.manufacturer).toBe('Acme Updated');
          expect(entity.productNumber).toBe('TRF-UPD');
          expect(entity.description).toBe('Updated description');
          expect(entity.format).toBe('series-2000');
          if (entity.cavities.kind === 'grid') {
            expect(entity.cavities.columns).toBe(6);
            expect(entity.cavities.rows).toBe(5);
          }
          expect(entity.cavities.info?.weight).toBe(12);
          // Preserved fields
          expect(entity.tags).toEqual(['tag1', 'tag2']);
          expect(entity.notes).toEqual(existingMold.notes);
          expect(entity.urls).toEqual(existingMold.urls);
        });
      });

      test('should preserve existing cavity info when not editing weight', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, '4')
          .onInput(/^Number of rows/i, '3')
          .onMenu(/mold format/i, 'series-1000')
          .onMenu(/cavity configuration/i, 'grid')
          .onConfirm(/weight/i, false)
          .install(mocks);

        expect(await promptEditMold(existingMold)).toSucceedAndSatisfy((entity) => {
          expect(entity.cavities.info).toEqual(existingMold.cavities.info);
        });
      });

      test('should change from grid to count cavities', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onInput(/^Number of cavities/i, '20')
          .onMenu(/mold format/i, 'series-2000')
          .onMenu(/cavity configuration/i, 'count')
          .onConfirm(/weight/i, false)
          .install(mocks);

        expect(await promptEditMold(existingMold)).toSucceedAndSatisfy((entity) => {
          expect(entity.cavities.kind).toBe('count');
          if (entity.cavities.kind === 'count') {
            expect(entity.cavities.count).toBe(20);
          }
        });
      });

      test('should change from count to grid cavities', async () => {
        const countMold: Entities.IMoldEntity = {
          ...existingMold,
          cavities: { kind: 'count', count: 24 }
        };

        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, '6')
          .onInput(/^Number of rows/i, '4')
          .onMenu(/mold format/i, 'series-1000')
          .onMenu(/cavity configuration/i, 'grid')
          .onConfirm(/weight/i, false)
          .install(mocks);

        expect(await promptEditMold(countMold)).toSucceedAndSatisfy((entity) => {
          expect(entity.cavities.kind).toBe('grid');
          if (entity.cavities.kind === 'grid') {
            expect(entity.cavities.columns).toBe(6);
            expect(entity.cavities.rows).toBe(4);
          }
        });
      });

      test('should add weight when none existed previously', async () => {
        const moldWithoutWeight: Entities.IMoldEntity = {
          ...existingMold,
          cavities: { kind: 'grid', columns: 4, rows: 3 }
        };

        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, '4')
          .onInput(/^Number of rows/i, '3')
          .onInput(/^Cavity weight/i, '8.5')
          .onMenu(/mold format/i, 'series-1000')
          .onMenu(/cavity configuration/i, 'grid')
          .onConfirm(/weight/i, true)
          .install(mocks);

        expect(await promptEditMold(moldWithoutWeight)).toSucceedAndSatisfy((entity) => {
          expect(entity.cavities.info?.weight).toBe(8.5);
        });
      });

      test('should preserve tags, related, notes, urls from existing', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, '4')
          .onInput(/^Number of rows/i, '3')
          .onMenu(/mold format/i, 'series-1000')
          .onMenu(/cavity configuration/i, 'grid')
          .onConfirm(/weight/i, false)
          .install(mocks);

        expect(await promptEditMold(existingMold)).toSucceedAndSatisfy((entity) => {
          expect(entity.tags).toEqual(existingMold.tags);
          expect(entity.related).toEqual(existingMold.related);
          expect(entity.notes).toEqual(existingMold.notes);
          expect(entity.urls).toEqual(existingMold.urls);
        });
      });
    });

    describe('validation failure scenarios', () => {
      test('should return failure for empty manufacturer during edit', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, '   ')
          .install(mocks);

        expect(await promptEditMold(existingMold)).toFailWith(/manufacturer is required/i);
      });

      test('should return failure for empty product number during edit', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, '')
          .install(mocks);

        expect(await promptEditMold(existingMold)).toFailWith(/product number is required/i);
      });

      test('should return failure when format menu is cancelled during edit', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onMenuBack(/mold format/i)
          .install(mocks);

        expect(await promptEditMold(existingMold)).toFailWith(/mold format selection cancelled/i);
      });

      test('should return failure when cavity kind menu is cancelled during edit', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onMenu(/mold format/i, 'series-1000')
          .onMenuBack(/cavity configuration/i)
          .install(mocks);

        expect(await promptEditMold(existingMold)).toFailWith(/cavity configuration selection cancelled/i);
      });

      test('should return failure for non-positive columns during edit', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, '-1')
          .onMenu(/mold format/i, 'series-1000')
          .onMenu(/cavity configuration/i, 'grid')
          .install(mocks);

        expect(await promptEditMold(existingMold)).toFailWith(/columns must be a positive integer/i);
      });

      test('should return failure for non-positive rows during edit', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, '5')
          .onInput(/^Number of rows/i, '0')
          .onMenu(/mold format/i, 'series-1000')
          .onMenu(/cavity configuration/i, 'grid')
          .install(mocks);

        expect(await promptEditMold(existingMold)).toFailWith(/rows must be a positive integer/i);
      });

      test('should return failure for non-positive count during edit', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onInput(/^Number of cavities/i, '-5')
          .onMenu(/mold format/i, 'series-2000')
          .onMenu(/cavity configuration/i, 'count')
          .install(mocks);

        expect(await promptEditMold(existingMold)).toFailWith(/count must be a positive integer/i);
      });

      test('should return failure for invalid weight value during edit', async () => {
        createResponder()
          .onInput(/^Manufacturer/i, 'Acme')
          .onInput(/^Product number/i, 'TRF')
          .onInput(/^Description/i, '')
          .onInput(/^Number of columns/i, '4')
          .onInput(/^Number of rows/i, '3')
          .onInput(/^Cavity weight/i, 'bad-weight')
          .onMenu(/mold format/i, 'series-1000')
          .onMenu(/cavity configuration/i, 'grid')
          .onConfirm(/weight/i, true)
          .install(mocks);

        expect(await promptEditMold(existingMold)).toFailWith(/invalid weight value/i);
      });
    });
  });
});
