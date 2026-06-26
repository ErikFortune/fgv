/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { Converters } from '@fgv/ts-utils';
import {
  BodyConverterRegistry,
  edgeConverter,
  envelopeConverter,
  envelopeYamlConverter,
  joinFrontmatter,
  parseMemoryFile,
  provenanceConverter,
  serializeMemoryFile,
  splitFrontmatter,
  temporalConverter
} from '../../../packlets/converters';
import { IMemoryEnvelope, Kind } from '../../../packlets/types';

const validEnvelopeObject: Record<string, unknown> = {
  id: 'intro-to-rust',
  entityId: 'intro-to-rust',
  kind: 'knowledge',
  tags: ['rust', 'systems'],
  links: [{ type: 'related', target: 'ownership' }],
  created: 1000,
  updated: 2000,
  seq: 5,
  contentHash: 'crc-abc',
  provenance: { source: 'agent', by: 'curator' }
};

describe('provenanceConverter', () => {
  test('validates the known fields', () => {
    expect(
      provenanceConverter.convert({ source: 'human', by: 'erik', model: 'gpt', confidence: 0.9 })
    ).toSucceedWith({ source: 'human', by: 'erik', model: 'gpt', confidence: 0.9 });
  });

  test('preserves opaque extension keys verbatim', () => {
    expect(
      provenanceConverter.convert({ source: 'agent', sentiment: { score: 0.5 }, epistemic: 'belief' })
    ).toSucceedAndSatisfy((p) => {
      expect(p.source).toBe('agent');
      expect(p.sentiment).toEqual({ score: 0.5 });
      expect(p.epistemic).toBe('belief');
    });
  });

  test('accepts an arbitrary source string (open vocabulary)', () => {
    expect(provenanceConverter.convert({ source: 'host-ingest' })).toSucceedWith({ source: 'host-ingest' });
  });

  test('fails when source is missing', () => {
    expect(provenanceConverter.convert({ by: 'erik' })).toFail();
  });

  test('fails on a non-object', () => {
    expect(provenanceConverter.convert('nope')).toFail();
  });
});

describe('edgeConverter', () => {
  test('validates a full attributed edge', () => {
    expect(
      edgeConverter.convert({
        type: 'mtm-ref',
        target: 'turn-3',
        confidence: 0.8,
        provenance: { source: 'agent' },
        valid_at: 100,
        invalid_at: 200
      })
    ).toSucceedAndSatisfy((edge) => {
      expect(edge.type).toBe('mtm-ref');
      expect(edge.target).toBe('turn-3');
      expect(edge.confidence).toBe(0.8);
      expect(edge.provenance).toEqual({ source: 'agent' });
      expect(edge.valid_at).toBe(100);
      expect(edge.invalid_at).toBe(200);
    });
  });

  test('validates a minimal edge', () => {
    expect(edgeConverter.convert({ type: 'related', target: 'ownership' })).toSucceedAndSatisfy((edge) => {
      expect(edge.type).toBe('related');
      expect(edge.target).toBe('ownership');
      expect(edge.confidence).toBeUndefined();
    });
  });

  test('accepts a null invalid_at (still valid)', () => {
    expect(edgeConverter.convert({ type: 'related', target: 'x', invalid_at: null })).toSucceedAndSatisfy(
      (edge) => {
        expect(edge.invalid_at).toBeNull();
      }
    );
  });

  test('fails when invalid_at is neither a number nor null', () => {
    expect(edgeConverter.convert({ type: 'related', target: 'x', invalid_at: 'soon' })).toFail();
  });

  test('fails when target is missing', () => {
    expect(edgeConverter.convert({ type: 'related' })).toFail();
  });
});

describe('temporalConverter', () => {
  test('validates a temporal block', () => {
    expect(temporalConverter.convert({ valid_at: 1, invalid_at: null })).toSucceedWith({
      valid_at: 1,
      invalid_at: null
    });
  });

  test('validates an empty temporal block', () => {
    expect(temporalConverter.convert({})).toSucceedWith({});
  });
});

describe('envelopeConverter', () => {
  test('validates a full envelope without optional blocks', () => {
    expect(envelopeConverter.convert(validEnvelopeObject)).toSucceedAndSatisfy((envelope) => {
      expect(envelope.id).toBe('intro-to-rust');
      expect(envelope.tags).toEqual(['rust', 'systems']);
      expect(envelope.links).toHaveLength(1);
      expect(envelope.temporal).toBeUndefined();
      expect(envelope.embeddingRef).toBeUndefined();
    });
  });

  test('validates a temporal envelope with a string embeddingRef', () => {
    expect(
      envelopeConverter.convert({
        ...validEnvelopeObject,
        temporal: { valid_at: 10 },
        embeddingRef: 'vec-1'
      })
    ).toSucceedAndSatisfy((envelope) => {
      expect(envelope.temporal).toEqual({ valid_at: 10 });
      expect(envelope.embeddingRef).toBe('vec-1');
    });
  });

  test('accepts a null embeddingRef (not embedded)', () => {
    expect(envelopeConverter.convert({ ...validEnvelopeObject, embeddingRef: null })).toSucceedAndSatisfy(
      (envelope) => {
        expect(envelope.embeddingRef).toBeNull();
      }
    );
  });

  test('fails when embeddingRef is neither a string nor null', () => {
    expect(envelopeConverter.convert({ ...validEnvelopeObject, embeddingRef: 42 })).toFail();
  });

  test('fails when a required field is missing', () => {
    const missing: Record<string, unknown> = { ...validEnvelopeObject };
    delete missing.contentHash;
    expect(envelopeConverter.convert(missing)).toFail();
  });
});

