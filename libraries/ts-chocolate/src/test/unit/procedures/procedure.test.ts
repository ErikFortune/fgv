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
import { Procedure } from '../../../packlets/procedures/procedure';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { IProcedure, IProcedureStep } from '../../../packlets/procedures/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { IProcedureRenderContext } from '../../../packlets/procedures/renderContext';
import { BaseProcedureId, Celsius, Minutes } from '../../../packlets/common';
import { IComputedScaledRecipe } from '../../../packlets/recipes';

describe('Procedure', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const steps: IProcedureStep[] = [
    {
      order: 1,
      description: 'Melt chocolate to 45C',
      activeTime: 5 as Minutes,
      temperature: 45 as Celsius
    },
    {
      order: 2,
      description: 'Warm cream to 35C',
      activeTime: 3 as Minutes,
      temperature: 35 as Celsius
    },
    {
      order: 3,
      description: 'Combine and emulsify',
      activeTime: 5 as Minutes
    },
    {
      order: 4,
      description: 'Rest at room temperature',
      waitTime: 30 as Minutes
    }
  ];

  const validProcedureData: IProcedure = {
    baseId: 'ganache-cold-method' as BaseProcedureId,
    name: 'Ganache (Cold Method)',
    description: 'A cold method for making ganache',
    category: 'ganache',
    steps,
    tags: ['ganache', 'cold-process'],
    notes: 'Works best with dark chocolate'
  };

  const minimalProcedureData: IProcedure = {
    baseId: 'simple-procedure' as BaseProcedureId,
    name: 'Simple Procedure',
    steps: [{ order: 1, description: 'Do something' }]
  };

  const procedureWithAllTimes: IProcedure = {
    baseId: 'full-timing' as BaseProcedureId,
    name: 'Full Timing Procedure',
    steps: [
      { order: 1, description: 'Active step', activeTime: 10 as Minutes },
      { order: 2, description: 'Wait step', waitTime: 20 as Minutes },
      { order: 3, description: 'Hold step', holdTime: 15 as Minutes },
      { order: 4, description: 'Combined step', activeTime: 5 as Minutes, waitTime: 10 as Minutes }
    ]
  };

  // ============================================================================
  // Procedure.create()
  // ============================================================================

  describe('Procedure.create()', () => {
    test('creates procedure with all fields', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.baseId).toBe('ganache-cold-method');
        expect(procedure.name).toBe('Ganache (Cold Method)');
        expect(procedure.description).toBe('A cold method for making ganache');
        expect(procedure.category).toBe('ganache');
        expect(procedure.steps).toHaveLength(4);
        expect(procedure.tags).toEqual(['ganache', 'cold-process']);
        expect(procedure.notes).toBe('Works best with dark chocolate');
      });
    });

    test('creates procedure with only required fields', () => {
      expect(Procedure.create(minimalProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.baseId).toBe('simple-procedure');
        expect(procedure.name).toBe('Simple Procedure');
        expect(procedure.description).toBeUndefined();
        expect(procedure.category).toBeUndefined();
        expect(procedure.tags).toBeUndefined();
        expect(procedure.notes).toBeUndefined();
        expect(procedure.steps).toHaveLength(1);
      });
    });
  });

  // ============================================================================
  // Time calculations
  // ============================================================================

  describe('totalActiveTime', () => {
    test('returns total active time from all steps', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalActiveTime).toBe(13); // 5 + 3 + 5
      });
    });

    test('returns undefined when no steps have active time', () => {
      const noActiveTimeData: IProcedure = {
        baseId: 'no-active' as BaseProcedureId,
        name: 'No Active Time',
        steps: [
          { order: 1, description: 'Wait', waitTime: 30 as Minutes },
          { order: 2, description: 'Hold', holdTime: 15 as Minutes }
        ]
      };
      expect(Procedure.create(noActiveTimeData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalActiveTime).toBeUndefined();
      });
    });

    test('calculates correctly with mixed steps', () => {
      expect(Procedure.create(procedureWithAllTimes)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalActiveTime).toBe(15); // 10 + 5
      });
    });
  });

  describe('totalWaitTime', () => {
    test('returns total wait time from all steps', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalWaitTime).toBe(30);
      });
    });

    test('returns undefined when no steps have wait time', () => {
      const noWaitTimeData: IProcedure = {
        baseId: 'no-wait' as BaseProcedureId,
        name: 'No Wait Time',
        steps: [
          { order: 1, description: 'Active', activeTime: 10 as Minutes },
          { order: 2, description: 'Hold', holdTime: 15 as Minutes }
        ]
      };
      expect(Procedure.create(noWaitTimeData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalWaitTime).toBeUndefined();
      });
    });

    test('calculates correctly with mixed steps', () => {
      expect(Procedure.create(procedureWithAllTimes)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalWaitTime).toBe(30); // 20 + 10
      });
    });
  });

  describe('totalHoldTime', () => {
    test('returns total hold time from all steps', () => {
      expect(Procedure.create(procedureWithAllTimes)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalHoldTime).toBe(15);
      });
    });

    test('returns undefined when no steps have hold time', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalHoldTime).toBeUndefined();
      });
    });
  });

  describe('totalTime', () => {
    test('returns sum of all time types', () => {
      expect(Procedure.create(procedureWithAllTimes)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalTime).toBe(60); // 15 active + 30 wait + 15 hold
      });
    });

    test('returns correct value when only active time exists', () => {
      const onlyActiveData: IProcedure = {
        baseId: 'only-active' as BaseProcedureId,
        name: 'Only Active',
        steps: [{ order: 1, description: 'Active', activeTime: 10 as Minutes }]
      };
      expect(Procedure.create(onlyActiveData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalTime).toBe(10);
      });
    });

    test('returns undefined when no timing data exists', () => {
      expect(Procedure.create(minimalProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.totalTime).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // stepCount
  // ============================================================================

  describe('stepCount', () => {
    test('returns number of steps', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.stepCount).toBe(4);
      });
    });

    test('returns 1 for single-step procedure', () => {
      expect(Procedure.create(minimalProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.stepCount).toBe(1);
      });
    });
  });

  // ============================================================================
  // isCategorySpecific
  // ============================================================================

  describe('isCategorySpecific', () => {
    test('returns true when category is defined', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.isCategorySpecific).toBe(true);
      });
    });

    test('returns false when category is undefined', () => {
      expect(Procedure.create(minimalProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.isCategorySpecific).toBe(false);
      });
    });
  });

  // ============================================================================
  // render()
  // ============================================================================

  describe('render()', () => {
    // Create a minimal render context for testing
    const mockContext: IProcedureRenderContext = {
      library: {},
      recipe: {
        scaledFrom: {
          sourceVersionId: 'test.recipe@2026-01-01-01',
          scaleFactor: 1,
          targetWeight: 100
        },
        createdDate: '2026-01-01',
        ingredients: [],
        baseWeight: 100
      } as unknown as IComputedScaledRecipe
    };

    test('renders procedure with steps', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.render(mockContext)).toSucceedAndSatisfy((rendered) => {
          expect(rendered.name).toBe('Ganache (Cold Method)');
          expect(rendered.description).toBe('A cold method for making ganache');
          expect(rendered.steps).toHaveLength(4);
        });
      });
    });

    test('rendered steps have renderedDescription matching description', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.render(mockContext)).toSucceedAndSatisfy((rendered) => {
          rendered.steps.forEach((step, index) => {
            expect(step.renderedDescription).toBe(validProcedureData.steps[index].description);
          });
        });
      });
    });

    test('rendered procedure includes timing totals', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.render(mockContext)).toSucceedAndSatisfy((rendered) => {
          expect(rendered.totalActiveTime).toBe(13);
          expect(rendered.totalWaitTime).toBe(30);
          expect(rendered.totalHoldTime).toBeUndefined();
        });
      });
    });

    test('rendered steps preserve all original step properties', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        expect(procedure.render(mockContext)).toSucceedAndSatisfy((rendered) => {
          const firstStep = rendered.steps[0];
          expect(firstStep.order).toBe(1);
          expect(firstStep.description).toBe('Melt chocolate to 45C');
          expect(firstStep.activeTime).toBe(5);
          expect(firstStep.temperature).toBe(45);
        });
      });
    });
  });

  // ============================================================================
  // IProcedure interface implementation
  // ============================================================================

  describe('IProcedure interface implementation', () => {
    test('implements all IProcedure properties', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        // Required properties
        expect(typeof procedure.baseId).toBe('string');
        expect(typeof procedure.name).toBe('string');
        expect(Array.isArray(procedure.steps)).toBe(true);

        // Optional properties
        expect(procedure.description).toBeDefined();
        expect(procedure.category).toBeDefined();
        expect(procedure.tags).toBeDefined();
        expect(procedure.notes).toBeDefined();
      });
    });

    test('procedure can be used as IProcedure', () => {
      expect(Procedure.create(validProcedureData)).toSucceedAndSatisfy((procedure) => {
        // Type check - this compiles if Procedure implements IProcedure correctly
        const procedureInterface: IProcedure = procedure;
        expect(procedureInterface.baseId).toBe(procedure.baseId);
      });
    });
  });
});
