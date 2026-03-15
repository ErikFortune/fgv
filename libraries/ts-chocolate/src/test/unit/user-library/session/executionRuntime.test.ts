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
import { ExecutionRuntime } from '../../../../packlets/user-library/session/executionRuntime';
import { IExecutionState, IStepExecutionEntry, IProcedureStepEntity } from '../../../../packlets/entities';
import { NoteCategory, TaskId, Model as CommonModel } from '../../../../packlets/common';

// ============================================================================
// Test Data Helpers
// ============================================================================

function makeStep(order: number): IProcedureStepEntity {
  return {
    order,
    task: {
      taskId: `task-${order}` as unknown as TaskId,
      params: {}
    }
  };
}

function makeSteps(count: number): ReadonlyArray<IProcedureStepEntity> {
  return Array.from({ length: count }, (_, i) => makeStep(i + 1));
}

function makeInitialState(currentStepIndex: number = 0, log: IStepExecutionEntry[] = []): IExecutionState {
  return {
    currentStepIndex,
    executionLog: log,
    startedAt: '2026-01-01T10:00:00.000Z'
  };
}

function makeActiveState(
  stepIndex: number = 0,
  startedAt: string = '2026-01-01T10:00:00.000Z'
): IExecutionState {
  return {
    currentStepIndex: stepIndex,
    executionLog: [
      {
        stepIndex,
        status: 'active',
        startedAt
      }
    ],
    startedAt: '2026-01-01T10:00:00.000Z'
  };
}

