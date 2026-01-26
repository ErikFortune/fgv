/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { renderHook, act } from '@testing-library/react';
import {
  useProductionSession,
  type IPersistedSessionData,
  type IMoldData,
  type SessionId
} from '../../../packlets/production';

describe('useProductionSession', () => {
  const mockMolds: Record<string, IMoldData> = {
    'mold-001': { cavityCount: 16 },
    'mold-002': { cavityCount: 24 }
  };

  const getMold = (moldId: string): IMoldData | undefined => mockMolds[moldId];

  const createMockSession = (overrides: Partial<IPersistedSessionData> = {}): IPersistedSessionData => ({
    sessionId: 'session-001' as SessionId,
    sessionType: 'confection',
    status: 'active',
    base: {
      confectionId: 'user.dark-dome-bonbon',
      versionSpec: '2026-01-01-01'
    },
    ...overrides
  });

  describe('initial state', () => {
    test('returns empty state when no session provided', () => {
      const onUpdateProduction = jest.fn();
      const onUpdateLabel = jest.fn();

      const { result } = renderHook(() =>
        useProductionSession({
          session: undefined,
          getMold,
          onUpdateProduction,
          onUpdateLabel
        })
      );

      expect(result.current.state.sessionId).toBeUndefined();
      expect(result.current.state.confectionId).toBeUndefined();
      expect(result.current.state.frames).toBe(1);
      expect(result.current.state.scaledYieldCount).toBeUndefined();
      expect(result.current.state.status).toBe('active');
      expect(result.current.state.hasDraftChanges).toBe(false);
    });

    test('extracts session data correctly', () => {
      const session = createMockSession({
        label: 'Test Session',
        production: { moldId: 'mold-001', frames: 2 }
      });

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction: jest.fn(),
          onUpdateLabel: jest.fn()
        })
      );

      expect(result.current.state.sessionId).toBe('session-001');
      expect(result.current.state.confectionId).toBe('user.dark-dome-bonbon');
      expect(result.current.state.versionSpec).toBe('2026-01-01-01');
      expect(result.current.state.moldId).toBe('mold-001');
      expect(result.current.state.frames).toBe(2);
      expect(result.current.state.label).toBe('Test Session');
    });
  });

  describe('yield calculation', () => {
    test('calculates yield from mold cavities and frames', () => {
      const session = createMockSession({
        production: { moldId: 'mold-001', frames: 2 }
      });

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction: jest.fn(),
          onUpdateLabel: jest.fn()
        })
      );

      // 16 cavities × 2 frames = 32
      expect(result.current.state.scaledYieldCount).toBe(32);
    });

    test('returns undefined yield when no mold selected', () => {
      const session = createMockSession({
        production: { frames: 2 }
      });

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction: jest.fn(),
          onUpdateLabel: jest.fn()
        })
      );

      expect(result.current.state.scaledYieldCount).toBeUndefined();
    });

    test('returns undefined yield when mold not found', () => {
      const session = createMockSession({
        production: { moldId: 'nonexistent-mold', frames: 2 }
      });

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction: jest.fn(),
          onUpdateLabel: jest.fn()
        })
      );

      expect(result.current.state.scaledYieldCount).toBeUndefined();
    });
  });

  describe('draft detection', () => {
    test('detects when draft exists', () => {
      const session = createMockSession({
        draft: { draftVersion: { someField: 'changed' } }
      });

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction: jest.fn(),
          onUpdateLabel: jest.fn()
        })
      );

      expect(result.current.state.hasDraftChanges).toBe(true);
    });

    test('detects when no draft exists', () => {
      const session = createMockSession();

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction: jest.fn(),
          onUpdateLabel: jest.fn()
        })
      );

      expect(result.current.state.hasDraftChanges).toBe(false);
    });
  });

  describe('selectMold action', () => {
    test('calls onUpdateProduction with new mold ID', () => {
      const session = createMockSession({
        production: { frames: 3 }
      });
      const onUpdateProduction = jest.fn();

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction,
          onUpdateLabel: jest.fn()
        })
      );

      act(() => {
        result.current.actions.selectMold('mold-002');
      });

      expect(onUpdateProduction).toHaveBeenCalledWith('session-001', {
        moldId: 'mold-002',
        frames: 3
      });
    });

    test('does nothing when no session', () => {
      const onUpdateProduction = jest.fn();

      const { result } = renderHook(() =>
        useProductionSession({
          session: undefined,
          getMold,
          onUpdateProduction,
          onUpdateLabel: jest.fn()
        })
      );

      act(() => {
        result.current.actions.selectMold('mold-001');
      });

      expect(onUpdateProduction).not.toHaveBeenCalled();
    });
  });

  describe('setFrames action', () => {
    test('calls onUpdateProduction with new frames', () => {
      const session = createMockSession({
        production: { moldId: 'mold-001' }
      });
      const onUpdateProduction = jest.fn();

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction,
          onUpdateLabel: jest.fn()
        })
      );

      act(() => {
        result.current.actions.setFrames(5);
      });

      expect(onUpdateProduction).toHaveBeenCalledWith('session-001', {
        moldId: 'mold-001',
        frames: 5
      });
    });

    test('normalizes invalid frame values to 1', () => {
      const session = createMockSession();
      const onUpdateProduction = jest.fn();

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction,
          onUpdateLabel: jest.fn()
        })
      );

      act(() => {
        result.current.actions.setFrames(-1);
      });

      expect(onUpdateProduction).toHaveBeenCalledWith('session-001', {
        moldId: undefined,
        frames: 1
      });
    });
  });

  describe('rename action', () => {
    test('calls onUpdateLabel with trimmed label', () => {
      const session = createMockSession();
      const onUpdateLabel = jest.fn();

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction: jest.fn(),
          onUpdateLabel
        })
      );

      act(() => {
        result.current.actions.rename('  New Label  ');
      });

      expect(onUpdateLabel).toHaveBeenCalledWith('session-001', 'New Label');
    });

    test('passes undefined for empty label', () => {
      const session = createMockSession();
      const onUpdateLabel = jest.fn();

      const { result } = renderHook(() =>
        useProductionSession({
          session,
          getMold,
          onUpdateProduction: jest.fn(),
          onUpdateLabel
        })
      );

      act(() => {
        result.current.actions.rename('   ');
      });

      expect(onUpdateLabel).toHaveBeenCalledWith('session-001', undefined);
    });
  });

  describe('action stability', () => {
    test('actions maintain referential identity when dependencies are stable', () => {
      const session = createMockSession();
      const onUpdateProduction = jest.fn();
      const onUpdateLabel = jest.fn();

      const { result, rerender } = renderHook(
        (props: { session: IPersistedSessionData }) =>
          useProductionSession({
            session: props.session,
            getMold,
            onUpdateProduction,
            onUpdateLabel
          }),
        { initialProps: { session } }
      );

      const initialSelectMold = result.current.actions.selectMold;
      const initialSetFrames = result.current.actions.setFrames;
      const initialRename = result.current.actions.rename;

      // Rerender with same session
      rerender({ session });

      expect(result.current.actions.selectMold).toBe(initialSelectMold);
      expect(result.current.actions.setFrames).toBe(initialSetFrames);
      expect(result.current.actions.rename).toBe(initialRename);
    });
  });
});
