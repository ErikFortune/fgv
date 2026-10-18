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
 * Renders the wire probe's report: one table per wire, the provider's own text for every
 * rejection, and a summary that names each unsafe and conservative row. Meant to be pasted
 * verbatim into a stream's `result.md`, so it states the negative cases rather than leaving them
 * as an absence.
 *
 * @packageDocumentation
 */

import type {
  AdaptedObservation,
  EndToEndOutcome,
  IWireProbeRow,
  IWireProbeWireResult,
  ProviderObservation,
  RowOutcome
} from './probe';

const COLUMNS: ReadonlyArray<number> = [28, 8, 10, 14];

function columns(cells: ReadonlyArray<string>): string {
  return cells
    .map((cell, i) => (i < COLUMNS.length ? cell.padEnd(COLUMNS[i]) : cell))
    .join('')
    .trimEnd();
}

function rawText(raw: ProviderObservation): string {
  return raw.kind === 'accepted' ? 'accepted' : raw.kind === 'rejected' ? 'rejected' : '?';
}

function adaptedText(adapted: AdaptedObservation, endToEnd: EndToEndOutcome): string {
  const what =
    adapted.kind === 'accepted'
      ? 'accepted'
      : adapted.kind === 'refused-locally'
      ? 'refused here'
      : adapted.kind === 'rejected'
      ? 'rejected'
      : '?';
  return endToEnd === 'ok' ? what : `${what} (${endToEnd.toUpperCase()})`;
}

function detailOf(observation: ProviderObservation | AdaptedObservation): string | undefined {
  return observation.kind === 'accepted' ? undefined : observation.detail;
}

function wireSection(result: IWireProbeWireResult): string[] {
  const heading = `--- ${result.wire.label} · ${result.wire.providerId} · ${
    result.model ?? result.wire.model
  } ---`;
  if (result.skipped !== undefined) {
    return [heading, `  SKIPPED: ${result.skipped}`, ''];
  }
  const lines: string[] = [heading];
  if (result.controlFailure !== undefined) {
    lines.push(`  INCONCLUSIVE: the control fixture was not accepted — ${result.controlFailure}`);
    lines.push('  No row on this wire is classified. Check the key and the model, then re-run.');
    lines.push('');
    return lines;
  }
  lines.push(`  ${columns(['fixture', 'ours', 'provider', 'outcome', 'end to end'])}`);
  for (const row of result.rows) {
    lines.push(
      `  ${columns([
        row.fixtureId,
        row.ours,
        rawText(row.raw),
        row.outcome,
        adaptedText(row.adapted, row.endToEnd)
      ])}`
    );
  }
  const notes = result.rows.flatMap((row) => {
    const out: string[] = [];
    const raw = detailOf(row.raw);
    if (raw !== undefined) {
      out.push(`  ${row.fixtureId} (raw): ${raw}`);
    }
    const adapted = row.endToEnd === 'ok' ? undefined : detailOf(row.adapted);
    if (adapted !== undefined) {
      out.push(`  ${row.fixtureId} (end to end): ${adapted}`);
    }
    return out;
  });
  if (notes.length > 0) {
    lines.push('  provider text:');
    lines.push(...notes.map((n) => `  ${n}`));
  }
  lines.push('');
  return lines;
}

function count(rows: ReadonlyArray<IWireProbeRow>, outcome: RowOutcome): number {
  return rows.filter((r) => r.outcome === outcome).length;
}

function named(results: ReadonlyArray<IWireProbeWireResult>, keep: (row: IWireProbeRow) => boolean): string {
  const ids = results.flatMap((r) => r.rows.filter(keep).map((row) => `${r.wire.id}/${row.fixtureId}`));
  return ids.length === 0 ? 'none' : ids.join(', ');
}

/**
 * Renders the report.
 * @public
 */
export function formatWireProbeReport(results: ReadonlyArray<IWireProbeWireResult>): string {
  const probed = results.filter((r) => r.skipped === undefined);
  const rows = probed.flatMap((r) => r.rows);
  const lines: string[] = [
    "=== wire probe: what each provider accepts vs ai-assist's keyword tables ===",
    `wires probed: ${probed.length} · skipped: ${results.length - probed.length}`,
    'ours: pass = sent as written · adapt = folded, translated or dropped · refuse = not sent',
    'outcome: conservative = we adapt or refuse, the provider accepted the raw schema;',
    '         unsafe = we pass, the provider rejected it',
    ''
  ];
  for (const result of results) {
    lines.push(...wireSection(result));
  }
  lines.push('=== summary ===');
  lines.push(
    `agrees ${count(rows, 'agrees')} · conservative ${count(rows, 'conservative')} · ` +
      `unsafe ${count(rows, 'unsafe')} · inconclusive ${count(rows, 'inconclusive')}`
  );
  lines.push(`UNSAFE (raw): ${named(probed, (row) => row.outcome === 'unsafe')}`);
  lines.push(`UNSAFE (end to end): ${named(probed, (row) => row.endToEnd === 'unsafe')}`);
  lines.push(`end-to-end mismatches: ${named(probed, (row) => row.endToEnd === 'mismatch')}`);
  lines.push(
    `conservative (a table entry that could be loosened): ${named(
      probed,
      (row) => row.outcome === 'conservative'
    )}`
  );
  return lines.join('\n');
}
