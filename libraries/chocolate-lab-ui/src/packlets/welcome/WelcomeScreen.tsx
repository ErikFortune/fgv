/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Welcome & setup screen for first-time containerized app launch.
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';

import type { Settings } from '@fgv/ts-chocolate';

import { useReactiveWorkspace } from '../workspace';
import type { IColdStartContext, SetupChoice } from './model';
import { SetUpNewStep } from './SetUpNewStep';
import { RestoreFromBackupStep } from './RestoreFromBackupStep';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the WelcomeScreen component.
 * @public
 */
export interface IWelcomeScreenProps {
  /** Cold start context from the boot flow. */
  readonly coldStartContext: IColdStartContext;
  /** Called when setup is complete and the app should proceed to the main shell. */
  readonly onComplete: () => void;
}

// ============================================================================
// Cold Start Defaults
// ============================================================================

/**
 * Applies the server-provided cold-start defaults to bootstrap and preferences settings.
 * This is the same logic that was previously inlined in _buildReactiveWorkspace.
 */
async function applyColdStartDefaults(
  settings: Settings.ISettingsManager,
  ctx: IColdStartContext,
  cloudRootName: string | undefined
): Promise<void> {
  settings.updateBootstrapSettings({
    ...(ctx.defaultCloudStorage ? { cloudStorage: ctx.defaultCloudStorage } : {}),
    localStorage: { library: false, userData: false },
    ...(cloudRootName
      ? {
          keystoreLocation: { type: 'external' as const, rootName: cloudRootName },
          preferencesLocation: { type: 'external' as const, rootName: cloudRootName }
        }
      : {})
  });

  const currentPrefs = settings.getPreferencesSettings();
  settings.updatePreferencesSettings({
    ...(cloudRootName
      ? {
          defaultStorageTargets: {
            libraryDefault: cloudRootName as unknown as Settings.StorageRootId,
            userDataDefault: cloudRootName as unknown as Settings.StorageRootId
          }
        }
      : {}),
    ...(ctx.serverConfig.proxyAvailable
      ? {
          tools: {
            ...currentPrefs.tools,
            aiAssist: {
              ...currentPrefs.tools?.aiAssist,
              providers: currentPrefs.tools?.aiAssist?.providers ?? [{ provider: 'copy-paste' }],
              proxyUrl: window.location.origin,
              proxyAllProviders: true
            }
          }
        }
      : {})
  });

  await settings.save();
}

// ============================================================================
// Component
// ============================================================================

/**
 * Full-page welcome screen shown on cold start in container mode.
 *
 * Offers three paths:
 * - Restore from backup
 * - Set up new (keystore + default collections)
 * - Continue without setup (apply defaults only)
 *
 * @public
 */
export function WelcomeScreen(props: IWelcomeScreenProps): React.ReactElement {
  const { coldStartContext, onComplete } = props;
  const reactiveWorkspace = useReactiveWorkspace();
  const [choice, setChoice] = useState<SetupChoice | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const cloudRootName = (() => {
    const roots = reactiveWorkspace.storageSummary.roots;
    const cloudRoot = roots.find((r) => r.isCloud);
    return cloudRoot?.sourceName;
  })();

  const finishSetup = useCallback(async (): Promise<void> => {
    const settings = reactiveWorkspace.workspace.settings;
    if (settings) {
      await applyColdStartDefaults(settings, coldStartContext, cloudRootName);
    }
    onComplete();
  }, [reactiveWorkspace, coldStartContext, cloudRootName, onComplete]);

  const handleSkip = useCallback(async (): Promise<void> => {
    setBusy(true);
    await finishSetup();
  }, [finishSetup]);

  const handleSetupComplete = useCallback(async (): Promise<void> => {
    await finishSetup();
  }, [finishSetup]);

  if (choice === 'setup-new') {
    return <SetUpNewStep onComplete={handleSetupComplete} onBack={(): void => setChoice(undefined)} />;
  }

  if (choice === 'restore') {
    return (
      <RestoreFromBackupStep onComplete={handleSetupComplete} onBack={(): void => setChoice(undefined)} />
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface">
      <div className="w-full max-w-lg mx-4 text-center">
        {/* Branding */}
        <img
          src="/ChocolateLabSquareIcon.webp"
          alt="Chocolate Lab"
          className="w-32 h-32 mx-auto mb-6 rounded-2xl shadow-lg"
        />
        <h1 className="text-3xl font-bold text-primary mb-2">Welcome to Chocolate Lab</h1>
        <p className="text-muted mb-8">
          Let&apos;s get your workspace set up. You can restore from a backup, start fresh, or skip setup
          entirely.
        </p>

        {/* Choice cards */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={(): void => setChoice('restore')}
            disabled={busy}
            className="w-full p-4 text-left bg-surface border border-border rounded-lg hover:bg-hover transition-colors disabled:opacity-50"
          >
            <div className="font-semibold text-primary">Restore from Backup</div>
            <div className="text-sm text-muted mt-1">
              Upload a backup archive to restore your settings, keystore, and collections.
            </div>
          </button>

          <button
            type="button"
            onClick={(): void => setChoice('setup-new')}
            disabled={busy}
            className="w-full p-4 text-left bg-surface border border-border rounded-lg hover:bg-hover transition-colors disabled:opacity-50"
          >
            <div className="font-semibold text-primary">Set Up New</div>
            <div className="text-sm text-muted mt-1">
              Configure a master password and create default collections for each section.
            </div>
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={busy}
            className="w-full p-4 text-left bg-surface border border-border rounded-lg hover:bg-hover transition-colors disabled:opacity-50"
          >
            <div className="font-semibold text-secondary">Continue Without Setup</div>
            <div className="text-sm text-muted mt-1">
              Skip setup and configure everything later from Settings.
            </div>
          </button>
        </div>

        {busy && <p className="text-sm text-muted mt-4">Applying defaults…</p>}
      </div>
    </div>
  );
}
