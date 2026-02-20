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
 * Confection recipe preview panel - printed recipe sheet format.
 * @packageDocumentation
 */

import React from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';

import type { Entities, LibraryRuntime } from '@fgv/ts-chocolate';

import { renderPreview } from '../tasks';

// ============================================================================
// Props
// ============================================================================

export interface IConfectionPreviewPanelProps {
  readonly confection: LibraryRuntime.IConfectionBase;
  readonly draftEntity?: Entities.Confections.AnyConfectionRecipeEntity;
  readonly onClose?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatResolvedStepTiming(step: LibraryRuntime.IResolvedProcedureStep): string | undefined {
  const parts: string[] = [];
  if (step.activeTime !== undefined) parts.push(`${step.activeTime}min active`);
  if (step.waitTime !== undefined) parts.push(`${step.waitTime}min wait`);
  if (step.holdTime !== undefined) parts.push(`${step.holdTime}min hold`);
  if (step.temperature !== undefined) parts.push(`${step.temperature}°C`);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

// ============================================================================
// Sub-sections
// ============================================================================

function PreviewSection({
  title,
  children
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function MetaRow({
  label,
  value
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-baseline justify-between py-1 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 shrink-0 mr-4">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  );
}

function FillingSlotSection({
  slot
}: {
  readonly slot: LibraryRuntime.IResolvedFillingSlot;
}): React.ReactElement {
  const preferred =
    slot.filling.options.find((o) => o.id === slot.filling.preferredId) ?? slot.filling.options[0];
  const alternates = slot.filling.options.filter((o) => o.id !== preferred?.id);
  const preferredName = preferred?.type === 'recipe' ? preferred.filling.name : preferred?.ingredient.name;

  return (
    <div className="px-4 py-2.5 flex items-start justify-between hover:bg-gray-50">
      <div className="flex-1">
        <span className="text-xs text-gray-400 block mb-0.5">{slot.name ?? slot.slotId}</span>
        <span className="text-sm font-medium text-gray-900">{preferredName ?? '—'}</span>
        {alternates.length > 0 && (
          <span className="ml-2 text-xs text-amber-600">
            or {alternates.map((o) => (o.type === 'recipe' ? o.filling.name : o.ingredient.name)).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
}

function StepsSection({
  procedures
}: {
  readonly procedures: LibraryRuntime.IConfectionBase['procedures'];
}): React.ReactElement | null {
  if (!procedures) return null;

  const preferred = procedures.options.find((p) => p.id === procedures.preferredId) ?? procedures.options[0];
  if (!preferred) return null;

  const stepsResult = preferred.procedure.getSteps();
  const steps = stepsResult.isSuccess() ? stepsResult.value : [];
  if (steps.length === 0) return null;

  return (
    <PreviewSection title="Instructions">
      {procedures.options.length > 1 && (
        <p className="text-xs text-gray-500 mb-2">{preferred.procedure.name}</p>
      )}
      <div className="space-y-3">
        {steps.map((step) => {
          const timingText = formatResolvedStepTiming(step);
          const mergedParams: Record<string, string> = {};
          if (step.resolvedTask.defaults) {
            for (const [key, value] of Object.entries(step.resolvedTask.defaults)) {
              mergedParams[key] = String(value);
            }
          }
          for (const [key, value] of Object.entries(step.params)) {
            mergedParams[key] = String(value);
          }
          const rendered = renderPreview(step.resolvedTask.template, mergedParams);

          return (
            <div key={step.order} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-choco-primary/10 text-choco-primary font-bold text-sm flex items-center justify-center">
                  {step.order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{rendered}</div>
                  {timingText && (
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-gray-400"></span>
                      {timingText}
                    </div>
                  )}
                  {step.notes && step.notes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {step.notes.map((note, noteIndex) => (
                        <div key={noteIndex} className="text-xs text-gray-600">
                          <span className="font-semibold text-gray-500">[{note.category}]</span> {note.note}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PreviewSection>
  );
}

function MoldedBonBonSection({
  variation
}: {
  readonly variation: LibraryRuntime.IMoldedBonBonRecipeVariation;
}): React.ReactElement {
  const preferredMold = variation.preferredMold;
  const shellChoc = variation.shellChocolate;
  const additionalChocs = variation.additionalChocolates ?? [];

  return (
    <>
      {preferredMold && (
        <PreviewSection title="Mold">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <MetaRow label="Model" value={preferredMold.mold.displayName} />
            {preferredMold.mold.format && <MetaRow label="Format" value={preferredMold.mold.format} />}
          </div>
        </PreviewSection>
      )}
      <PreviewSection title="Shell Chocolate">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <MetaRow label="Preferred" value={shellChoc.chocolate.name} />
          {shellChoc.alternates.length > 0 && (
            <MetaRow label="Alternates" value={shellChoc.alternates.map((a) => a.name).join(', ')} />
          )}
        </div>
      </PreviewSection>
      {additionalChocs.map((ac, i) => (
        <PreviewSection
          key={i}
          title={`${ac.purpose.charAt(0).toUpperCase() + ac.purpose.slice(1)} Chocolate`}
        >
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <MetaRow label="Preferred" value={ac.chocolate.chocolate.name} />
          </div>
        </PreviewSection>
      ))}
    </>
  );
}

function BarTruffleSection({
  variation
}: {
  readonly variation: LibraryRuntime.IBarTruffleRecipeVariation;
}): React.ReactElement {
  const fd = variation.frameDimensions;
  const bd = variation.singleBonBonDimensions;

  return (
    <>
      <PreviewSection title="Dimensions">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <MetaRow label="Frame" value={`${fd.width} × ${fd.height} × ${fd.depth}mm`} />
          <MetaRow label="BonBon" value={`${bd.width} × ${bd.height}mm`} />
        </div>
      </PreviewSection>
      {variation.enrobingChocolate && (
        <PreviewSection title="Enrobing Chocolate">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <MetaRow label="Preferred" value={variation.enrobingChocolate.chocolate.name} />
            {variation.enrobingChocolate.alternates.length > 0 && (
              <MetaRow
                label="Alternates"
                value={variation.enrobingChocolate.alternates.map((a) => a.name).join(', ')}
              />
            )}
          </div>
        </PreviewSection>
      )}
    </>
  );
}

function RolledTruffleSection({
  variation
}: {
  readonly variation: LibraryRuntime.IRolledTruffleRecipeVariation;
}): React.ReactElement {
  return (
    <>
      {variation.enrobingChocolate && (
        <PreviewSection title="Enrobing Chocolate">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            <MetaRow label="Preferred" value={variation.enrobingChocolate.chocolate.name} />
            {variation.enrobingChocolate.alternates.length > 0 && (
              <MetaRow
                label="Alternates"
                value={variation.enrobingChocolate.alternates.map((a) => a.name).join(', ')}
              />
            )}
          </div>
        </PreviewSection>
      )}
      {variation.coatings && (
        <PreviewSection title="Coatings">
          <div className="bg-white rounded-lg border border-gray-200 p-3">
            {variation.coatings.options.map((c) => (
              <MetaRow
                key={c.id}
                label={c.id === variation.coatings?.preferred?.id ? 'Preferred' : 'Alternate'}
                value={c.ingredient.name}
              />
            ))}
          </div>
        </PreviewSection>
      )}
    </>
  );
}

// ============================================================================
// ConfectionPreviewPanel Component
// ============================================================================

/**
 * Confection recipe preview panel - printed recipe sheet format.
 *
 * Displays the golden variation in a print-friendly layout including:
 * - Header with name, type badge, description
 * - Yield information
 * - Filling slots
 * - Subtype-specific sections (mold/chocolate for bonbons, dimensions for bars, coatings for truffles)
 * - Decorations
 * - Procedure steps (rendered)
 * - Ratings, tags, notes
 *
 * @public
 */
export function ConfectionPreviewPanel(props: IConfectionPreviewPanelProps): React.ReactElement {
  const { confection, draftEntity, onClose } = props;

  const entity = draftEntity ?? confection.entity;
  const goldenVariation = confection.goldenVariation;
  const goldenVariationEntity = entity.variations.find((v) => v.variationSpec === entity.goldenVariationSpec);

  const fillings = goldenVariation.fillings ?? [];
  const decorations = goldenVariation.decorations;
  const notes = goldenVariationEntity?.notes ?? [];
  const effectiveTags = confection.effectiveTags;
  const effectiveUrls = confection.effectiveUrls;

  return (
    <div className="p-4 overflow-y-auto h-full bg-gray-50">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{entity.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Confection Recipe</p>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-choco-primary/10 text-choco-primary">
              {entity.confectionType}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(): void => window.print()}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Print recipe"
          >
            <PrinterIcon className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Close preview"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {entity.description && (
        <div className="mb-6 p-3 bg-choco-primary/5 border-l-4 border-choco-primary/40 rounded-r">
          <p className="text-sm text-gray-700 italic">{entity.description}</p>
        </div>
      )}

      {/* Yield */}
      {goldenVariationEntity && (
        <div className="mb-6 flex items-center gap-6 bg-white rounded-lg border border-gray-200 px-4 py-3">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide block">Count</span>
            <span className="text-lg font-semibold text-gray-900">
              {goldenVariationEntity.yield.count}{' '}
              <span className="text-sm font-normal text-gray-500">
                {goldenVariationEntity.yield.unit ?? 'pieces'}
              </span>
            </span>
          </div>
          {goldenVariationEntity.yield.weightPerPiece !== undefined && (
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide block">Weight/piece</span>
              <span className="text-lg font-semibold text-gray-900">
                {goldenVariationEntity.yield.weightPerPiece}g
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filling Slots */}
      {fillings.length > 0 && (
        <PreviewSection title={`Fillings (${fillings.length} slot${fillings.length !== 1 ? 's' : ''})`}>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {fillings.map((slot) => (
              <FillingSlotSection key={slot.slotId} slot={slot} />
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Subtype-specific sections */}
      {goldenVariation.isMoldedBonBonVariation() && <MoldedBonBonSection variation={goldenVariation} />}
      {goldenVariation.isBarTruffleVariation() && <BarTruffleSection variation={goldenVariation} />}
      {goldenVariation.isRolledTruffleVariation() && <RolledTruffleSection variation={goldenVariation} />}

      {/* Decorations */}
      {decorations && decorations.options.length > 0 && (
        <PreviewSection title="Decorations">
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {decorations.options.map((d) => (
              <div key={d.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-900">{d.decoration.name}</span>
                {d.id === decorations.preferredId && (
                  <span className="text-xs text-amber-500">★ preferred</span>
                )}
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Procedure steps */}
      <StepsSection procedures={goldenVariation.procedures} />

      {/* Metadata */}
      <div className="space-y-4">
        {effectiveTags.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {effectiveTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {notes.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
            <div className="space-y-2">
              {notes.map((note, i) => (
                <div key={i} className="text-sm text-gray-700">
                  <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 mr-2">
                    {note.category}
                  </span>
                  {note.note}
                </div>
              ))}
            </div>
          </div>
        )}

        {effectiveUrls.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Links</h3>
            <div className="space-y-1">
              {effectiveUrls.map((u, i) => (
                <div key={i} className="text-sm">
                  <span className="text-xs text-gray-400 mr-1">[{u.category}]</span>
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-choco-primary hover:underline"
                  >
                    {u.url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
