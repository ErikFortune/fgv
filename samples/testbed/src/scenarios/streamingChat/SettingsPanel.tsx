/**
 * Provider + model picker for the `streaming-chat` scenario. A chat-specific sibling of
 * `../imageGeneration/SettingsPanel.tsx` (different provider set, streaming-CORS notice
 * instead of image-CORS) — kept as its own small component rather than a shared
 * abstraction per the "three similar lines is better than a premature abstraction" rule.
 *
 * @packageDocumentation
 */

import React from 'react';
import { AiAssist } from '@fgv/ts-extras';

import type { ProviderApiKeyStatus } from '../aiProviderSecrets';

export interface IChatSettingsPanelProps {
  readonly providers: ReadonlyArray<AiAssist.AiProviderId>;
  readonly provider: AiAssist.AiProviderId;
  readonly onProviderChange: (provider: AiAssist.AiProviderId) => void;
  readonly apiKeyStatus: ProviderApiKeyStatus;
  readonly apiKeyError: string | undefined;
  readonly model: string;
  readonly modelPlaceholder: string;
  readonly onModelChange: (model: string) => void;
}

export function ChatSettingsPanel(props: IChatSettingsPanelProps): React.ReactElement {
  const { providers, provider, onProviderChange, apiKeyStatus, apiKeyError, model, modelPlaceholder, onModelChange } =
    props;
  const descriptor = AiAssist.getProviderDescriptor(provider).orDefault();

  return (
    <section
      data-testid="streaming-chat-settings"
      className="rounded-lg border border-border bg-surface-raised p-4"
    >
      <h3 className="text-sm font-semibold text-primary">Provider</h3>

      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-secondary">Provider</span>
          <select
            data-testid="streaming-chat-provider-select"
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
            <p data-testid="streaming-chat-key-ready" className="mt-1 text-status-success-text">
              ✓ Key configured for {descriptor?.label ?? provider}
            </p>
          ) : apiKeyStatus === 'loading' ? (
            <p data-testid="streaming-chat-key-loading" className="mt-1 text-muted">
              Checking for a configured key…
            </p>
          ) : (
            <p data-testid="streaming-chat-key-missing" className="mt-1 text-status-warning-text">
              No key configured for {descriptor?.label ?? provider}. Open{' '}
              <strong className="font-semibold">Secrets</strong> (top bar) to add one.
              {apiKeyError !== undefined && <span className="block text-xs text-muted">{apiKeyError}</span>}
            </p>
          )}
        </div>
      </div>

      <label className="mt-4 block text-sm">
        <span className="font-medium text-secondary">Model</span>
        <input
          type="text"
          data-testid="streaming-chat-model-input"
          className="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring"
          placeholder={modelPlaceholder}
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      {descriptor?.streamingCorsRestricted && (
        <p className="mt-3 text-xs">
          <span className="inline-flex items-center rounded-full bg-status-warning-bg px-2 py-0.5 font-medium text-status-warning-text">
            Streaming CORS-restricted — calls will fail without a proxy
          </span>
        </p>
      )}
    </section>
  );
}
