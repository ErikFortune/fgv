/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { Yaml } from '@fgv/ts-extras';
import {
  Convert,
  IEdge,
  IEdgeTarget,
  IMemoryEnvelope,
  IMemoryRecord,
  IProvenance,
  ITemporalBlock
} from '../types';
import { IBodyConverterRegistry } from './bodyConverterRegistry';

/** Matches exactly the JSON `null` literal. */
// eslint-disable-next-line @rushstack/no-new-null -- the envelope nullable fields (invalid_at, embeddingRef) carry meaningful null; design-lock §2.3-2.5
const nullConverter: Converter<null> = Converters.generic<null>((from: unknown) =>
  from === null ? succeed(null) : fail('expected null')
);

/** A nullable epoch-ms value (`number | null`). */
// eslint-disable-next-line @rushstack/no-new-null -- meaningful null for IEdge/ITemporalBlock.invalid_at; design-lock §2.3-2.4
const numberOrNull: Converter<number | null> = Converters.oneOf<number | null>([
  Converters.number,
  nullConverter
]);

/** A nullable string value (`string | null`). */
// eslint-disable-next-line @rushstack/no-new-null -- meaningful null for IMemoryEnvelope.embeddingRef; design-lock §2.5
const stringOrNull: Converter<string | null> = Converters.oneOf<string | null>([
  Converters.string,
  nullConverter
]);

/**
 * Converter for the known {@link IProvenance} fields. The full
 * {@link provenanceConverter} layers extension-key preservation on top.
 */
const knownProvenanceConverter: Converter<IProvenance> = Converters.object<IProvenance>(
  {
    source: Converters.string,
    by: Converters.string.optional(),
    model: Converters.string.optional(),
    confidence: Converters.number.optional(),
    derivedFrom: Convert.memoryId.optional()
  },
  { optionalFields: ['by', 'model', 'confidence', 'derivedFrom'] }
);

/**
 * Converter for {@link IProvenance}. Validates the known fields and preserves
 * any extension keys verbatim (the `[key: string]: unknown` opaque payload),
 * so a round-trip never drops consumer-attached data.
 * @public
 */
export const provenanceConverter: Converter<IProvenance> = Converters.generic<IProvenance>(
  (from: unknown): Result<IProvenance> =>
    knownProvenanceConverter.convert(from).onSuccess((known) => {
      // `from` is guaranteed to be a non-null object here — the known-field
      // converter only succeeds on objects. Spread the original keys first,
      // then the validated/normalized known fields on top, so extension keys
      // survive while the known fields carry their converted values.
      const merged: IProvenance = { ...(from as Record<string, unknown>), ...known };
      return succeed(merged);
    })
);

/**
 * Converter for a scope-qualified {@link IEdgeTarget}. Both `scope` and `id`
 * are required — the whole point of the scoped target is that a bare id is
 * ambiguous across scopes.
 * @public
 */
export const edgeTargetConverter: Converter<IEdgeTarget> = Converters.object<IEdgeTarget>({
  scope: Convert.scopeKey,
  id: Convert.memoryId
});

/**
 * Converter for an attributed {@link IEdge}.
 * @public
 */
export const edgeConverter: Converter<IEdge> = Converters.object<IEdge>(
  {
    type: Convert.linkType,
    target: edgeTargetConverter,
    confidence: Converters.number.optional(),
    provenance: provenanceConverter.optional(),
    valid_at: Converters.number.optional(),
    invalid_at: numberOrNull.optional()
  },
  { optionalFields: ['confidence', 'provenance', 'valid_at', 'invalid_at'] }
);

/**
 * Converter for the optional {@link ITemporalBlock}.
 * @public
 */
export const temporalConverter: Converter<ITemporalBlock> = Converters.object<ITemporalBlock>(
  {
    valid_at: Converters.number.optional(),
    invalid_at: numberOrNull.optional()
  },
  { optionalFields: ['valid_at', 'invalid_at'] }
);

/**
 * Converter for the invariant {@link IMemoryEnvelope}. Validates a plain
 * object (e.g. parsed YAML frontmatter) into a typed envelope.
 * @public
 */
