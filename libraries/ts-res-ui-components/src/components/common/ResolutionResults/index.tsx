import React, { useCallback } from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';
import { CandidateInfo, ResolutionActions, ResolutionState, ResourceEditorFactory } from '../../../types';
import { EditableJsonView } from '../../views/ResolutionView/EditableJsonView';

export interface ResolutionResultsProps {
  result: any;
  viewMode: 'composed' | 'best' | 'all' | 'raw';
  contextValues: Record<string, string | undefined>;
  resolutionActions?: ResolutionActions;
  resolutionState?: ResolutionState;
  resourceEditorFactory?: ResourceEditorFactory;
  onMessage?: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void;
}

export const ResolutionResults: React.FC<ResolutionResultsProps> = ({
  result,
  viewMode,
  contextValues,
  resolutionActions,
  resolutionState,
  resourceEditorFactory,
  onMessage
}) => {
  // Use a ref to store messages and useCallback to send them
  const pendingMessagesRef = React.useRef<
    Array<{ type: 'info' | 'warning' | 'error' | 'success'; message: string }>
  >([]);

  // Function to queue a message for later sending
  const queueMessage = React.useCallback(
    (type: 'info' | 'warning' | 'error' | 'success', message: string) => {
      pendingMessagesRef.current.push({ type, message });
    },
    []
  );

  // Function to flush queued messages
  const flushMessages = React.useCallback(() => {
    if (pendingMessagesRef.current.length > 0 && onMessage) {
      pendingMessagesRef.current.forEach(({ type, message }) => {
        onMessage(type, message);
      });
      pendingMessagesRef.current = [];
    }
  }, [onMessage]);

  // Flush messages after render is complete
  React.useEffect(() => {
    flushMessages();
  });

  // Helper function to create the appropriate resource editor
  const createResourceEditor = useCallback(
    (
      value: any,
      resourceId: string,
      isEdited: boolean,
      editedValue: any,
      onSave?: (resourceId: string, editedValue: any, originalValue: any) => void,
      onCancel?: (resourceId: string) => void,
      disabled?: boolean,
      className?: string
    ) => {
      // Try to get resource type from the result
      const resourceType =
        result?.resource?.resourceType?.key || result?.resource?.resourceType?.name || 'unknown';

      // Try the factory first if provided
      if (resourceEditorFactory) {
        try {
          const factoryResult = resourceEditorFactory.createEditor(resourceId, resourceType, value);
          if (factoryResult.success) {
            const CustomEditor = factoryResult.editor;
            return (
              <CustomEditor
                value={value}
                resourceId={resourceId}
                isEdited={isEdited}
                editedValue={editedValue}
                onSave={onSave}
                onCancel={onCancel}
                disabled={disabled}
                className={className}
              />
            );
          } else {
            // Factory couldn't create editor, queue message and fall back to JSON editor
            if (factoryResult.message) {
              queueMessage('info', `Using default JSON editor: ${factoryResult.message}`);
            }
            // Continue to fallback JSON editor below
          }
        } catch (error) {
          // Factory threw an error, queue message and fall back to JSON editor
          queueMessage(
            'warning',
            `Resource editor factory failed: ${error instanceof Error ? error.message : String(error)}`
          );
          // Continue to fallback JSON editor below
        }
      }

      // Fall back to the default JSON editor
      return (
        <EditableJsonView
          value={value}
          resourceId={resourceId}
          isEdited={isEdited}
          editedValue={editedValue}
          onSave={onSave}
          onCancel={onCancel}
          disabled={disabled}
          className={className}
        />
      );
    },
    [resourceEditorFactory, result, queueMessage]
  );

  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-medium text-red-800 mb-2">Resolution Failed</h4>
        <p className="text-sm text-red-600">{result.error}</p>
      </div>
    );
  }

  if (viewMode === 'raw') {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Raw Resolution Data</h4>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
            {JSON.stringify(
              {
                context: contextValues,
                resource: result.resource
                  ? {
                      id: result.resource.id,
                      candidateCount: result.resource.candidates.length
                    }
                  : null,
                bestCandidate: result.bestCandidate?.json,
                allCandidates: result.allCandidates?.map((c: any) => c.json),
                composedValue: result.composedValue,
                error: result.error
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    );
  }

  if (viewMode === 'composed') {
    return (
      <div className="space-y-4">
        {result.composedValue ? (
          createResourceEditor(
            result.composedValue,
            result.resourceId,
            resolutionActions?.hasEdit?.(result.resourceId) || false,
            resolutionActions?.getEditedValue?.(result.resourceId),
            resolutionActions?.saveEdit,
            () => {}, // Could add cancel functionality if needed
            resolutionState?.isApplyingEdits || false
          )
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-800">No composed value available for the current context.</p>
            {result.error && <p className="text-xs text-yellow-600 mt-1">{result.error}</p>}
          </div>
        )}

        {result.resource && (
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Resource Info</h4>
            <div className="bg-white p-3 rounded border text-sm">
              <div>
                <strong>ID:</strong> {result.resource.id}
              </div>
              <div>
                <strong>Type:</strong> {result.resource.resourceType.key}
              </div>
              <div>
                <strong>Total Candidates:</strong> {result.resource.candidates.length}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'best') {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Best Match</h4>
          {result.bestCandidate ? (
            <div className="bg-white p-3 rounded border border-green-200">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Selected candidate for current context
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(result.bestCandidate.json, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">No best candidate found for the current context.</p>
              {result.error && <p className="text-xs text-yellow-600 mt-1">{result.error}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 'all' view mode
  const regularMatchingCandidates =
    result.candidateDetails?.filter((c: CandidateInfo) => c.matched && !c.isDefaultMatch) || [];
  const defaultMatchingCandidates =
    result.candidateDetails?.filter((c: CandidateInfo) => c.matched && c.isDefaultMatch) || [];
  const nonMatchingCandidates = result.candidateDetails?.filter((c: CandidateInfo) => !c.matched) || [];

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'match':
        return 'bg-green-100 text-green-800';
      case 'matchAsDefault':
        return 'bg-amber-100 text-amber-800';
      case 'noMatch':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'match':
        return '✓';
      case 'matchAsDefault':
        return '≈';
      case 'noMatch':
        return '✗';
      default:
        return '?';
    }
  };

  return (
    <div className="space-y-4">
      {/* Regular Matching Candidates */}
      {regularMatchingCandidates.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Regular Matches</h4>
          <div className="space-y-2">
            {regularMatchingCandidates.map((candidateInfo: CandidateInfo, index: number) => (
              <div
                key={`regular-${candidateInfo.candidateIndex}`}
                className="bg-white p-3 rounded border border-green-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>
                      Candidate {candidateInfo.candidateIndex + 1} {index === 0 ? '(Best Match)' : ''}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${getMatchTypeColor(candidateInfo.matchType)}`}
                    >
                      {getMatchTypeIcon(candidateInfo.matchType)} {candidateInfo.matchType}
                    </span>
                  </div>
                </div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(candidateInfo.candidate.json, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Default Matching Candidates */}
      {defaultMatchingCandidates.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Default Matches</h4>
          <div className="space-y-2">
            {defaultMatchingCandidates.map((candidateInfo: CandidateInfo) => (
              <div
                key={`default-${candidateInfo.candidateIndex}`}
                className="bg-white p-3 rounded border border-amber-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <span>Candidate {candidateInfo.candidateIndex + 1}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${getMatchTypeColor(candidateInfo.matchType)}`}
                    >
                      {getMatchTypeIcon(candidateInfo.matchType)} {candidateInfo.matchType}
                    </span>
                  </div>
                </div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(candidateInfo.candidate.json, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show message when no matches */}
      {regularMatchingCandidates.length === 0 && defaultMatchingCandidates.length === 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Matching Candidates</h4>
          <p className="text-sm text-gray-600">No candidates matched the current context.</p>
        </div>
      )}

      {/* Non-matching Candidates */}
      {nonMatchingCandidates.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-500 mb-2">Non-matching Candidates</h4>
          <div className="space-y-2">
            {nonMatchingCandidates.slice(0, 3).map((candidateInfo: CandidateInfo) => (
              <div
                key={`non-matching-${candidateInfo.candidateIndex}`}
                className="bg-gray-50 p-3 rounded border border-gray-200 opacity-75"
              >
                <div className="text-sm font-medium text-gray-500 mb-2">
                  Candidate {candidateInfo.candidateIndex + 1}
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto text-gray-600">
                  {JSON.stringify(candidateInfo.candidate.json, null, 2)}
                </pre>
              </div>
            ))}
            {nonMatchingCandidates.length > 3 && (
              <div className="text-center text-sm text-gray-500">
                ... and {nonMatchingCandidates.length - 3} more non-matching candidates
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResolutionResults;
