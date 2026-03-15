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

import { BaseProcedureId, TaskId } from '../../../../packlets/common';
import { Procedures } from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  validateProcedureEntity,
  validateProcedureName,
  validateStepOrder,
  validateStepTaskContent
} from '../../../../packlets/editing/procedures/validators';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { createBlankRawProcedureEntity } from '../../../../packlets/entities/procedures/model';

type IProcedureEntity = Procedures.IProcedureEntity;

const baseProcedure = (overrides?: Partial<IProcedureEntity>): IProcedureEntity => ({
  baseId: 'temper' as BaseProcedureId,
  name: 'Tempering',
  steps: [
    {
      order: 1,
      task: {
        taskId: 'common.melt' as TaskId,
        params: { temp: 45 }
      }
    }
  ],
  ...overrides
});

describe('procedure validators', () => {
  test('validateProcedureName succeeds for non-empty name', () => {
    expect(validateProcedureName(baseProcedure())).toSucceed();
  });

  test('validateProcedureName fails for empty name', () => {
    expect(validateProcedureName(baseProcedure({ name: '  ' }))).toFailWith(/must not be empty/i);
  });

  test('validateStepOrder succeeds for contiguous order', () => {
    expect(validateStepOrder(baseProcedure())).toSucceed();
  });

  test('validateStepOrder fails for non-contiguous order', () => {
    expect(
      validateStepOrder(
        baseProcedure({
          steps: [
            {
              order: 2,
              task: {
                taskId: 'common.melt' as TaskId,
                params: {}
              }
            }
          ]
        })
      )
    ).toFailWith(/contiguous/i);
  });

  test('validateStepTaskContent succeeds for task ref with taskId', () => {
    expect(validateStepTaskContent(baseProcedure())).toSucceed();
  });

  test('validateStepTaskContent fails for empty taskId', () => {
    expect(
      validateStepTaskContent(
        baseProcedure({
          steps: [
            {
              order: 1,
              task: {
                taskId: '  ' as TaskId,
                params: {}
              }
            }
          ]
        })
      )
    ).toFailWith(/taskId must not be empty/i);
  });

  test('validateStepTaskContent succeeds for inline task with template', () => {
    expect(
      validateStepTaskContent(
        baseProcedure({
          steps: [
            {
              order: 1,
              task: {
                task: {
                  baseId: 'inline' as never,
                  name: 'Inline Task',
                  template: 'Do {{thing}}'
                },
                params: { thing: 'x' }
              }
            }
          ]
        })
      )
    ).toSucceed();
  });

  test('validateStepTaskContent fails for empty inline task name', () => {
    expect(
      validateStepTaskContent(
        baseProcedure({
          steps: [
            {
              order: 1,
              task: {
                task: {
                  baseId: 'inline' as never,
                  name: '  ',
                  template: 'Do something'
                },
                params: {}
              }
            }
          ]
        })
      )
    ).toFailWith(/inline task name must not be empty/i);
  });

  test('validateStepTaskContent fails for empty inline task template', () => {
    expect(
      validateStepTaskContent(
        baseProcedure({
          steps: [
            {
              order: 1,
              task: {
                task: {
                  baseId: 'inline' as never,
                  name: 'Inline Task',
                  template: '  '
                },
                params: {}
              }
            }
          ]
        })
      )
    ).toFailWith(/template must not be empty/i);
  });

  test('validateProcedureEntity chains all validators', () => {
    const proc = baseProcedure();
    expect(validateProcedureEntity(proc)).toSucceedWith(proc);
  });
});

describe('createBlankRawProcedureEntity', () => {
  test('creates a minimal valid procedure', () => {
    const entity = createBlankRawProcedureEntity('my-proc' as BaseProcedureId, 'My Procedure');
    expect(entity.baseId).toBe('my-proc');
    expect(entity.name).toBe('My Procedure');
    expect(entity.steps).toEqual([]);
  });

  test('has no optional fields set', () => {
    const entity = createBlankRawProcedureEntity('my-proc' as BaseProcedureId, 'My Procedure');
    expect(entity.description).toBeUndefined();
    expect(entity.category).toBeUndefined();
    expect(entity.tags).toBeUndefined();
    expect(entity.notes).toBeUndefined();
  });
});
