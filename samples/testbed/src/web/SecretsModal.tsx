/**
 * Shell-owned secrets modal — lists the union of `requiredSecrets` across every
 * registered scenario (deduped by id via `dedupeRequiredSecrets`) and lets the user paste
 * values that live in session-memory React state for the current browser tab only.
 *
 * @packageDocumentation
 */

import React from 'react';
import { Modal } from '@fgv/ts-app-shell';
import { CryptoUtils } from '@fgv/ts-extras';

import { dedupeRequiredSecrets } from '../shell';
import type { IScenario, ISecretSpec } from '../shell';
import { KeyStoreSection } from './KeyStoreSection';

/**
 * Props for {@link SecretsModal}.
 * @public
 */
export interface ISecretsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** Full scenario registry — the modal derives its field list from this. */
  readonly scenarios: readonly IScenario[];
  /** Current session-memory secret values, keyed by {@link ISecretSpec.id}. */
  readonly secrets: ReadonlyMap<string, string>;
  readonly onSetSecret: (id: string, value: string) => void;
  /** The currently unlocked KeyStore, or `undefined` if none is open. */
  readonly keyStore: CryptoUtils.KeyStore.KeyStore | undefined;
  readonly onKeyStoreUnlocked: (keyStore: CryptoUtils.KeyStore.KeyStore) => void;
  readonly onKeyStoreLocked: () => void;
}

/** Renders a single secret field: label, description, env-var fallback note, and input. */
function SecretField({
  spec,
  value,
  onChange
}: {
  readonly spec: ISecretSpec;
  readonly value: string;
  readonly onChange: (value: string) => void;
}): React.ReactElement {
  const inputId = `testbed-secret-input-${spec.id}`;
  return (
    <div className="space-y-1" data-testid={`testbed-secret-field-${spec.id}`}>
      <label htmlFor={inputId} className="block text-sm font-medium text-primary">
        {spec.id}
      </label>
      <input
        id={inputId}
        data-testid={`testbed-secret-input-${spec.id}`}
        type="password"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Falls back to ${spec.envVarName} (CLI only — not read in the browser)`}
        className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring"
      />
      <p className="text-xs text-secondary">{spec.description}</p>
    </div>
  );
}

/**
 * Secrets modal. Values are held only in the session-memory store passed in via
 * `secrets`/`onSetSecret` — nothing is persisted or encrypted (see the
 * `testbed-web-scenarios` brief for why that's out of scope for this phase).
 * @public
 */
export function SecretsModal(props: ISecretsModalProps): React.ReactElement {
  const { isOpen, onClose, scenarios, secrets, onSetSecret, keyStore, onKeyStoreUnlocked, onKeyStoreLocked } =
    props;
  const specs = dedupeRequiredSecrets(scenarios);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secrets">
      <div data-testid="testbed-secrets-modal" className="space-y-4">
        <p className="text-sm text-secondary">
          API keys entered here live in memory for this browser session only — they are never persisted or
          sent anywhere except directly to the provider you select in a scenario.
        </p>
        <KeyStoreSection keyStore={keyStore} onUnlocked={onKeyStoreUnlocked} onLocked={onKeyStoreLocked} />
        {specs.length === 0 ? (
          <p data-testid="testbed-secrets-empty" className="text-sm text-muted">
            No registered scenario declares a required secret yet.
          </p>
        ) : (
          <div className="space-y-4">
            {specs.map((spec) => (
              <SecretField
                key={spec.id}
                spec={spec}
                value={secrets.get(spec.id) ?? ''}
                onChange={(value) => onSetSecret(spec.id, value)}
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
