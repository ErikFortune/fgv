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

// eslint-disable-next-line @rushstack/packlets/mechanics
import { procedureStep, procedureData } from '../../../packlets/entities/procedures/converters';

import { BaseTaskId } from '../../../packlets/common';
import { ITaskInvocation } from '../../../packlets/entities';

/**
 * Helper to create an inline task for test data.
 * Creates a synthetic baseId from the template for testing purposes.
 */
function inlineTask(template: string): ITaskInvocation {
  const baseId = `test-inline-${template.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}` as BaseTaskId;
  return {
    task: {
      baseId,
      name: template.slice(0, 30),
      template
    },
    params: {}
  };
}

describe('Procedure Converters', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const validProcedureStep = {
    order: 1,
    task: inlineTask('Melt chocolate to 45C'),
    activeTime: 5,
    temperature: 45
  };

  const validProcedureData = {
    baseId: 'ganache-cold-method',
    name: 'Ganache (Cold Method)',
    category: 'ganache',
    steps: [
      { order: 1, task: inlineTask('Melt chocolate to 45C'), activeTime: 5, temperature: 45 },
      { order: 2, task: inlineTask('Warm cream to 35C'), activeTime: 3, temperature: 35 },
      { order: 3, task: inlineTask('Combine and emulsify'), activeTime: 5 },
      { order: 4, task: inlineTask('Rest at room temperature'), waitTime: 30 }
    ],
    tags: ['ganache', 'cold-process']
  };

  // ============================================================================
  // procedureStep Converter
  // ============================================================================

  describe('procedureStep', () => {
    test('converts valid procedure step with all fields', () => {
      const input = {
        order: 1,
        task: inlineTask('Melt chocolate'),
        activeTime: 5,
        waitTime: 2,
        holdTime: 10,
        temperature: 45,
        notes: [{ category: 'user', note: 'Use double boiler' }]
      };
      expect(procedureStep.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.order).toBe(1);
        expect(result.task).toEqual(inlineTask('Melt chocolate'));
        expect(result.activeTime).toBe(5);
        expect(result.waitTime).toBe(2);
        expect(result.holdTime).toBe(10);
        expect(result.temperature).toBe(45);
        expect(result.notes).toEqual([{ category: 'user', note: 'Use double boiler' }]);
      });
    });

    test('converts step with only required fields', () => {
      const input = {
        order: 1,
        task: inlineTask('Stir gently')
      };
      expect(procedureStep.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.order).toBe(1);
        expect(result.task).toEqual(inlineTask('Stir gently'));
        expect(result.activeTime).toBeUndefined();
        expect(result.waitTime).toBeUndefined();
        expect(result.holdTime).toBeUndefined();
        expect(result.temperature).toBeUndefined();
        expect(result.notes).toBeUndefined();
      });
    });

    test('fails for missing order', () => {
      const input = {
        task: inlineTask('Stir gently')
      };
      expect(procedureStep.convert(input)).toFail();
    });

    test('fails for missing task', () => {
      const input = {
        order: 1
      };
      expect(procedureStep.convert(input)).toFail();
    });

    test('fails for non-numeric order', () => {
      const input = {
        ...validProcedureStep,
        order: 'first'
      };
      expect(procedureStep.convert(input)).toFail();
    });

    test('fails for invalid task structure', () => {
      const input = {
        ...validProcedureStep,
        task: { invalid: true }
      };
      expect(procedureStep.convert(input)).toFail();
    });

    test('fails for non-numeric activeTime', () => {
      const input = {
        ...validProcedureStep,
        activeTime: 'five'
      };
      expect(procedureStep.convert(input)).toFail();
    });

    test('fails for negative activeTime', () => {
      const input = {
        ...validProcedureStep,
        activeTime: -5
      };
      expect(procedureStep.convert(input)).toFail();
    });

    test('fails for negative waitTime', () => {
      const input = {
        ...validProcedureStep,
        waitTime: -10
      };
      expect(procedureStep.convert(input)).toFail();
    });

    test('fails for negative holdTime', () => {
      const input = {
        ...validProcedureStep,
        holdTime: -15
      };
      expect(procedureStep.convert(input)).toFail();
    });

    test('converts with negative temperature (e.g., freezing)', () => {
      const input = {
        ...validProcedureStep,
        temperature: -20
      };
      expect(procedureStep.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.temperature).toBe(-20);
      });
    });

    test('converts with zero times', () => {
      const input = {
        order: 1,
        task: inlineTask('Quick step'),
        activeTime: 0,
        waitTime: 0,
        holdTime: 0
      };
      expect(procedureStep.convert(input)).toSucceed();
    });

    test('converts step with ref task', () => {
      const input = {
        order: 1,
        task: {
          taskId: 'common.melt-chocolate',
          params: { temp: 45 }
        }
      };
      expect(procedureStep.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.order).toBe(1);
        expect(result.task).toHaveProperty('taskId');
      });
    });
  });

  // ============================================================================
  // procedureData Converter
  // ============================================================================

  describe('procedureData', () => {
    test('converts valid procedure data with all fields', () => {
      expect(procedureData.convert(validProcedureData)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('ganache-cold-method');
        expect(result.name).toBe('Ganache (Cold Method)');
        expect(result.category).toBe('ganache');
        expect(result.steps).toHaveLength(4);
        expect(result.tags).toEqual(['ganache', 'cold-process']);
      });
    });

    test('converts procedure data with only required fields', () => {
      const input = {
        baseId: 'simple-procedure',
        name: 'Simple Procedure',
        steps: [{ order: 1, task: inlineTask('Do the thing') }]
      };
      expect(procedureData.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('simple-procedure');
        expect(result.name).toBe('Simple Procedure');
        expect(result.category).toBeUndefined();
        expect(result.description).toBeUndefined();
        expect(result.tags).toBeUndefined();
        expect(result.notes).toBeUndefined();
        expect(result.steps).toHaveLength(1);
      });
    });

    test('converts procedure with description and notes', () => {
      const input = {
        ...validProcedureData,
        description: 'A cold method for making ganache',
        notes: [{ category: 'user', note: 'Works best with dark chocolate' }]
      };
      expect(procedureData.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.description).toBe('A cold method for making ganache');
        expect(result.notes).toEqual([{ category: 'user', note: 'Works best with dark chocolate' }]);
      });
    });

    test('fails for missing baseId', () => {
      const input = {
        name: 'Test',
        steps: [{ order: 1, task: inlineTask('Step') }]
      };
      expect(procedureData.convert(input)).toFail();
    });

    test('fails for invalid baseId (contains dot)', () => {
      const input = {
        ...validProcedureData,
        baseId: 'invalid.id'
      };
      expect(procedureData.convert(input)).toFail();
    });

    test('fails for missing name', () => {
      const input = {
        baseId: 'test',
        steps: [{ order: 1, task: inlineTask('Step') }]
      };
      expect(procedureData.convert(input)).toFail();
    });

    test('fails for missing steps', () => {
      const input = {
        baseId: 'test',
        name: 'Test'
      };
      expect(procedureData.convert(input)).toFail();
    });

    test('fails for empty steps array', () => {
      const input = {
        baseId: 'test',
        name: 'Test',
        steps: []
      };
      // Empty array is valid in terms of conversion
      expect(procedureData.convert(input)).toSucceed();
    });

    test('fails for invalid category', () => {
      const input = {
        ...validProcedureData,
        category: 'invalid-category'
      };
      expect(procedureData.convert(input)).toFail();
    });

    test('fails for invalid step in steps array', () => {
      const input = {
        ...validProcedureData,
        steps: [
          { order: 1, task: inlineTask('Valid step') },
          { order: 2 } // Missing task
        ]
      };
      expect(procedureData.convert(input)).toFail();
    });

    test('fails for non-array tags', () => {
      const input = {
        ...validProcedureData,
        tags: 'not-an-array'
      };
      expect(procedureData.convert(input)).toFail();
    });

    test('fails for non-string tag values', () => {
      const input = {
        ...validProcedureData,
        tags: [123, 456]
      };
      expect(procedureData.convert(input)).toFail();
    });

    test('converts with all valid recipe categories', () => {
      const categories = ['ganache', 'caramel', 'gianduja'];
      categories.forEach((category) => {
        const input = {
          ...validProcedureData,
          category
        };
        expect(procedureData.convert(input)).toSucceedAndSatisfy((result) => {
          expect(result.category).toBe(category);
        });
      });
    });
  });
});
