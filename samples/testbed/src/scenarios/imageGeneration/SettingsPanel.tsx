/**
 * Provider + model picker for the `image-generation` scenario. Ported from
 * `samples/ai-image-gen-sample/src/components/SettingsPanel.tsx`, minus the per-scenario
 * API-key `<input>` — keys now come from the shell's session secrets store via
 * `context.resolveSecret` (see `useProviderApiKey` in `../aiProviderSecrets.ts`). In its
 * place, a "missing key" affordance points the user at the top-bar Secrets button.
 *
 * @packageDocumentation
 */

import React from 'react';
import { AiAssist } from '@fgv/ts-extras';

import type { ProviderApiKeyStatus } from '../aiProviderSecrets';

export interface ISettingsPanelProps {
  readonly providers: ReadonlyArray<AiAssist.AiProviderId>;
  readonly provider: AiAssist.AiProviderId;
  readonly onProviderChange: (provider: AiAssist.AiProviderId) => void;
  readonly apiKeyStatus: ProviderApiKeyStatus;
  readonly apiKeyError: string | undefined;
  readonly model: string;
  readonly modelPlaceholder: string;
  readonly onModelChange: (model: string) => void;
  readonly availableModels: ReadonlyArray<AiAssist.IAiModelInfo>;
  readonly isFetchingModels: boolean;
  readonly modelListError: string | undefined;
  readonly onFetchModels: () => void;
}

export function SettingsPanel(props: ISettingsPanelProps): React.ReactElement {
  const {
    providers,
    provider,
    onProviderChange,
    apiKeyStatus,
    apiKeyError,
    model,
    modelPlaceholder,
    onModelChange,
    availableModels,
    isFetchingModels,
    modelListError,
    onFetchModels
  } = props;
  const descriptor = AiAssist.getProviderDescriptor(provider).orDefault();
  const canFetchModels = apiKeyStatus === 'ready' && !isFetchingModels;

  return (
    <section
      data-testid="image-gen-settings"
      className="rounded-lg border border-border bg-surface-raised p-4"
    >
      <h3 className="text-sm font-semibold text-primary">Provider</h3>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-secondary">Provider</span>
          <select
            data-testid="image-gen-provider-select"
            className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as AiAssist.AiProviderId)}
          >
            {providers.map((p) => {
              const d = AiAssist.getProviderDescriptor(p).orDefault();
              return (
                <option key={p} value={p}>
                  {d?.label ?? p}
                </option>
              );
            })}
          </select>
        </label>

        <div className="block text-sm">
          <span className="font-medium text-secondary">API key</span>
          {apiKeyStatus === 'ready' ? (
            <p data-testid="image-gen-key-ready" className="mt-1 text-status-success-text">
              ✓ Key configured for {descriptor?.label ?? provider}
            </p>
          ) : apiKeyStatus === 'loading' ? (
            <p data-testid="image-gen-key-loading" className="mt-1 text-muted">
              Checking for a configured key…
            </p>
          ) : (
            <p data-testid="image-gen-key-missing" className="mt-1 text-status-warning-text">
              No key configured for {descriptor?.label ?? provider}. Open{' '}
              <strong className="font-semibold">Secrets</strong> (top bar) to add one.
              {apiKeyError !== undefined && <span className="block text-xs text-muted">{apiKeyError}</span>}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-end gap-2">
          <label className="block flex-1 text-sm">
            <span className="font-medium text-secondary">Model</span>
            <input
              type="text"
              data-testid="image-gen-model-input"
              className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring"
              placeholder={modelPlaceholder}
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button
            type="button"
            data-testid="image-gen-fetch-models-btn"
            disabled={!canFetchModels}
            onClick={onFetchModels}
            className="h-[38px] shrink-0 rounded-md border border-border bg-surface px-3 text-sm font-medium text-secondary shadow-sm transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetchingModels ? 'Fetching…' : 'Fetch available'}
          </button>
        </div>

        {modelListError !== undefined ? (
          <p data-testid="image-gen-model-list-error" className="mt-2 text-xs text-status-error-text">
            <span className="font-semibold">List failed:</span> {modelListError}. You can still type a model
            name manually.
          </p>
        ) : availableModels.length > 0 ? (
          <ul data-testid="image-gen-model-list" className="mt-2 text-xs text-secondary">
            {availableModels.map((m) => (
              <li key={m.id}>{m.displayName ?? m.id}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted">
            Override the model name when the registry default isn&apos;t available on your API tier, or
            click <strong>Fetch available</strong> after a key is configured to see what your account can
            use.
          </p>
        )}
      </div>

      {descriptor?.corsRestricted && (
        <p className="mt-3 text-xs">
          <span className="inline-flex items-center rounded-full bg-status-warning-bg px-2 py-0.5 font-medium text-status-warning-text">
            CORS-restricted (proxy required for production)
          </span>
        </p>
      )}
    </section>
  );
}
