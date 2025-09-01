/**
 * Enhanced observability utilities for ts-res-ui-playground.
 * Provides detailed diagnostic logging for debugging factory chains and configuration processing.
 */

import { ObservabilityTools } from '@fgv/ts-res-ui-components';
import { QualifierTypes, Config } from '@fgv/ts-res';
import { JsonObject } from '@fgv/ts-json-base';

/**
 * Creates an enhanced observability context with detailed console logging.
 * This is specifically designed for debugging the playground's factory chain issues.
 */
export function createPlaygroundObservabilityContext(): ObservabilityTools.IObservabilityContext {
  // Create console context with debug-level logging
  return ObservabilityTools.createConsoleObservabilityContext('info', 'info');
}

/**
 * Logs factory creation attempts with detailed information.
 */
export function logFactoryAttempt(
  o11y: ObservabilityTools.IObservabilityContext,
  factoryName: string,
  config: QualifierTypes.Config.IQualifierTypeConfig<JsonObject>
): void {
  o11y.diag.info(
    `[FACTORY] ${factoryName} attempting to create qualifier type: ${config.name} (${config.systemType})`,
    {
      name: config.name,
      systemType: config.systemType,
      hasConfiguration: !!config.configuration,
      configuration: config.configuration
    }
  );
}

/**
 * Logs factory success with the created type information.
 */
export function logFactorySuccess(
  o11y: ObservabilityTools.IObservabilityContext,
  factoryName: string,
  typeName: string,
  systemType: string
): void {
  o11y.diag.info(`[FACTORY] ✅ ${factoryName} successfully created:`, {
    typeName,
    systemType,
    message: `Successfully created ${systemType} qualifier type "${typeName}"`
  });
}

/**
 * Logs factory failure with detailed error information.
 */
export function logFactoryFailure(
  o11y: ObservabilityTools.IObservabilityContext,
  factoryName: string,
  config: QualifierTypes.Config.IQualifierTypeConfig<JsonObject>,
  reason: string
): void {
  o11y.diag.warn(
    `[FACTORY] ⚠️ ${factoryName} cannot handle type: ${config.name} (${config.systemType}) - ${reason}`,
    {
      requestedName: config.name,
      requestedSystemType: config.systemType,
      reason,
      message: `${factoryName} skipping "${config.name}" (${config.systemType}): ${reason}`
    }
  );
}

/**
 * Logs configuration processing with detailed information.
 */
export function logConfigurationProcessing(
  o11y: ObservabilityTools.IObservabilityContext,
  config: Config.Model.ISystemConfiguration
): void {
  o11y.diag.info('[CONFIG] Processing system configuration:', {
    qualifierTypesCount: config.qualifierTypes?.length || 0,
    qualifiersCount: config.qualifiers?.length || 0,
    resourceTypesCount: config.resourceTypes?.length || 0,
    qualifierTypes: config.qualifierTypes?.map((qt) => ({
      name: qt.name,
      systemType: qt.systemType
    }))
  });
}

/**
 * Logs import process stages.
 */
export function logImportStage(
  o11y: ObservabilityTools.IObservabilityContext,
  stage:
    | 'start'
    | 'config-load'
    | 'config-apply'
    | 'resource-load'
    | 'resource-process'
    | 'complete'
    | 'error',
  details?: any
): void {
  const stageMessages = {
    start: '🚀 Starting import process',
    'config-load': '📋 Loading configuration',
    'config-apply': '⚙️ Applying configuration',
    'resource-load': '📁 Loading resources',
    'resource-process': '🔄 Processing resources',
    complete: '✅ Import complete',
    error: '❌ Import failed'
  };

  const message = stageMessages[stage] || `Unknown stage: ${stage}`;

  if (stage === 'error') {
    o11y.diag.error(`[IMPORT] ${message}`, details);
    o11y.user.error(`Import failed: ${details?.error || 'Unknown error'}`);
  } else {
    // Enhanced logging with better object display
    if (details && typeof details === 'object') {
      const detailsStr = JSON.stringify(details, null, 2);
      o11y.diag.info(`[IMPORT] ${message} - Details: ${detailsStr}`, details);
    } else {
      o11y.diag.info(`[IMPORT] ${message} ${details ? `(${details})` : ''}`);
    }

    if (stage === 'complete') {
      o11y.user.success('Resources imported successfully');
    } else if (stage !== 'start') {
      o11y.user.info(message);
    }
  }
}

/**
 * Helper to create a diagnostic summary of the current state.
 */
export function logDiagnosticSummary(
  o11y: ObservabilityTools.IObservabilityContext,
  summary: {
    configLoaded: boolean;
    qualifierTypesCreated: number;
    qualifierTypesExpected: number;
    resourcesLoaded: number;
    errors: string[];
  }
): void {
  o11y.diag.info('[DIAGNOSTIC] Current state summary:', summary);

  if (summary.errors.length > 0) {
    o11y.diag.error('[DIAGNOSTIC] Errors encountered:', summary.errors);
    o11y.user.warn(`Issues detected: ${summary.errors.length} error(s). Check console for details.`);
  }

  if (summary.qualifierTypesCreated < summary.qualifierTypesExpected) {
    const missing = summary.qualifierTypesExpected - summary.qualifierTypesCreated;
    o11y.user.warn(`Configuration issue: ${missing} qualifier type(s) could not be created`);
  }
}
