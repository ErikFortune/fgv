/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import { renderHook, act } from '@testing-library/react';
import { useFillingSlotManagement, type IFillingSlotData, type SlotId } from '../../../packlets/production';

describe('useFillingSlotManagement', () => {
  const createMockSlot = (overrides: Partial<IFillingSlotData> = {}): IFillingSlotData => ({
    slotId: 'slot-001',
    name: 'Primary Filling',
    filling: {
      options: [
        { type: 'recipe', id: 'filling-001' },
        { type: 'recipe', id: 'filling-002' }
      ],
      preferredId: 'filling-001'
    },
    ...overrides
  });

  const createBaseSlots = (): IFillingSlotData[] => [
    createMockSlot(),
    createMockSlot({
      slotId: 'slot-002',
      name: 'Secondary Filling',
      filling: {
        options: [{ type: 'ingredient', id: 'ingredient-001' }],
        preferredId: 'ingredient-001'
      }
    })
  ];

  describe('initial state', () => {
    test('returns correct slots from base', () => {
      const baseSlots = createBaseSlots();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.slots).toHaveLength(2);
      expect(result.current.slots[0].slotId).toBe('slot-001');
      expect(result.current.slots[0].name).toBe('Primary Filling');
      expect(result.current.slots[0].preferredId).toBe('filling-001');
      expect(result.current.slots[0].hasChanges).toBe(false);
      expect(result.current.hasChanges).toBe(false);
    });

    test('returns empty slots when no base provided', () => {
      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots: undefined,
          draftSlots: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.slots).toHaveLength(0);
      expect(result.current.hasChanges).toBe(false);
    });

    test('uses slot ID as name when name not provided', () => {
      const baseSlots = [createMockSlot({ name: undefined })];

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.slots[0].name).toBe('slot-001');
    });
  });

  describe('change detection', () => {
    test('detects selection changes', () => {
      const baseSlots = createBaseSlots();
      const draftSlots = [
        createMockSlot({
          filling: {
            options: baseSlots[0].filling.options,
            preferredId: 'filling-002'
          }
        }),
        baseSlots[1]
      ];

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.slots[0].hasChanges).toBe(true);
      expect(result.current.slots[1].hasChanges).toBe(false);
      expect(result.current.hasChanges).toBe(true);
    });

    test('detects slot count changes', () => {
      const baseSlots = createBaseSlots();
      const draftSlots = [baseSlots[0]]; // Removed second slot

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.hasChanges).toBe(true);
    });

    test('detects new slots', () => {
      const baseSlots = createBaseSlots();
      const draftSlots = [...baseSlots, createMockSlot({ slotId: 'slot-003', name: 'New Slot' })];

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots,
          onUpdateDraft: jest.fn(),
          onResetDraft: jest.fn()
        })
      );

      expect(result.current.slots[2].hasChanges).toBe(true);
      expect(result.current.hasChanges).toBe(true);
    });
  });

  describe('addSlot action', () => {
    test('adds a new slot with given name', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();
      let generatedSlotId = 0;

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn(),
          generateSlotId: () => `generated-slot-${++generatedSlotId}`
        })
      );

      act(() => {
        const newSlotId = result.current.actions.addSlot('Ganache Layer');
        expect(newSlotId).toBe('generated-slot-1');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            slotId: 'generated-slot-1',
            name: 'Ganache Layer',
            filling: { options: [], preferredId: undefined }
          })
        ])
      );
    });

    test('uses default name when empty string provided', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn(),
          generateSlotId: () => 'new-slot'
        })
      );

      act(() => {
        result.current.actions.addSlot('   ');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'New Filling'
          })
        ])
      );
    });
  });

  describe('removeSlot action', () => {
    test('removes an existing slot', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.removeSlot('slot-001' as SlotId);
      });

      expect(onUpdateDraft).toHaveBeenCalledWith([expect.objectContaining({ slotId: 'slot-002' })]);
    });

    test('does nothing when slot not found', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.removeSlot('nonexistent-slot' as SlotId);
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });
  });

  describe('renameSlot action', () => {
    test('renames an existing slot', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.renameSlot('slot-001' as SlotId, 'New Name');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            slotId: 'slot-001',
            name: 'New Name'
          })
        ])
      );
    });

    test('sets undefined name when empty string provided', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.renameSlot('slot-001' as SlotId, '   ');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            slotId: 'slot-001',
            name: undefined
          })
        ])
      );
    });
  });

  describe('selectFilling action', () => {
    test('selects a filling from options', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.selectFilling('slot-001' as SlotId, 'filling-002');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            slotId: 'slot-001',
            filling: expect.objectContaining({
              preferredId: 'filling-002'
            })
          })
        ])
      );
    });

    test('does nothing when filling not in options', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.selectFilling('slot-001' as SlotId, 'nonexistent-filling');
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });
  });

  describe('addFillingOption action', () => {
    test('adds a new filling option and selects it', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.addFillingOption('slot-001' as SlotId, {
          type: 'recipe',
          id: 'filling-003'
        });
      });

      expect(onUpdateDraft).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            slotId: 'slot-001',
            filling: {
              options: [
                { type: 'recipe', id: 'filling-001' },
                { type: 'recipe', id: 'filling-002' },
                { type: 'recipe', id: 'filling-003' }
              ],
              preferredId: 'filling-003'
            }
          })
        ])
      );
    });

    test('does not add duplicate options', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.addFillingOption('slot-001' as SlotId, {
          type: 'recipe',
          id: 'filling-001'
        });
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });
  });

  describe('removeFillingOption action', () => {
    test('removes a filling option and updates preferred', () => {
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.removeFillingOption('slot-001' as SlotId, 'filling-001');
      });

      expect(onUpdateDraft).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            slotId: 'slot-001',
            filling: {
              options: [{ type: 'recipe', id: 'filling-002' }],
              preferredId: 'filling-002'
            }
          })
        ])
      );
    });

    test('does not remove the last option', () => {
      const baseSlots = [
        createMockSlot({
          filling: {
            options: [{ type: 'recipe', id: 'filling-001' }],
            preferredId: 'filling-001'
          }
        })
      ];
      const onUpdateDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
          onUpdateDraft,
          onResetDraft: jest.fn()
        })
      );

      act(() => {
        result.current.actions.removeFillingOption('slot-001' as SlotId, 'filling-001');
      });

      expect(onUpdateDraft).not.toHaveBeenCalled();
    });
  });

  describe('reset action', () => {
    test('calls onResetDraft', () => {
      const baseSlots = createBaseSlots();
      const onResetDraft = jest.fn();

      const { result } = renderHook(() =>
        useFillingSlotManagement({
          baseSlots,
          draftSlots: undefined,
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
      const baseSlots = createBaseSlots();
      const onUpdateDraft = jest.fn();
      const onResetDraft = jest.fn();

      const { result, rerender } = renderHook(
        (props: { baseSlots: IFillingSlotData[] }) =>
          useFillingSlotManagement({
            baseSlots: props.baseSlots,
            draftSlots: undefined,
            onUpdateDraft,
            onResetDraft
          }),
        { initialProps: { baseSlots } }
      );

      const initialActions = result.current.actions;

      // Rerender with same baseSlots
      rerender({ baseSlots });

      expect(result.current.actions.addSlot).toBe(initialActions.addSlot);
      expect(result.current.actions.removeSlot).toBe(initialActions.removeSlot);
      expect(result.current.actions.selectFilling).toBe(initialActions.selectFilling);
    });
  });
});
