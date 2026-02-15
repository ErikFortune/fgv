// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';
import { Molds } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  validateCavities,
  validateCavityDimensions,
  validateCavityWeight,
  validateMoldEntity
} from '../../../../packlets/editing/molds/validators';
import { BaseMoldId, Measurement, Millimeters } from '../../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { createBlankMoldEntity } from '../../../../packlets/entities/molds/model';

type IMoldEntity = Molds.IMoldEntity;

// Helper to create a valid base mold entity
const createBaseMold = (): IMoldEntity => ({
  baseId: 'test-mold' as BaseMoldId,
  manufacturer: 'Test Manufacturer',
  productNumber: 'TM-100',
  cavities: { kind: 'grid', columns: 3, rows: 8 },
  format: 'other'
});

describe('validateCavities', () => {
  test('should succeed for valid grid cavities', () => {
    const mold = createBaseMold();
    expect(validateCavities(mold)).toSucceed();
  });

  test('should succeed for valid count cavities', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: { kind: 'count', count: 24 }
    };
    expect(validateCavities(mold)).toSucceed();
  });

  test('should fail if grid columns is less than 1', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: { kind: 'grid', columns: 0, rows: 8 }
    };
    expect(validateCavities(mold)).toFailWith(/columns must be at least 1/i);
  });

  test('should fail if grid rows is less than 1', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: { kind: 'grid', columns: 3, rows: 0 }
    };
    expect(validateCavities(mold)).toFailWith(/rows must be at least 1/i);
  });

  test('should fail if count is less than 1', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: { kind: 'count', count: 0 }
    };
    expect(validateCavities(mold)).toFailWith(/count must be at least 1/i);
  });

  test('should succeed for grid with columns and rows of 1', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: { kind: 'grid', columns: 1, rows: 1 }
    };
    expect(validateCavities(mold)).toSucceed();
  });

  test('should succeed for count of 1', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: { kind: 'count', count: 1 }
    };
    expect(validateCavities(mold)).toSucceed();
  });
});

describe('validateCavityDimensions', () => {
  test('should succeed when no dimensions are present', () => {
    const mold = createBaseMold();
    expect(validateCavityDimensions(mold)).toSucceed();
  });

  test('should succeed when no info is present', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: { kind: 'grid', columns: 3, rows: 8 }
    };
    expect(validateCavityDimensions(mold)).toSucceed();
  });

  test('should succeed for valid dimensions', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: {
        kind: 'grid',
        columns: 3,
        rows: 8,
        info: {
          dimensions: {
            width: 25 as Millimeters,
            length: 25 as Millimeters,
            depth: 12 as Millimeters
          }
        }
      }
    };
    expect(validateCavityDimensions(mold)).toSucceed();
  });

  test('should fail if width is zero', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: {
        kind: 'grid',
        columns: 3,
        rows: 8,
        info: {
          dimensions: {
            width: 0 as Millimeters,
            length: 25 as Millimeters,
            depth: 12 as Millimeters
          }
        }
      }
    };
    expect(validateCavityDimensions(mold)).toFailWith(/width must be positive/i);
  });

  test('should fail if length is negative', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: {
        kind: 'grid',
        columns: 3,
        rows: 8,
        info: {
          dimensions: {
            width: 25 as Millimeters,
            length: -5 as Millimeters,
            depth: 12 as Millimeters
          }
        }
      }
    };
    expect(validateCavityDimensions(mold)).toFailWith(/length must be positive/i);
  });

  test('should fail if depth is zero', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: {
        kind: 'grid',
        columns: 3,
        rows: 8,
        info: {
          dimensions: {
            width: 25 as Millimeters,
            length: 25 as Millimeters,
            depth: 0 as Millimeters
          }
        }
      }
    };
    expect(validateCavityDimensions(mold)).toFailWith(/depth must be positive/i);
  });
});

describe('validateCavityWeight', () => {
  test('should succeed when no weight is present', () => {
    const mold = createBaseMold();
    expect(validateCavityWeight(mold)).toSucceed();
  });

  test('should succeed for positive weight', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: {
        kind: 'grid',
        columns: 3,
        rows: 8,
        info: { weight: 10 as Measurement }
      }
    };
    expect(validateCavityWeight(mold)).toSucceed();
  });

  test('should fail if weight is zero', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: {
        kind: 'grid',
        columns: 3,
        rows: 8,
        info: { weight: 0 as Measurement }
      }
    };
    expect(validateCavityWeight(mold)).toFailWith(/weight must be positive/i);
  });

  test('should fail if weight is negative', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: {
        kind: 'grid',
        columns: 3,
        rows: 8,
        info: { weight: -5 as Measurement }
      }
    };
    expect(validateCavityWeight(mold)).toFailWith(/weight must be positive/i);
  });
});

describe('validateMoldEntity', () => {
  test('should succeed for a completely valid mold', () => {
    const mold = createBaseMold();
    expect(validateMoldEntity(mold)).toSucceedAndSatisfy((result) => {
      expect(result.baseId).toBe('test-mold');
    });
  });

  test('should succeed for a mold with all optional fields', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      description: 'Test sphere mold',
      tags: ['sphere', 'bonbon'],
      notes: [{ category: 'user' as never, note: 'Great mold' }],
      urls: [{ category: 'manufacturer' as never, url: 'https://example.com' }],
      cavities: {
        kind: 'grid',
        columns: 3,
        rows: 8,
        info: {
          weight: 10 as Measurement,
          dimensions: {
            width: 25 as Millimeters,
            length: 25 as Millimeters,
            depth: 12 as Millimeters
          }
        }
      }
    };
    expect(validateMoldEntity(mold)).toSucceed();
  });

  test('should fail if cavities are invalid', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: { kind: 'grid', columns: 0, rows: 8 }
    };
    expect(validateMoldEntity(mold)).toFailWith(/columns must be at least 1/i);
  });

  test('should fail if dimensions are invalid', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: {
        kind: 'grid',
        columns: 3,
        rows: 8,
        info: {
          dimensions: {
            width: 0 as Millimeters,
            length: 25 as Millimeters,
            depth: 12 as Millimeters
          }
        }
      }
    };
    expect(validateMoldEntity(mold)).toFailWith(/width must be positive/i);
  });

  test('should fail if weight is invalid', () => {
    const mold: IMoldEntity = {
      ...createBaseMold(),
      cavities: {
        kind: 'grid',
        columns: 3,
        rows: 8,
        info: { weight: -1 as Measurement }
      }
    };
    expect(validateMoldEntity(mold)).toFailWith(/weight must be positive/i);
  });
});

describe('createBlankMoldEntity', () => {
  test('should create a valid mold entity with defaults', () => {
    const mold = createBlankMoldEntity('test-mold' as BaseMoldId, 'Test Manufacturer');
    expect(mold.baseId).toBe('test-mold');
    expect(mold.manufacturer).toBe('Test Manufacturer');
    expect(mold.productNumber).toBe('');
    expect(mold.cavities.kind).toBe('grid');
    expect(mold.format).toBe('other');
  });

  test('should produce a mold that passes validation', () => {
    const mold = createBlankMoldEntity('valid-mold' as BaseMoldId, 'Chocolate World');
    expect(validateMoldEntity(mold)).toSucceed();
  });
});