describe('envelopeYamlConverter', () => {
  test('parses an envelope from a YAML string', () => {
    const yaml = serializeMemoryFile(
      envelopeConverter.convert(validEnvelopeObject).orThrow(),
      'body text'
    ).orThrow();
    const frontmatter = splitFrontmatter(yaml).orThrow().frontmatter;
    expect(envelopeYamlConverter.convert(frontmatter)).toSucceedAndSatisfy((envelope) => {
      expect(envelope.id).toBe('intro-to-rust');
    });
  });

  test('fails on a YAML string that is not an object', () => {
    expect(envelopeYamlConverter.convert('just a scalar')).toFail();
  });
});

describe('splitFrontmatter / joinFrontmatter', () => {
  test('splits a well-formed memory file', () => {
    const raw = '---\nid: x\nkind: knowledge\n---\nThe body.\nSecond line.';
    expect(splitFrontmatter(raw)).toSucceedWith({
      frontmatter: 'id: x\nkind: knowledge',
      body: 'The body.\nSecond line.'
    });
  });

  test('strips trailing CR so CRLF-authored files parse identically to LF', () => {
    const raw = '---\r\nid: x\r\nkind: knowledge\r\n---\r\nThe body.\r\nSecond line.';
    expect(splitFrontmatter(raw)).toSucceedWith({
      frontmatter: 'id: x\nkind: knowledge',
      body: 'The body.\nSecond line.'
    });
  });

  test('fails when the opening delimiter is missing', () => {
    expect(splitFrontmatter('no frontmatter here')).toFailWith(/missing opening frontmatter delimiter/i);
  });

  test('fails when the closing delimiter is missing', () => {
    expect(splitFrontmatter('---\nid: x\nstill going')).toFailWith(/missing closing frontmatter delimiter/i);
  });

  test('join adds a trailing newline to the frontmatter when absent', () => {
    expect(joinFrontmatter('id: x', 'body')).toBe('---\nid: x\n---\nbody');
  });

  test('join does not double the trailing newline when present', () => {
    expect(joinFrontmatter('id: x\n', 'body')).toBe('---\nid: x\n---\nbody');
  });

  test('split and join round-trip', () => {
    const raw = '---\nid: x\n---\nbody content';
    const parts = splitFrontmatter(raw).orThrow();
    expect(joinFrontmatter(parts.frontmatter, parts.body)).toBe(raw);
  });
});

describe('parseMemoryFile / serializeMemoryFile', () => {
  let registry: BodyConverterRegistry;
  const knowledgeKind: Kind = 'knowledge' as Kind;

  beforeEach(() => {
    registry = BodyConverterRegistry.create().orThrow();
    registry.register(knowledgeKind, Converters.string);
  });

  test('serializes then parses a record round-trip', () => {
    const envelope = envelopeConverter.convert(validEnvelopeObject).orThrow();
    const file = serializeMemoryFile(envelope, 'The knowledge body.').orThrow();
    expect(parseMemoryFile(file, registry)).toSucceedAndSatisfy((record) => {
      expect(record.envelope.id).toBe('intro-to-rust');
      expect(record.body).toBe('The knowledge body.');
    });
  });

  test('fails when the frontmatter cannot be split', () => {
    expect(parseMemoryFile('no delimiters', registry)).toFailWith(/missing opening frontmatter delimiter/i);
  });

  test('fails with envelope context when the envelope is invalid', () => {
    const file = '---\nid: x\n---\nbody';
    expect(parseMemoryFile(file, registry)).toFailWith(/invalid envelope/i);
  });

  test('fails with body context when the body fails the registered converter', () => {
    const envelope = envelopeConverter.convert({ ...validEnvelopeObject, kind: 'unregistered' }).orThrow();
    const file = serializeMemoryFile(envelope, 'body').orThrow();
    expect(parseMemoryFile(file, registry)).toFailWith(/invalid body.*no converter registered/i);
  });

  test('serialize fails (with id context) when the envelope cannot be dumped to YAML', () => {
    const unserializable = { ...validEnvelopeObject, weird: BigInt(10) } as unknown as IMemoryEnvelope;
    expect(serializeMemoryFile(unserializable, 'body')).toFailWith(/failed to serialize envelope/i);
  });
});
