import React from 'react';

import type { IPreferencesDraft } from '../useSettingsDraft';

export interface IExternalLibrariesSectionProps {
  readonly externalLibraries: IPreferencesDraft['externalLibraries'];
  readonly onChange: (updates: Partial<IPreferencesDraft>) => void;
}

export function ExternalLibrariesSection(props: IExternalLibrariesSectionProps): React.ReactElement {
  const { externalLibraries, onChange } = props;

  function handleRemove(index: number): void {
    const updated = externalLibraries.filter((__item, i) => i !== index);
    onChange({ externalLibraries: updated });
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary mb-4">External Libraries</h2>
        <div className="space-y-3">
          {externalLibraries.length === 0 ? (
            <p className="text-sm text-muted italic">No external libraries configured.</p>
          ) : (
            <ul className="space-y-2">
              {externalLibraries.map((lib, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-3 px-3 py-2 bg-surface-alt border border-border rounded-md"
                >
                  <span className="text-sm text-secondary font-mono truncate flex-1">{lib.ref}</span>
                  <button
                    type="button"
                    onClick={(): void => handleRemove(index)}
                    className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 transition-colors"
                    aria-label={`Remove ${lib.ref}`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">External library management (add/edit) coming soon.</p>
        </div>
      </div>
    </div>
  );
}
