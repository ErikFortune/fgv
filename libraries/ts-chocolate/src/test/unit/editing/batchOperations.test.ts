// Copyright (c) 2024 Erik Fortune
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
import { fail, succeed } from '@fgv/ts-utils';
import { BatchExecutor, IBatchOperation, createOperation, noOpRollback } from '../../../packlets/editing';

describe('BatchOperations', () => {
  describe('BatchExecutor', () => {
    describe('execute', () => {
      test('should execute empty batch successfully', () => {
        expect(BatchExecutor.execute([])).toSucceedAndSatisfy((result) => {
          expect(result.success).toBe(true);
          expect(result.results).toEqual([]);
          expect(result.errors).toEqual([]);
          expect(result.successCount).toBe(0);
          expect(result.failureCount).toBe(0);
          expect(result.rolledBack).toBe(false);
          expect(result.rollbackErrors).toEqual([]);
        });
      });

      test('should execute single successful operation', () => {
        const operation: IBatchOperation<string> = {
          description: 'Test operation',
          execute: () => succeed('result'),
          rollback: () => succeed(undefined)
        };

        expect(BatchExecutor.execute([operation])).toSucceedAndSatisfy((result) => {
          expect(result.success).toBe(true);
          expect(result.results).toEqual(['result']);
          expect(result.errors).toEqual([]);
          expect(result.successCount).toBe(1);
          expect(result.failureCount).toBe(0);
          expect(result.rolledBack).toBe(false);
        });
      });

      test('should execute multiple successful operations', () => {
        const operations: Array<IBatchOperation<number>> = [
          {
            description: 'Op 1',
            execute: () => succeed(1),
            rollback: () => succeed(undefined)
          },
          {
            description: 'Op 2',
            execute: () => succeed(2),
            rollback: () => succeed(undefined)
          },
          {
            description: 'Op 3',
            execute: () => succeed(3),
            rollback: () => succeed(undefined)
          }
        ];

        expect(BatchExecutor.execute(operations)).toSucceedAndSatisfy((result) => {
          expect(result.success).toBe(true);
          expect(result.results).toEqual([1, 2, 3]);
          expect(result.successCount).toBe(3);
          expect(result.failureCount).toBe(0);
          expect(result.rolledBack).toBe(false);
        });
      });

      test('should rollback on first operation failure', () => {
        const operations: Array<IBatchOperation<string>> = [
          {
            description: 'Failing operation',
            execute: () => fail('Operation failed'),
            rollback: () => succeed(undefined)
          }
        ];

        expect(BatchExecutor.execute(operations)).toSucceedAndSatisfy((result) => {
          expect(result.success).toBe(false);
          expect(result.results).toEqual([]);
          expect(result.errors).toEqual(['Failing operation: Operation failed']);
          expect(result.successCount).toBe(0);
          expect(result.failureCount).toBe(1);
          expect(result.rolledBack).toBe(true);
          expect(result.rollbackErrors).toEqual([]);
        });
      });

      test('should rollback previous operations on failure', () => {
        const rollbackCalls: string[] = [];

        const operations: Array<IBatchOperation<number>> = [
          {
            description: 'Op 1',
            execute: () => succeed(1),
            rollback: () => {
              rollbackCalls.push('Op 1 rolled back');
              return succeed(undefined);
            }
          },
          {
            description: 'Op 2',
            execute: () => succeed(2),
            rollback: () => {
              rollbackCalls.push('Op 2 rolled back');
              return succeed(undefined);
            }
          },
          {
            description: 'Op 3 (fails)',
            execute: () => fail('Third operation failed'),
            rollback: () => succeed(undefined)
          }
        ];

        expect(BatchExecutor.execute(operations)).toSucceedAndSatisfy((result) => {
          expect(result.success).toBe(false);
          expect(result.results).toEqual([1, 2]);
          expect(result.errors).toEqual(['Op 3 (fails): Third operation failed']);
          expect(result.successCount).toBe(2);
          expect(result.failureCount).toBe(1);
          expect(result.rolledBack).toBe(true);
          expect(result.rollbackErrors).toEqual([]);
          // Rollback should happen in reverse order
          expect(rollbackCalls).toEqual(['Op 2 rolled back', 'Op 1 rolled back']);
        });
      });

      test('should record rollback errors but continue rollback', () => {
        const rollbackCalls: string[] = [];

        const operations: Array<IBatchOperation<number>> = [
          {
            description: 'Op 1',
            execute: () => succeed(1),
            rollback: () => {
              rollbackCalls.push('Op 1 rollback attempted');
              return fail('Op 1 rollback failed');
            }
          },
          {
            description: 'Op 2',
            execute: () => succeed(2),
            rollback: () => {
              rollbackCalls.push('Op 2 rolled back');
              return succeed(undefined);
            }
          },
          {
            description: 'Op 3 (fails)',
            execute: () => fail('Third operation failed'),
            rollback: () => succeed(undefined)
          }
        ];

        expect(BatchExecutor.execute(operations)).toSucceedAndSatisfy((result) => {
          expect(result.success).toBe(false);
          expect(result.rolledBack).toBe(true);
          expect(result.rollbackErrors).toEqual(['Failed to rollback "Op 1": Op 1 rollback failed']);
          // All rollbacks should be attempted even if some fail
          expect(rollbackCalls).toEqual(['Op 2 rolled back', 'Op 1 rollback attempted']);
        });
      });

      test('should handle void operations', () => {
        const executionOrder: string[] = [];

        const operations: Array<IBatchOperation<void>> = [
          {
            description: 'Void op 1',
            execute: () => {
              executionOrder.push('Op 1 executed');
              return succeed(undefined);
            },
            rollback: () => succeed(undefined)
          },
          {
            description: 'Void op 2',
            execute: () => {
              executionOrder.push('Op 2 executed');
              return succeed(undefined);
            },
            rollback: () => succeed(undefined)
          }
        ];

        expect(BatchExecutor.execute(operations)).toSucceedAndSatisfy((result) => {
          expect(result.success).toBe(true);
          expect(result.results).toHaveLength(2);
          expect(executionOrder).toEqual(['Op 1 executed', 'Op 2 executed']);
        });
      });
    });

    describe('executeOrFail', () => {
      test('should return success for successful batch', () => {
        const operations: Array<IBatchOperation<string>> = [
          {
            description: 'Op 1',
            execute: () => succeed('result'),
            rollback: () => succeed(undefined)
          }
        ];

        expect(BatchExecutor.executeOrFail(operations)).toSucceed();
      });

      test('should return failure with aggregated errors', () => {
        const operations: Array<IBatchOperation<string>> = [
          {
            description: 'Op 1',
            execute: () => succeed('result'),
            rollback: () => succeed(undefined)
          },
          {
            description: 'Op 2',
            execute: () => fail('Operation failed'),
            rollback: () => succeed(undefined)
          }
        ];

        expect(BatchExecutor.executeOrFail(operations)).toFailWith(/Op 2: Operation failed/i);
      });

      test('should include rollback errors in failure message', () => {
        const operations: Array<IBatchOperation<string>> = [
          {
            description: 'Op 1',
            execute: () => succeed('result'),
            rollback: () => fail('Rollback failed')
          },
          {
            description: 'Op 2',
            execute: () => fail('Operation failed'),
            rollback: () => succeed(undefined)
          }
        ];

        const result = BatchExecutor.executeOrFail(operations);
        expect(result).toFail();
        expect(result.isFailure() && result.message).toMatch(/Op 2: Operation failed/);
        expect(result.isFailure() && result.message).toMatch(/Rollback errors occurred/);
        expect(result.isFailure() && result.message).toMatch(/Failed to rollback "Op 1": Rollback failed/);
      });

      test('should succeed for empty batch', () => {
        expect(BatchExecutor.executeOrFail([])).toSucceed();
      });
    });
  });

  describe('createOperation', () => {
    test('should create operation with provided functions', () => {
      let executed = false;
      let rolledBack = false;

      const operation = createOperation(
        'Test operation',
        () => {
          executed = true;
          return succeed('result');
        },
        () => {
          rolledBack = true;
          return succeed(undefined);
        }
      );

      expect(operation.description).toBe('Test operation');

      const executeResult = operation.execute();
      expect(executeResult).toSucceedWith('result');
      expect(executed).toBe(true);

      const rollbackResult = operation.rollback();
      expect(rollbackResult).toSucceed();
      expect(rolledBack).toBe(true);
    });
  });

  describe('noOpRollback', () => {
    test('should return function that always succeeds', () => {
      const rollback = noOpRollback();
      expect(rollback()).toSucceed();
    });

    test('should be usable in operation creation', () => {
      const operation = createOperation('No rollback op', () => succeed('result'), noOpRollback());

      expect(operation.rollback()).toSucceed();
    });
  });

  describe('Integration tests', () => {
    test('should handle complex batch with mixed success and failure', () => {
      const state = { counter: 0, items: [] as string[] };

      const operations: Array<IBatchOperation<void>> = [
        {
          description: 'Increment counter',
          execute: () => {
            state.counter++;
            return succeed(undefined);
          },
          rollback: () => {
            state.counter--;
            return succeed(undefined);
          }
        },
        {
          description: 'Add item A',
          execute: () => {
            state.items.push('A');
            return succeed(undefined);
          },
          rollback: () => {
            state.items.pop();
            return succeed(undefined);
          }
        },
        {
          description: 'Add item B (fails)',
          execute: () => fail('Cannot add B'),
          rollback: () => succeed(undefined)
        }
      ];

      expect(BatchExecutor.execute(operations)).toSucceedAndSatisfy((result) => {
        expect(result.success).toBe(false);
        expect(result.rolledBack).toBe(true);
      });

      // State should be rolled back
      expect(state.counter).toBe(0);
      expect(state.items).toEqual([]);
    });

    test('should execute all operations when all succeed', () => {
      const state = { values: [] as number[] };

      const operations: Array<IBatchOperation<number>> = [
        {
          description: 'Add 1',
          execute: () => {
            state.values.push(1);
            return succeed(1);
          },
          rollback: () => {
            state.values.pop();
            return succeed(undefined);
          }
        },
        {
          description: 'Add 2',
          execute: () => {
            state.values.push(2);
            return succeed(2);
          },
          rollback: () => {
            state.values.pop();
            return succeed(undefined);
          }
        },
        {
          description: 'Add 3',
          execute: () => {
            state.values.push(3);
            return succeed(3);
          },
          rollback: () => {
            state.values.pop();
            return succeed(undefined);
          }
        }
      ];

      expect(BatchExecutor.execute(operations)).toSucceedAndSatisfy((result) => {
        expect(result.success).toBe(true);
        expect(result.results).toEqual([1, 2, 3]);
      });

      // State should contain all values
      expect(state.values).toEqual([1, 2, 3]);
    });
  });
});
