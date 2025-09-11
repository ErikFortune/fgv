import React from 'react';
import { ObservabilityProvider } from '../../contexts';
import { ObservabilityTools } from '../../namespaces';
import type { IObservabilityContext } from '../../utils/observability';

export function createObservabilityTestWrapper(
  context?: IObservabilityContext
): React.FC<{ children: React.ReactNode }> {
  const observabilityContext = context ?? ObservabilityTools.TestObservabilityContext;
  return ({ children }: { children: React.ReactNode }) => (
    <ObservabilityProvider observabilityContext={observabilityContext}>{children}</ObservabilityProvider>
  );
}
