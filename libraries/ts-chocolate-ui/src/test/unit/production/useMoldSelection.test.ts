/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { renderHook, act } from '@testing-library/react';
import { useMoldSelection, type IMoldSpec } from '../../../packlets/production';

describe('useMoldSelection', () => {
  const createBaseSpec = (overrides: Partial<IMoldSpec> = {}): IMoldSpec => ({
    options: [
      { id: 'mold-001', notes: 'Standard mold' },
      { id: 'mold-002', notes: 'Alternative mold' }
    ],
    preferredId: 'mold-001',
    ...overrides
  });

  describe('initial state', () => {
    test('returns correct state from base spec', () => {
      const baseSpec = createBaseSpec();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.state.options).toHaveLength(2);
      expect(result.current.state.basePreferredId).toBe('mold-001');
      expect(result.current.state.effectivePreferredId).toBe('mold-001');
      expect(result.current.state.hasChanges).toBe(false);
    });

    test('returns empty state when no specs provided', () => {
      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec: undefined,
          draftSpec: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.state.options).toEqual([]);
      expect(result.current.state.basePreferredId).toBeUndefined();
      expect(result.current.state.effectivePreferredId).toBeUndefined();
      expect(result.current.state.hasChanges).toBe(false);
    });

    test('uses first option as default preferred when none specified', () => {
      const baseSpec = createBaseSpec({ preferredId: undefined });

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.state.basePreferredId).toBe('mold-001');
      expect(result.current.state.effectivePreferredId).toBe('mold-001');
    });

    test('uses productionSelectedId for display when provided', () => {
      const baseSpec = createBaseSpec();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn(),
          productionSelectedId: 'mold-002'
        })
      );

      // productionSelectedId overrides the effectivePreferredId for display
      expect(result.current.state.effectivePreferredId).toBe('mold-002');
      // But basePreferredId is unchanged
      expect(result.current.state.basePreferredId).toBe('mold-001');
      // And this doesn't count as a change (it's just a production run selection)
      expect(result.current.state.hasChanges).toBe(false);
    });
  });

  describe('draft state', () => {
    test('does not detect changes when only preferred ID differs', () => {
      // Per design: selecting from existing options is NOT a recipe change
      const baseSpec = createBaseSpec();
      const draftSpec = createBaseSpec({ preferredId: 'mold-002' });

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      // hasChanges should be false - only option additions/removals count as changes
      expect(result.current.state.hasChanges).toBe(false);
      expect(result.current.state.effectivePreferredId).toBe('mold-002');
    });

    test('detects changes when options differ', () => {
      const baseSpec = createBaseSpec();
      const draftSpec = createBaseSpec({
        options: [...baseSpec.options, { id: 'mold-003', notes: 'New mold' }]
      });

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.state.hasChanges).toBe(true);
    });
  });

  describe('select action', () => {
    test('calls onSelectProduction when provided (production mode)', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();
      const onSelectProduction = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn(),
          onSelectProduction
        })
      );

      act(() => {
        result.current.actions.select('mold-002');
      });

      // Should call production callback, NOT update draft
      expect(onSelectProduction).toHaveBeenCalledWith('mold-002');
      expect(onUpdateDraft).not.toHaveBeenCalled();
    });

    test('calls onUpdateDraft when onSelectProduction not provided (legacy mode)', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.select('mold-002');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith({
        options: [
          { id: 'mold-001', notes: 'Standard mold' },
          { id: 'mold-002', notes: 'Alternative mold' }
        ],
        preferredId: 'mold-002'
      });
    });

    test('does nothing when ID not in options', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.select('nonexistent-mold');
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });

    test('does nothing when no spec', () => {
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec: undefined,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.select('mold-001');
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });
  });

  describe('addOption action', () => {
    test('adds new option and selects it', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.addOption({ id: 'mold-003', notes: 'New mold' });
      });

      expect(onUpdateDraft).toHaveBeenCalledWith({
        options: [
          { id: 'mold-001', notes: 'Standard mold' },
          { id: 'mold-002', notes: 'Alternative mold' },
          { id: 'mold-003', notes: 'New mold' }
        ],
        preferredId: 'mold-003'
      });
    });

    test('creates spec when none exists', () => {
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec: undefined,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.addOption({ id: 'mold-001', notes: 'First mold' });
      });

      expect(onUpdateDraft).toHaveBeenCalledWith({
        options: [{ id: 'mold-001', notes: 'First mold' }],
        preferredId: 'mold-001'
      });
    });

    test('does not add duplicates', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.addOption({ id: 'mold-001', notes: 'Duplicate' });
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });
  });

  describe('removeOption action', () => {
    test('removes option and updates preferred if needed', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.removeOption('mold-001');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith({
        options: [{ id: 'mold-002', notes: 'Alternative mold' }],
        preferredId: 'mold-002'
      });
    });

    test('preserves preferred if removed option is not preferred', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.removeOption('mold-002');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith({
        options: [{ id: 'mold-001', notes: 'Standard mold' }],
        preferredId: 'mold-001'
      });
    });

    test('does not remove the last option', () => {
      const baseSpec = createBaseSpec({
        options: [{ id: 'mold-001' }]
      });
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.removeOption('mold-001');
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });

    test('does nothing when no spec', () => {
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec: undefined,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.removeOption('mold-001');
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });
  });

  describe('reset action', () => {
    test('calls onResetDraft', () => {
      const baseSpec = createBaseSpec();
      const onResetDraft = jest.fn();

      const { result } = renderHook(() =>
        useMoldSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft
        })
      );

      act(() => {
        result.current.actions.reset();
      });

      expect(onResetDraft).toHaveBeenCalled();
    });
  });

  describe('action stability', () => {
    test('actions maintain referential identity when dependencies are stable', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();
      const onResetDraft = jest.fn();

      const { result, rerender } = renderHook(
        (props: { baseSpec: IMoldSpec }) =>
          useMoldSelection({
            baseSpec: props.baseSpec,
            draftSpec: undefined,
            onUpdateDraft,
            onResetDraft
          }),
        { initialProps: { baseSpec } }
      );

      const initialActions = result.current.actions;

      // Rerender with same baseSpec
      rerender({ baseSpec });

      expect(result.current.actions.select).toBe(initialActions.select);
      expect(result.current.actions.addOption).toBe(initialActions.addOption);
      expect(result.current.actions.removeOption).toBe(initialActions.removeOption);
      expect(result.current.actions.reset).toBe(initialActions.reset);
    });
  });
});
