import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResolutionView } from '../../../components/views/ResolutionView';
import { Runtime } from '@fgv/ts-res';
import { createTsResSystemFromConfig } from '../../../utils/tsResIntegration';
import type { IProcessedResources, IResolutionState, IResolutionActions } from '../../../types';
import { JsonValue } from '@fgv/ts-json-base';
import { ResourceJson } from '@fgv/ts-res';

function buildProcessedResources(): IProcessedResources {
  const system = createTsResSystemFromConfig().orThrow();
  const compiledCollection = system.resourceManager
    .getCompiledResourceCollection({ includeMetadata: true })
    .orThrow();
  const resolver = Runtime.ResourceResolver.create({
    resourceManager: system.resourceManager,
    qualifierTypes: system.qualifierTypes,
    contextQualifierProvider: system.contextQualifierProvider
  }).orThrow();
  const resourceIds = Array.from(system.resourceManager.resources.keys());
  return {
    system,
    compiledCollection,
    resolver,
    resourceCount: resourceIds.length,
    summary: { totalResources: resourceIds.length, resourceIds, errorCount: 0, warnings: [] }
  } as unknown as IProcessedResources;
}

function makeStateActions(
  overrides: { state?: Partial<IResolutionState>; actions?: Partial<IResolutionActions> } = {}
): { state: IResolutionState; actions: IResolutionActions } {
  const state = {
    contextValues: {},
    pendingContextValues: {},
    selectedResourceId: null,
    currentResolver: {} as unknown as Runtime.ResourceResolver,
    resolutionResult: null,
    viewMode: 'composed',
    hasPendingChanges: false,
    editedResources: new Map(),
    hasUnsavedEdits: false,
    isApplyingEdits: false,
    pendingResources: new Map(),
    pendingResourceDeletions: new Set<string>(),
    availableResourceTypes: [],
    hasPendingResourceChanges: false,
    ...overrides.state
  };
  const actions = {
    setViewMode: jest.fn(),
    updateContextValue: jest.fn(),
    applyContext: jest.fn(),
    resetCache: jest.fn(),
    selectResource: jest.fn(),
    saveNewResourceAsPending: jest.fn(),
    startNewResource: jest.fn(),
    cancelNewResource: jest.fn(),
    applyPendingResources: jest.fn(),
    discardPendingResources: jest.fn(),
    discardEdits: jest.fn(),
    ...overrides.actions
  };
  return { state: state as IResolutionState, actions: actions as IResolutionActions };
}

describe('ResolutionView unified changes', () => {
  it('shows Pending Changes when there are edits/additions and calls unified apply', () => {
    const { state, actions } = makeStateActions({
      state: {
        hasUnsavedEdits: true,
        editedResources: new Map([['r1', {} as unknown as JsonValue]]),
        hasPendingResourceChanges: true,
        pendingResources: new Map([
          ['new.res', { id: 'new.res', candidates: [{}] } as unknown as ResourceJson.Json.ILooseResourceDecl]
        ])
      }
    });

    const processed = buildProcessedResources();
    render(
      <ResolutionView
        resources={processed}
        resolutionState={state}
        resolutionActions={actions}
        availableQualifiers={['language']}
        contextOptions={{ showContextControls: false }}
      />
    );

    // Pending Changes bar present
    expect(screen.getByText(/Pending Changes/i)).toBeInTheDocument();

    // Apply Changes triggers unified applyPendingResources
    fireEvent.click(screen.getByRole('button', { name: /Apply Changes/i }));
    expect(actions.applyPendingResources).toHaveBeenCalled();
  });

  it('respects lockedViewMode and custom sectionTitles', () => {
    const { state, actions } = makeStateActions();
    const processed = buildProcessedResources();
    render(
      <ResolutionView
        resources={processed}
        resolutionState={state}
        resolutionActions={actions}
        availableQualifiers={['language']}
        lockedViewMode="best"
        sectionTitles={{ resources: 'Items', results: 'Output' }}
        contextOptions={{ showContextControls: false }}
      />
    );

    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Output')).toBeInTheDocument();
    expect(screen.getByText(/Best View/)).toBeInTheDocument();
  });
});
