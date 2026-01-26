/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { renderHook, act } from '@testing-library/react';
import { useShellChocolateSelection, type IShellChocolateSpec } from '../../../packlets/production';

describe('useShellChocolateSelection', () => {
  const createBaseSpec = (overrides: Partial<IShellChocolateSpec> = {}): IShellChocolateSpec => ({
    ids: ['choco-001', 'choco-002'],
    preferredId: 'choco-001',
    ...overrides
  });

  describe('initial state', () => {
    test('returns correct state from base spec', () => {
      const baseSpec = createBaseSpec();

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.state.availableChoices).toEqual(['choco-001', 'choco-002']);
      expect(result.current.state.basePreferredId).toBe('choco-001');
      expect(result.current.state.effectivePreferredId).toBe('choco-001');
      expect(result.current.state.hasChanges).toBe(false);
    });

    test('returns empty state when no specs provided', () => {
      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec: undefined,
          draftSpec: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.state.availableChoices).toEqual([]);
      expect(result.current.state.basePreferredId).toBeUndefined();
      expect(result.current.state.effectivePreferredId).toBeUndefined();
      expect(result.current.state.hasChanges).toBe(false);
    });

    test('uses first ID as default preferred when none specified', () => {
      const baseSpec = createBaseSpec({ preferredId: undefined });

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.state.basePreferredId).toBe('choco-001');
      expect(result.current.state.effectivePreferredId).toBe('choco-001');
    });

    test('uses productionSelectedId for display when provided', () => {
      const baseSpec = createBaseSpec();

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn(),
          productionSelectedId: 'choco-002'
        })
      );

      // productionSelectedId overrides the effectivePreferredId for display
      expect(result.current.state.effectivePreferredId).toBe('choco-002');
      // But basePreferredId is unchanged
      expect(result.current.state.basePreferredId).toBe('choco-001');
      // And this doesn't count as a change (it's just a production run selection)
      expect(result.current.state.hasChanges).toBe(false);
    });
  });

  describe('draft state', () => {
    test('does not detect changes when only preferred ID differs', () => {
      // Per design: selecting from existing options is NOT a recipe change
      const baseSpec = createBaseSpec();
      const draftSpec = createBaseSpec({ preferredId: 'choco-002' });

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec,
          draftSpec,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      // hasChanges should be false - only option additions/removals count as changes
      expect(result.current.state.hasChanges).toBe(false);
      expect(result.current.state.effectivePreferredId).toBe('choco-002');
    });

    test('detects changes when choices differ', () => {
      const baseSpec = createBaseSpec();
      const draftSpec = createBaseSpec({ ids: ['choco-001', 'choco-002', 'choco-003'] });

      const { result } = renderHook(() =>
        useShellChocolateSelection({
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
        useShellChocolateSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn(),
          onSelectProduction
        })
      );

      act(() => {
        result.current.actions.select('choco-002');
      });

      // Should call production callback, NOT update draft
      expect(onSelectProduction).toHaveBeenCalledWith('choco-002');
      expect(onUpdateDraft).not.toHaveBeenCalled();
    });

    test('calls onUpdateDraft when onSelectProduction not provided (legacy mode)', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.select('choco-002');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith({
        ids: ['choco-001', 'choco-002'],
        preferredId: 'choco-002'
      });
    });

    test('does nothing when ID not in choices', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.select('nonexistent-choco');
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });

    test('does nothing when no spec', () => {
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec: undefined,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.select('choco-001');
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });
  });

  describe('addChoice action', () => {
    test('adds new chocolate and selects it', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.addChoice('choco-003');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith({
        ids: ['choco-001', 'choco-002', 'choco-003'],
        preferredId: 'choco-003'
      });
    });

    test('does not add duplicates', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.addChoice('choco-001');
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });
  });

  describe('removeChoice action', () => {
    test('removes chocolate and updates preferred if needed', () => {
      const baseSpec = createBaseSpec();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.removeChoice('choco-001');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith({
        ids: ['choco-002'],
        preferredId: 'choco-002'
      });
    });

    test('does not remove the last option', () => {
      const baseSpec = createBaseSpec({ ids: ['choco-001'] });
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useShellChocolateSelection({
          baseSpec,
          draftSpec: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.removeChoice('choco-001');
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });
  });

  describe('reset action', () => {
    test('calls onResetDraft', () => {
      const baseSpec = createBaseSpec();
      const onResetDraft = jest.fn();

      const { result } = renderHook(() =>
        useShellChocolateSelection({
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
        (props: { baseSpec: IShellChocolateSpec }) =>
          useShellChocolateSelection({
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
      expect(result.current.actions.addChoice).toBe(initialActions.addChoice);
      expect(result.current.actions.removeChoice).toBe(initialActions.removeChoice);
      expect(result.current.actions.reset).toBe(initialActions.reset);
    });
  });
});