describe('ExecutionRuntime', () => {
  // ============================================================================
  // Factory
  // ============================================================================

  describe('from()', () => {
    test('creates an instance from state and steps', () => {
      const state = makeActiveState(0);
      const steps = makeSteps(3);
      const runtime = ExecutionRuntime.from(state, steps);
      expect(runtime).toBeInstanceOf(ExecutionRuntime);
    });

    test('creates an instance with empty steps array', () => {
      const state = makeInitialState(0);
      const runtime = ExecutionRuntime.from(state, []);
      expect(runtime).toBeInstanceOf(ExecutionRuntime);
      expect(runtime.totalSteps).toBe(0);
    });

    test('creates an instance with a single step', () => {
      const state = makeActiveState(0);
      const steps = makeSteps(1);
      const runtime = ExecutionRuntime.from(state, steps);
      expect(runtime.totalSteps).toBe(1);
    });
  });

  // ============================================================================
  // initialize()
  // ============================================================================

  describe('initialize()', () => {
    test('creates initial state for multiple steps', () => {
      const steps = makeSteps(3);
      const state = ExecutionRuntime.initialize(steps);

      expect(state.currentStepIndex).toBe(0);
      expect(state.executionLog).toHaveLength(1);
      expect(state.executionLog[0].stepIndex).toBe(0);
      expect(state.executionLog[0].status).toBe('active');
      expect(state.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('creates initial state with empty steps array - no log entries', () => {
      const state = ExecutionRuntime.initialize([]);

      expect(state.currentStepIndex).toBe(0);
      expect(state.executionLog).toHaveLength(0);
      expect(state.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('creates initial state for a single step', () => {
      const steps = makeSteps(1);
      const state = ExecutionRuntime.initialize(steps);

      expect(state.currentStepIndex).toBe(0);
      expect(state.executionLog).toHaveLength(1);
      expect(state.executionLog[0].status).toBe('active');
    });
  });

  // ============================================================================
  // Accessors
  // ============================================================================

  describe('state', () => {
    test('returns the underlying persisted execution state', () => {
      const state = makeActiveState(1);
      const steps = makeSteps(3);
      const runtime = ExecutionRuntime.from(state, steps);

      expect(runtime.state).toBe(state);
    });
  });

  describe('currentStepIndex', () => {
    test('returns 0 for a fresh runtime at step 0', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      expect(runtime.currentStepIndex).toBe(0);
    });

    test('returns the current step index from state', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(2), makeSteps(3));
      expect(runtime.currentStepIndex).toBe(2);
    });
  });

  describe('totalSteps', () => {
    test('returns 0 for empty steps array', () => {
      const runtime = ExecutionRuntime.from(makeInitialState(), []);
      expect(runtime.totalSteps).toBe(0);
    });

    test('returns the number of procedure steps', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(5));
      expect(runtime.totalSteps).toBe(5);
    });
  });

  describe('isComplete', () => {
    test('returns false when at step 0 with multiple steps', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      expect(runtime.isComplete).toBe(false);
    });

    test('returns false when in the middle of steps', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(1), makeSteps(3));
      expect(runtime.isComplete).toBe(false);
    });

    test('returns true when currentStepIndex equals totalSteps', () => {
      const state = makeInitialState(3); // index 3 with 3 steps means complete
      const runtime = ExecutionRuntime.from(state, makeSteps(3));
      expect(runtime.isComplete).toBe(true);
    });

    test('returns true when currentStepIndex exceeds totalSteps', () => {
      const state = makeInitialState(5);
      const runtime = ExecutionRuntime.from(state, makeSteps(3));
      expect(runtime.isComplete).toBe(true);
    });

    test('returns true for empty steps array (already complete at index 0)', () => {
      const runtime = ExecutionRuntime.from(makeInitialState(0), []);
      expect(runtime.isComplete).toBe(true);
    });
  });

  describe('currentStep', () => {
    test('returns the step definition at currentStepIndex', () => {
      const steps = makeSteps(3);
      const runtime = ExecutionRuntime.from(makeActiveState(1), steps);
      expect(runtime.currentStep).toBe(steps[1]);
    });

    test('returns undefined when complete (index past end)', () => {
      const runtime = ExecutionRuntime.from(makeInitialState(3), makeSteps(3));
      expect(runtime.currentStep).toBeUndefined();
    });

    test('returns first step at index 0', () => {
      const steps = makeSteps(3);
      const runtime = ExecutionRuntime.from(makeActiveState(0), steps);
      expect(runtime.currentStep).toBe(steps[0]);
    });
  });

  describe('startedAt', () => {
    test('returns the ISO 8601 timestamp from state', () => {
      const startedAt = '2026-03-14T08:30:00.000Z';
      const state: IExecutionState = {
        currentStepIndex: 0,
        executionLog: [],
        startedAt
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      expect(runtime.startedAt).toBe(startedAt);
    });
  });

  // ============================================================================
  // Derived Properties
  // ============================================================================

  describe('getStepSummaries()', () => {
    test('returns empty array for empty steps', () => {
      const runtime = ExecutionRuntime.from(makeInitialState(0), []);
      const summaries = runtime.getStepSummaries();
      expect(summaries).toHaveLength(0);
    });

    test('returns summary for each step with correct stepIndex', () => {
      const steps = makeSteps(3);
      const runtime = ExecutionRuntime.from(makeActiveState(0), steps);
      const summaries = runtime.getStepSummaries();

      expect(summaries).toHaveLength(3);
      expect(summaries[0].stepIndex).toBe(0);
      expect(summaries[1].stepIndex).toBe(1);
      expect(summaries[2].stepIndex).toBe(2);
    });

    test('marks only the current step as isCurrent', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(1), makeSteps(3));
      const summaries = runtime.getStepSummaries();

      expect(summaries[0].isCurrent).toBe(false);
      expect(summaries[1].isCurrent).toBe(true);
      expect(summaries[2].isCurrent).toBe(false);
    });

    test('assigns pending status to steps with no log entries', () => {
      const runtime = ExecutionRuntime.from(makeInitialState(0), makeSteps(3));
      const summaries = runtime.getStepSummaries();

      // All steps have no log entries so they start as 'pending'
      expect(summaries[0].status).toBe('pending');
      expect(summaries[1].status).toBe('pending');
      expect(summaries[2].status).toBe('pending');
    });

    test('assigns active status to a step with active log entry', () => {
      const state: IExecutionState = {
        currentStepIndex: 0,
        executionLog: [{ stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' }],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      const summaries = runtime.getStepSummaries();

      expect(summaries[0].status).toBe('active');
      expect(summaries[0].latestEntry).toBeDefined();
      expect(summaries[0].latestEntry?.status).toBe('active');
    });

    test('assigns completed status to a step with completed log entry', () => {
      const state: IExecutionState = {
        currentStepIndex: 1,
        executionLog: [
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' },
          { stepIndex: 0, status: 'completed', completedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 1, status: 'active', startedAt: '2026-01-01T10:05:00.000Z' }
        ],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      const summaries = runtime.getStepSummaries();

      expect(summaries[0].status).toBe('completed');
    });

    test('assigns skipped status to a step with skipped log entry', () => {
      const state: IExecutionState = {
        currentStepIndex: 1,
        executionLog: [
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' },
          { stepIndex: 0, status: 'skipped', completedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 1, status: 'active', startedAt: '2026-01-01T10:05:00.000Z' }
        ],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      const summaries = runtime.getStepSummaries();

      expect(summaries[0].status).toBe('skipped');
    });

    test('uses latest entry for status when a step has multiple entries', () => {
      // Step 0 was completed, then jumped back to it (active again)
      const state: IExecutionState = {
        currentStepIndex: 0,
        executionLog: [
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' },
          { stepIndex: 0, status: 'completed', completedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:10:00.000Z' }
        ],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      const summaries = runtime.getStepSummaries();

      // Latest entry is 'active', so status is 'active'
      expect(summaries[0].status).toBe('active');
    });

    test('counts executionCount as number of completed entries for the step', () => {
      // Step 0 was completed twice (jumped back and done again)
      const state: IExecutionState = {
        currentStepIndex: 1,
        executionLog: [
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' },
          { stepIndex: 0, status: 'completed', completedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:10:00.000Z' },
          { stepIndex: 0, status: 'completed', completedAt: '2026-01-01T10:15:00.000Z' },
          { stepIndex: 1, status: 'active', startedAt: '2026-01-01T10:15:00.000Z' }
        ],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      const summaries = runtime.getStepSummaries();

      expect(summaries[0].executionCount).toBe(2);
      expect(summaries[1].executionCount).toBe(0);
    });

    test('returns the step definition on each summary', () => {
      const steps = makeSteps(2);
      const runtime = ExecutionRuntime.from(makeActiveState(0), steps);
      const summaries = runtime.getStepSummaries();

      expect(summaries[0].step).toBe(steps[0]);
      expect(summaries[1].step).toBe(steps[1]);
    });

    test('returns undefined latestEntry for steps with no log entries', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      const summaries = runtime.getStepSummaries();

      // Steps 1 and 2 have no log entries
      expect(summaries[1].latestEntry).toBeUndefined();
      expect(summaries[2].latestEntry).toBeUndefined();
    });
  });

  describe('completedStepCount', () => {
    test('returns 0 when no steps have been completed', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      expect(runtime.completedStepCount).toBe(0);
    });

    test('returns 0 when steps are only active or pending', () => {
      const state: IExecutionState = {
        currentStepIndex: 0,
        executionLog: [{ stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' }],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(3));
      expect(runtime.completedStepCount).toBe(0);
    });

    test('counts unique step indices with completed entries', () => {
      const state: IExecutionState = {
        currentStepIndex: 2,
        executionLog: [
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' },
          { stepIndex: 0, status: 'completed', completedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 1, status: 'active', startedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 1, status: 'completed', completedAt: '2026-01-01T10:10:00.000Z' },
          { stepIndex: 2, status: 'active', startedAt: '2026-01-01T10:10:00.000Z' }
        ],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(3));
      expect(runtime.completedStepCount).toBe(2);
    });

    test('counts step only once even if completed multiple times (jump-back scenario)', () => {
      const state: IExecutionState = {
        currentStepIndex: 1,
        executionLog: [
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' },
          { stepIndex: 0, status: 'completed', completedAt: '2026-01-01T10:05:00.000Z' },
          // Jumped back to step 0
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:10:00.000Z' },
          { stepIndex: 0, status: 'completed', completedAt: '2026-01-01T10:15:00.000Z' },
          { stepIndex: 1, status: 'active', startedAt: '2026-01-01T10:15:00.000Z' }
        ],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      // Step 0 completed twice but still counts as 1 unique completed step
      expect(runtime.completedStepCount).toBe(1);
    });

    test('does not count skipped steps as completed', () => {
      const state: IExecutionState = {
        currentStepIndex: 2,
        executionLog: [
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' },
          { stepIndex: 0, status: 'skipped', completedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 1, status: 'active', startedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 1, status: 'completed', completedAt: '2026-01-01T10:10:00.000Z' },
          { stepIndex: 2, status: 'active', startedAt: '2026-01-01T10:10:00.000Z' }
        ],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(3));
      expect(runtime.completedStepCount).toBe(1); // Only step 1 completed
    });
  });

  describe('progressLabel', () => {
    test('returns "0/3" at the start', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      expect(runtime.progressLabel).toBe('0/3');
    });

    test('returns "2/5" when two of five steps completed', () => {
      const state: IExecutionState = {
        currentStepIndex: 2,
        executionLog: [
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' },
          { stepIndex: 0, status: 'completed', completedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 1, status: 'active', startedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 1, status: 'completed', completedAt: '2026-01-01T10:10:00.000Z' },
          { stepIndex: 2, status: 'active', startedAt: '2026-01-01T10:10:00.000Z' }
        ],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(5));
      expect(runtime.progressLabel).toBe('2/5');
    });

    test('returns "0/0" for empty steps', () => {
      const runtime = ExecutionRuntime.from(makeInitialState(0), []);
      expect(runtime.progressLabel).toBe('0/0');
    });
  });

  // ============================================================================
  // advanceStep()
  // ============================================================================

  describe('advanceStep()', () => {
    test('fails when already complete', () => {
      const state = makeInitialState(3); // complete (3 steps)
      const runtime = ExecutionRuntime.from(state, makeSteps(3));
      expect(runtime.advanceStep()).toFailWith(/all steps are already complete/i);
    });

    test('marks current active entry as completed and moves to next step', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      expect(runtime.advanceStep()).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(1);
        // The active entry for step 0 should now be completed
        const step0Entries = newState.executionLog.filter((e) => e.stepIndex === 0);
        const completedEntry = step0Entries.find((e) => e.status === 'completed');
        expect(completedEntry).toBeDefined();
        expect(completedEntry?.completedAt).toBeDefined();
        // A new active entry for step 1 should exist
        const step1Entry = newState.executionLog.find((e) => e.stepIndex === 1 && e.status === 'active');
        expect(step1Entry).toBeDefined();
      });
    });

    test('adds completed entry if no active entry exists for current step', () => {
      // State where step 0 has no active entry (edge case)
      const state = makeInitialState(0, []);
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      expect(runtime.advanceStep()).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(1);
        const completedEntry = newState.executionLog.find(
          (e) => e.stepIndex === 0 && e.status === 'completed'
        );
        expect(completedEntry).toBeDefined();
      });
    });

    test('does not add a next-step active entry when advancing past last step', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(2), makeSteps(3));
      expect(runtime.advanceStep()).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(3);
        // No active entry for a step index 3 (out of bounds)
        const nextActiveEntry = newState.executionLog.find((e) => e.stepIndex === 3 && e.status === 'active');
        expect(nextActiveEntry).toBeUndefined();
      });
    });

    test('preserves other state fields when advancing', () => {
      const state: IExecutionState = {
        currentStepIndex: 0,
        executionLog: [{ stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' }],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      expect(runtime.advanceStep()).toSucceedAndSatisfy((newState) => {
        expect(newState.startedAt).toBe(state.startedAt);
      });
    });

    test('isComplete is true after advancing through all steps', () => {
      const steps = makeSteps(2);
      const initialState = ExecutionRuntime.initialize(steps);
      const rt1 = ExecutionRuntime.from(initialState, steps);
      const state2 = rt1.advanceStep().orThrow();
      const rt2 = ExecutionRuntime.from(state2, steps);
      const state3 = rt2.advanceStep().orThrow();
      const rt3 = ExecutionRuntime.from(state3, steps);
      expect(rt3.isComplete).toBe(true);
    });
  });

  // ============================================================================
  // skipStep()
  // ============================================================================

  describe('skipStep()', () => {
    test('fails when already complete', () => {
      const state = makeInitialState(3);
      const runtime = ExecutionRuntime.from(state, makeSteps(3));
      expect(runtime.skipStep()).toFailWith(/all steps are already complete/i);
    });

    test('marks current active entry as skipped and moves to next step', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      expect(runtime.skipStep()).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(1);
        const skippedEntry = newState.executionLog.find((e) => e.stepIndex === 0 && e.status === 'skipped');
        expect(skippedEntry).toBeDefined();
        expect(skippedEntry?.completedAt).toBeDefined();
        // Active entry for step 1
        const nextActiveEntry = newState.executionLog.find((e) => e.stepIndex === 1 && e.status === 'active');
        expect(nextActiveEntry).toBeDefined();
      });
    });

    test('adds skipped entry if no active entry exists for current step', () => {
      const state = makeInitialState(0, []);
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      expect(runtime.skipStep()).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(1);
        const skippedEntry = newState.executionLog.find((e) => e.stepIndex === 0 && e.status === 'skipped');
        expect(skippedEntry).toBeDefined();
      });
    });

    test('does not add a next-step active entry when skipping past last step', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(2), makeSteps(3));
      expect(runtime.skipStep()).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(3);
        const nextActiveEntry = newState.executionLog.find((e) => e.stepIndex === 3 && e.status === 'active');
        expect(nextActiveEntry).toBeUndefined();
      });
    });

    test('skipped step does not count toward completedStepCount', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      const newState = runtime.skipStep().orThrow();
      const rt2 = ExecutionRuntime.from(newState, makeSteps(3));
      expect(rt2.completedStepCount).toBe(0);
    });
  });

  // ============================================================================
  // jumpToStep()
  // ============================================================================

  describe('jumpToStep()', () => {
    test('fails when target index is negative', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(1), makeSteps(3));
      expect(runtime.jumpToStep(-1)).toFailWith(/out of bounds/i);
    });

    test('fails when target index equals totalSteps', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      expect(runtime.jumpToStep(3)).toFailWith(/out of bounds/i);
    });

    test('fails when target index exceeds totalSteps', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      expect(runtime.jumpToStep(10)).toFailWith(/out of bounds/i);
    });

    test('jumps forward to a later step', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(5));
      expect(runtime.jumpToStep(3)).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(3);
        const activeEntry = newState.executionLog.find((e) => e.stepIndex === 3 && e.status === 'active');
        expect(activeEntry).toBeDefined();
      });
    });

    test('jumps backward to an earlier step', () => {
      const state: IExecutionState = {
        currentStepIndex: 2,
        executionLog: [
          { stepIndex: 0, status: 'active', startedAt: '2026-01-01T10:00:00.000Z' },
          { stepIndex: 0, status: 'completed', completedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 1, status: 'active', startedAt: '2026-01-01T10:05:00.000Z' },
          { stepIndex: 1, status: 'completed', completedAt: '2026-01-01T10:10:00.000Z' },
          { stepIndex: 2, status: 'active', startedAt: '2026-01-01T10:10:00.000Z' }
        ],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(5));
      expect(runtime.jumpToStep(0)).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(0);
        // Current step 2's active entry should now be completed
        const step2Completed = newState.executionLog.find(
          (e) => e.stepIndex === 2 && e.status === 'completed'
        );
        expect(step2Completed).toBeDefined();
        // New active entry for step 0 should be appended
        const allStep0Entries = newState.executionLog.filter((e) => e.stepIndex === 0);
        expect(allStep0Entries.length).toBeGreaterThanOrEqual(2);
        const lastStep0Entry = allStep0Entries[allStep0Entries.length - 1];
        expect(lastStep0Entry.status).toBe('active');
      });
    });

    test('jumps to same step (stay in place)', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(1), makeSteps(3));
      expect(runtime.jumpToStep(1)).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(1);
        // The old active entry for step 1 is completed, a new active entry is added
        const activeEntries = newState.executionLog.filter((e) => e.stepIndex === 1 && e.status === 'active');
        expect(activeEntries).toHaveLength(1);
      });
    });

    test('appends an active entry for the target step even when already complete', () => {
      // Edge case: runtime is complete but user jumps to a valid step
      const state = makeInitialState(3);
      const runtime = ExecutionRuntime.from(state, makeSteps(5));
      expect(runtime.jumpToStep(2)).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(2);
        const activeEntry = newState.executionLog.find((e) => e.stepIndex === 2 && e.status === 'active');
        expect(activeEntry).toBeDefined();
      });
    });

    test('error message includes target index and valid range', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(3));
      expect(runtime.jumpToStep(5)).toFailWith(/5.*0.*2/);
    });
  });

  // ============================================================================
  // addStepNotes()
  // ============================================================================

  describe('addStepNotes()', () => {
    test('fails when already complete', () => {
      const state = makeInitialState(3);
      const runtime = ExecutionRuntime.from(state, makeSteps(3));
      const notes: ReadonlyArray<CommonModel.ICategorizedNote> = [
        { category: 'general' as NoteCategory, note: 'Test note' }
      ];
      expect(runtime.addStepNotes(notes)).toFailWith(/all steps are complete/i);
    });

    test('fails when no active entry exists for current step', () => {
      // State with currentStepIndex=0 but no log entry
      const state = makeInitialState(0, []);
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      const notes: ReadonlyArray<CommonModel.ICategorizedNote> = [
        { category: 'general' as NoteCategory, note: 'Test note' }
      ];
      expect(runtime.addStepNotes(notes)).toFailWith(/no active entry/i);
    });

    test('appends notes to the active entry for current step', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(2));
      const notes: ReadonlyArray<CommonModel.ICategorizedNote> = [
        { category: 'general' as NoteCategory, note: 'This step looks good' }
      ];
      expect(runtime.addStepNotes(notes)).toSucceedAndSatisfy((newState) => {
        const activeEntry = newState.executionLog.find((e) => e.stepIndex === 0 && e.status === 'active');
        expect(activeEntry).toBeDefined();
        expect(activeEntry?.notes).toHaveLength(1);
        expect(activeEntry?.notes?.[0].note).toBe('This step looks good');
      });
    });

    test('appends multiple notes in one call', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(2));
      const notes: ReadonlyArray<CommonModel.ICategorizedNote> = [
        { category: 'general' as NoteCategory, note: 'First note' },
        { category: 'production' as NoteCategory, note: 'Second note' }
      ];
      expect(runtime.addStepNotes(notes)).toSucceedAndSatisfy((newState) => {
        const activeEntry = newState.executionLog.find((e) => e.stepIndex === 0 && e.status === 'active');
        expect(activeEntry?.notes).toHaveLength(2);
      });
    });

    test('accumulates notes across multiple addStepNotes calls', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(2));
      const firstNote: ReadonlyArray<CommonModel.ICategorizedNote> = [
        { category: 'general' as NoteCategory, note: 'Note one' }
      ];
      const secondNote: ReadonlyArray<CommonModel.ICategorizedNote> = [
        { category: 'general' as NoteCategory, note: 'Note two' }
      ];

      const state2 = runtime.addStepNotes(firstNote).orThrow();
      const rt2 = ExecutionRuntime.from(state2, makeSteps(2));
      expect(rt2.addStepNotes(secondNote)).toSucceedAndSatisfy((finalState) => {
        const activeEntry = finalState.executionLog.find((e) => e.stepIndex === 0 && e.status === 'active');
        expect(activeEntry?.notes).toHaveLength(2);
        expect(activeEntry?.notes?.[0].note).toBe('Note one');
        expect(activeEntry?.notes?.[1].note).toBe('Note two');
      });
    });

    test('preserves existing notes when appending', () => {
      const state: IExecutionState = {
        currentStepIndex: 0,
        executionLog: [
          {
            stepIndex: 0,
            status: 'active',
            startedAt: '2026-01-01T10:00:00.000Z',
            notes: [{ category: 'general' as NoteCategory, note: 'Existing note' }]
          }
        ],
        startedAt: '2026-01-01T10:00:00.000Z'
      };
      const runtime = ExecutionRuntime.from(state, makeSteps(2));
      const newNote: ReadonlyArray<CommonModel.ICategorizedNote> = [
        { category: 'production' as NoteCategory, note: 'New note' }
      ];
      expect(runtime.addStepNotes(newNote)).toSucceedAndSatisfy((newState) => {
        const activeEntry = newState.executionLog.find((e) => e.stepIndex === 0 && e.status === 'active');
        expect(activeEntry?.notes).toHaveLength(2);
        expect(activeEntry?.notes?.[0].note).toBe('Existing note');
        expect(activeEntry?.notes?.[1].note).toBe('New note');
      });
    });

    test('preserves other state fields when adding notes', () => {
      const runtime = ExecutionRuntime.from(makeActiveState(0), makeSteps(2));
      const notes: ReadonlyArray<CommonModel.ICategorizedNote> = [
        { category: 'general' as NoteCategory, note: 'Test' }
      ];
      expect(runtime.addStepNotes(notes)).toSucceedAndSatisfy((newState) => {
        expect(newState.currentStepIndex).toBe(0);
        expect(newState.startedAt).toBe('2026-01-01T10:00:00.000Z');
      });
    });
  });

  // ============================================================================
  // Full Workflow Integration
  // ============================================================================

  describe('full workflow', () => {
    test('advances through all 3 steps to completion', () => {
      const steps = makeSteps(3);
      const initialState = ExecutionRuntime.initialize(steps);

      // Step 0: active
      const rt0 = ExecutionRuntime.from(initialState, steps);
      expect(rt0.isComplete).toBe(false);
      expect(rt0.currentStepIndex).toBe(0);
      expect(rt0.progressLabel).toBe('0/3');

      // Advance to step 1
      const state1 = rt0.advanceStep().orThrow();
      const rt1 = ExecutionRuntime.from(state1, steps);
      expect(rt1.currentStepIndex).toBe(1);
      expect(rt1.completedStepCount).toBe(1);
      expect(rt1.progressLabel).toBe('1/3');

      // Advance to step 2
      const state2 = rt1.advanceStep().orThrow();
      const rt2 = ExecutionRuntime.from(state2, steps);
      expect(rt2.currentStepIndex).toBe(2);
      expect(rt2.completedStepCount).toBe(2);
      expect(rt2.progressLabel).toBe('2/3');

      // Advance past last step - now complete
      const state3 = rt2.advanceStep().orThrow();
      const rt3 = ExecutionRuntime.from(state3, steps);
      expect(rt3.isComplete).toBe(true);
      expect(rt3.completedStepCount).toBe(3);
      expect(rt3.progressLabel).toBe('3/3');
      expect(rt3.currentStep).toBeUndefined();
    });

    test('skip some steps and advance others', () => {
      const steps = makeSteps(4);
      const initialState = ExecutionRuntime.initialize(steps);

      const rt0 = ExecutionRuntime.from(initialState, steps);
      // Skip step 0
      const state1 = rt0.skipStep().orThrow();
      const rt1 = ExecutionRuntime.from(state1, steps);
      expect(rt1.currentStepIndex).toBe(1);
      expect(rt1.completedStepCount).toBe(0); // skipped doesn't count

      // Advance step 1
      const state2 = rt1.advanceStep().orThrow();
      const rt2 = ExecutionRuntime.from(state2, steps);
      expect(rt2.completedStepCount).toBe(1);

      // Add a note to step 2
      const state3 = rt2
        .addStepNotes([{ category: 'general' as NoteCategory, note: 'Step 2 in progress' }])
        .orThrow();
      const rt3 = ExecutionRuntime.from(state3, steps);
      expect(rt3.completedStepCount).toBe(1);

      // Advance step 2
      const state4 = rt3.advanceStep().orThrow();
      const rt4 = ExecutionRuntime.from(state4, steps);
      // Jump back to step 1
      const state5 = rt4.jumpToStep(1).orThrow();
      const rt5 = ExecutionRuntime.from(state5, steps);
      expect(rt5.currentStepIndex).toBe(1);

      // Summaries should reflect history
      const summaries = rt5.getStepSummaries();
      expect(summaries[0].status).toBe('skipped');
      expect(summaries[1].status).toBe('active'); // jumped back to it
      expect(summaries[2].status).toBe('completed');
    });

    test('jump back to earlier step creates additional log entries', () => {
      const steps = makeSteps(3);
      const initialState = ExecutionRuntime.initialize(steps);

      const rt0 = ExecutionRuntime.from(initialState, steps);
      const state1 = rt0.advanceStep().orThrow();
      const rt1 = ExecutionRuntime.from(state1, steps);
      const state2 = rt1.advanceStep().orThrow();
      const rt2 = ExecutionRuntime.from(state2, steps);

      // Jump back to step 0
      const state3 = rt2.jumpToStep(0).orThrow();
      const rt3 = ExecutionRuntime.from(state3, steps);
      expect(rt3.currentStepIndex).toBe(0);
      expect(rt3.isComplete).toBe(false);

      // Advancing again through to completion
      const state4 = rt3.advanceStep().orThrow();
      const rt4 = ExecutionRuntime.from(state4, steps);
      const state5 = rt4.advanceStep().orThrow();
      const rt5 = ExecutionRuntime.from(state5, steps);
      const state6 = rt5.advanceStep().orThrow();
      const rt6 = ExecutionRuntime.from(state6, steps);
      expect(rt6.isComplete).toBe(true);
    });
  });
});
