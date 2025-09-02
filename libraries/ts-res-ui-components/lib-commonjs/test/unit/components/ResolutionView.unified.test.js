'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importDefault(require('react'));
const react_2 = require('@testing-library/react');
const ResolutionView_1 = require('../../../components/views/ResolutionView');
const ts_res_1 = require('@fgv/ts-res');
const tsResIntegration_1 = require('../../../utils/tsResIntegration');
function buildProcessedResources() {
  const system = (0, tsResIntegration_1.createTsResSystemFromConfig)().orThrow();
  const compiledCollection = system.resourceManager
    .getCompiledResourceCollection({ includeMetadata: true })
    .orThrow();
  const resolver = ts_res_1.Runtime.ResourceResolver.create({
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
  };
}
function makeStateActions(overrides = {}) {
  const state = {
    contextValues: {},
    pendingContextValues: {},
    selectedResourceId: null,
    currentResolver: {},
    resolutionResult: null,
    viewMode: 'composed',
    hasPendingChanges: false,
    editedResources: new Map(),
    hasUnsavedEdits: false,
    isApplyingEdits: false,
    pendingResources: new Map(),
    pendingResourceDeletions: new Set(),
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
  return { state, actions };
}
describe('ResolutionView unified changes', () => {
  it('shows Pending Changes when there are edits/additions and calls unified apply', () => {
    const { state, actions } = makeStateActions({
      state: {
        hasUnsavedEdits: true,
        editedResources: new Map([['r1', {}]]),
        hasPendingResourceChanges: true,
        pendingResources: new Map([['new.res', { id: 'new.res', candidates: [{}] }]])
      }
    });
    const processed = buildProcessedResources();
    (0, react_2.render)(
      react_1.default.createElement(ResolutionView_1.ResolutionView, {
        resources: processed,
        resolutionState: state,
        resolutionActions: actions,
        availableQualifiers: ['language'],
        contextOptions: { showContextControls: false }
      })
    );
    // Pending Changes bar present
    expect(react_2.screen.getByText(/Pending Changes/i)).toBeInTheDocument();
    // Apply Changes triggers unified applyPendingResources
    react_2.fireEvent.click(react_2.screen.getByRole('button', { name: /Apply Changes/i }));
    expect(actions.applyPendingResources).toHaveBeenCalled();
  });
  it('respects lockedViewMode and custom sectionTitles', () => {
    const { state, actions } = makeStateActions();
    const processed = buildProcessedResources();
    (0, react_2.render)(
      react_1.default.createElement(ResolutionView_1.ResolutionView, {
        resources: processed,
        resolutionState: state,
        resolutionActions: actions,
        availableQualifiers: ['language'],
        lockedViewMode: 'best',
        sectionTitles: { resources: 'Items', results: 'Output' },
        contextOptions: { showContextControls: false }
      })
    );
    expect(react_2.screen.getByText('Items')).toBeInTheDocument();
    expect(react_2.screen.getByText('Output')).toBeInTheDocument();
    expect(react_2.screen.getByText(/Best View/)).toBeInTheDocument();
  });
});
//# sourceMappingURL=ResolutionView.unified.test.js.map
