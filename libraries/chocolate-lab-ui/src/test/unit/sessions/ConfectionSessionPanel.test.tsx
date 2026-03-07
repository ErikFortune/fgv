import '@fgv/ts-utils-jest';
import '@testing-library/jest-dom';

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
  Entities,
  type FillingId,
  type IngredientId,
  type Measurement,
  type Model,
  type ProcedureId,
  type SessionId,
  type SlotId,
  type UserLibrary,
  Workspace
} from '@fgv/ts-chocolate';
import { succeed } from '@fgv/ts-utils';

import { ReactiveWorkspace, WorkspaceProvider } from '../../../packlets/workspace';
import { ConfectionSessionPanel } from '../../../packlets/sessions';

// ============================================================================
// Mock factory
// ============================================================================

function createMockProduced(
  overrides?: Partial<{
    readonly yield: Entities.Confections.IConfectionYield;
    readonly fillings: ReadonlyArray<Entities.Confections.AnyResolvedFillingSlotEntity>;
    readonly procedureId: ProcedureId | undefined;
    readonly notes: ReadonlyArray<Model.ICategorizedNote> | undefined;
    readonly enrobingChocolateId: IngredientId | undefined;
  }>
): UserLibrary.Session.AnyConfectionEditingSession['produced'] {
  const yieldSpec = overrides?.yield ?? { count: 24, unit: 'pieces' as const };
  return {
    yield: yieldSpec,
    current: {
      variationId: 'test.variation',
      yield: yieldSpec,
      fillings: overrides?.fillings ?? [],
      procedureId: overrides?.procedureId,
      notes: overrides?.notes ?? [],
      enrobingChocolateId: overrides?.enrobingChocolateId
    },
    fillings: overrides?.fillings ?? [],
    procedureId: overrides?.procedureId,
    notes: overrides?.notes ?? [],
    setNotes: () => succeed(undefined),
    setProcedure: () => succeed(undefined),
    setFillingSlot: jest.fn(() => succeed(undefined)),
    removeFillingSlot: jest.fn(() => succeed(undefined)),
    scaleToYield: () => succeed(yieldSpec)
  } as unknown as UserLibrary.Session.AnyConfectionEditingSession['produced'];
}

function createMockSession(overrides?: {
  readonly fillings?: ReadonlyArray<Entities.Confections.AnyResolvedFillingSlotEntity>;
  readonly procedureId?: ProcedureId;
  readonly status?: Entities.PersistedSessionStatus;
  readonly enrobingChocolateId?: IngredientId;
}): UserLibrary.Session.AnyConfectionEditingSession {
  const mockFillingSession = {
    baseRecipe: {
      fillingRecipe: { name: 'Ganache' }
    },
    targetWeight: 20 as Measurement,
    hasChanges: false
  } as unknown as UserLibrary.Session.IEmbeddableFillingSession;

  const fillings = overrides?.fillings ?? [
    {
      slotType: 'recipe' as const,
      slotId: 'slot.1' as SlotId,
      fillingId: 'filling.1' as unknown as FillingId
    }
  ];

  return {
    sessionType: 'confection' as const,
    confectionType: 'bar-truffle',
    status: overrides?.status ?? 'planning',
    label: 'Mock Confection Session',
    baseId: 'mock-session',
    sourceVariationId: 'test.source-variation',
    hasChanges: false,
    baseConfection: {
      name: 'Mock Confection',
      goldenVariation: {
        name: 'Classic',
        variationSpec: 'classic-spec'
      }
    },
    produced: createMockProduced({
      fillings,
      procedureId: overrides?.procedureId,
      enrobingChocolateId: overrides?.enrobingChocolateId
    }),
    group: undefined,
    updatedAt: undefined,
    scaleToYield: () => succeed({ count: 24, unit: 'pieces' as const }),
    setFillingSlot: () => succeed(undefined),
    removeFillingSlot: () => succeed(undefined),
    getFillingSession: () => mockFillingSession
  } as unknown as UserLibrary.Session.AnyConfectionEditingSession;
}

function renderPanel(
  session: UserLibrary.Session.AnyConfectionEditingSession,
  props?: Partial<{
    readonly onSelectFillingSlot: (slotId: SlotId, label: string) => void;
    readonly onBrowseIngredient: (ingredientId: IngredientId) => void;
    readonly onBrowseProcedure: (procedureId: ProcedureId) => void;
    readonly onClose: () => void;
  }>
): ReturnType<typeof render> {
  const workspace = Workspace.create({ builtin: true }).orThrow();
  const reactiveWorkspace = new ReactiveWorkspace(workspace);

  return render(
    <WorkspaceProvider reactiveWorkspace={reactiveWorkspace}>
      <ConfectionSessionPanel sessionId={'test.session' as SessionId} session={session} {...props} />
    </WorkspaceProvider>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('ConfectionSessionPanel', () => {
  it('renders confection info section', () => {
    renderPanel(createMockSession());

    expect(screen.getByText('Mock Confection Session')).toBeInTheDocument();
    expect(screen.getByText('Bar Truffle')).toBeInTheDocument();
    // Recipe name and variation shown in the condensed header
    expect(screen.getByText(/Classic/)).toBeInTheDocument();
  });

  it('renders yield inline with count input for bar-truffle', () => {
    renderPanel(createMockSession());

    expect(screen.getByText('Yield')).toBeInTheDocument();
    const countInput = screen.getByDisplayValue('24');
    expect(countInput).toBeInTheDocument();
    expect(countInput).toHaveAttribute('type', 'number');
  });

  it('renders filling slots as clickable buttons', () => {
    renderPanel(createMockSession());

    expect(screen.getByText('Fillings')).toBeInTheDocument();
    expect(screen.getByText('Ganache')).toBeInTheDocument();
  });

  it('calls onSelectFillingSlot when a filling slot is clicked', () => {
    const handleSelectSlot = jest.fn();
    renderPanel(createMockSession(), { onSelectFillingSlot: handleSelectSlot });

    fireEvent.click(screen.getByText('Ganache'));

    expect(handleSelectSlot).toHaveBeenCalledWith('slot.1' as SlotId, 'Ganache');
  });

  it('renders remove button on filling slots', () => {
    renderPanel(createMockSession());

    const removeButton = screen.getByRole('button', { name: /Remove Ganache/i });
    expect(removeButton).toBeInTheDocument();
  });

  it('renders add-filling input', () => {
    renderPanel(createMockSession());

    expect(screen.getByPlaceholderText('Add filling…')).toBeInTheDocument();
  });

  it('renders procedure section when procedureId is present', () => {
    const session = createMockSession({ procedureId: 'test.procedure' as ProcedureId });
    renderPanel(session);

    expect(screen.getByText('Procedure')).toBeInTheDocument();
  });

  it('calls onBrowseProcedure when procedure is clicked', () => {
    const handleBrowseProcedure = jest.fn();
    const session = createMockSession({ procedureId: 'test.procedure' as ProcedureId });
    renderPanel(session, { onBrowseProcedure: handleBrowseProcedure });

    const procButton = screen.getByText('test.procedure');
    fireEvent.click(procButton);

    expect(handleBrowseProcedure).toHaveBeenCalledWith('test.procedure' as ProcedureId);
  });

  it('renders empty state when no filling slots', () => {
    const session = createMockSession({ fillings: [] });
    renderPanel(session);

    expect(screen.getByText('No fillings configured.')).toBeInTheDocument();
  });

  it('renders notes editor', () => {
    renderPanel(createMockSession());

    expect(screen.getByText('Session Notes')).toBeInTheDocument();
  });
});