export const envelopeConverter: Converter<IMemoryEnvelope> = Converters.object<IMemoryEnvelope>(
  {
    id: Convert.memoryId,
    entityId: Convert.entityId,
    kind: Convert.kind,
    tags: Converters.arrayOf(Convert.tag),
    links: Converters.arrayOf(edgeConverter),
    created: Converters.number,
    updated: Converters.number,
    seq: Converters.number,
    contentHash: Converters.string,
    rank: Converters.number.optional(),
    provenance: provenanceConverter,
    temporal: temporalConverter.optional(),
    embeddingRef: stringOrNull.optional()
  },
  { optionalFields: ['rank', 'temporal', 'embeddingRef'] }
);

/**
 * Converter that parses a YAML frontmatter string into an
 * {@link IMemoryEnvelope}.
 * @public
 */
export const envelopeYamlConverter: Converter<IMemoryEnvelope> = Yaml.yamlConverter(envelopeConverter);

/** The frontmatter delimiter line. */
const FRONTMATTER_DELIMITER: string = '---';

/**
 * The two parts of a memory file: the YAML frontmatter (between the `---`
 * delimiters) and the markdown body (everything after the closing delimiter).
 * @public
 */
export interface IMemoryFileParts {
  /** The raw YAML frontmatter (delimiters stripped). */
  readonly frontmatter: string;
  /** The raw body text following the closing delimiter. */
  readonly body: string;
}

/**
 * Split a `---\n<yaml>\n---\n<body>` memory file into its frontmatter and
 * body parts. Pure string handling — no external dependency.
 * @public
 */
export function splitFrontmatter(raw: string): Result<IMemoryFileParts> {
  // Split on '\n' and strip a trailing '\r' per line so CRLF-authored files
  // parse identically to LF — otherwise the '\r' would ride along into the
  // returned frontmatter (perturbing YAML parsing) and body (corrupting
  // round-trip fidelity).
  const lines: string[] = raw.split('\n').map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line));
  if (lines[0].trim() !== FRONTMATTER_DELIMITER) {
    return fail("memory file: missing opening frontmatter delimiter '---'");
  }
  let closeIndex: number = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      closeIndex = i;
      break;
    }
  }
  if (closeIndex === -1) {
    return fail("memory file: missing closing frontmatter delimiter '---'");
  }
  return succeed({
    frontmatter: lines.slice(1, closeIndex).join('\n'),
    body: lines.slice(closeIndex + 1).join('\n')
  });
}

/**
 * Join a YAML frontmatter string and a body into the canonical
 * `---\n<yaml>\n---\n<body>` memory-file format.
 * @public
 */
export function joinFrontmatter(frontmatter: string, body: string): string {
  const normalized: string = frontmatter.endsWith('\n') ? frontmatter : `${frontmatter}\n`;
  return `${FRONTMATTER_DELIMITER}\n${normalized}${FRONTMATTER_DELIMITER}\n${body}`;
}

/**
 * Parse a complete memory file into a typed {@link IMemoryRecord}. Splits the
 * frontmatter, validates the envelope, and dispatches the body through the
 * registered Converter for the envelope's kind.
 * @public
 */
export function parseMemoryFile(
  raw: string,
  registry: IBodyConverterRegistry
): Result<IMemoryRecord<unknown>> {
  return splitFrontmatter(raw).onSuccess((parts) =>
    envelopeYamlConverter
      .convert(parts.frontmatter)
      .withErrorFormat((msg) => `memory file: invalid envelope: ${msg}`)
      .onSuccess((envelope) =>
        registry
          .convert(envelope.kind, parts.body)
          .withErrorFormat((msg) => `memory file '${envelope.id}': invalid body: ${msg}`)
          .onSuccess((body) => succeed({ envelope, body }))
      )
  );
}

/**
 * Serialize an envelope and its rendered body text into a memory file. The
 * envelope is emitted as YAML frontmatter; the body is written verbatim after
 * the closing delimiter.
 * @public
 */
export function serializeMemoryFile(envelope: IMemoryEnvelope, body: string): Result<string> {
  return Yaml.yamlStringify(envelope)
    .withErrorFormat((msg) => `memory file '${envelope.id}': failed to serialize envelope: ${msg}`)
    .onSuccess((frontmatter) => succeed(joinFrontmatter(frontmatter, body)));
}
