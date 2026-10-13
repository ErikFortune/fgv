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
 * Converts the received content of an MCP `CallToolResult` — untrusted server data — into
 * {@link McpContentBlock}s and their text projection.
 * @packageDocumentation
 */

import {
  type Converter,
  type Result,
  Converters as UtilsConverters,
  captureResult,
  fail,
  succeed
} from '@fgv/ts-utils';
import { Converters, type JsonObject, type JsonValue, isJsonArray, isJsonObject } from '@fgv/ts-json-base';

import {
  type IMcpAudioBlock,
  type IMcpEmbeddedBlobResourceBlock,
  type IMcpEmbeddedTextResourceBlock,
  type IMcpImageBlock,
  type IMcpResourceLinkBlock,
  type IMcpTextBlock,
  type IMcpUnknownBlock,
  type McpContentBlock
} from './model';

// Every converter below is used only for its value: the failure messages of `@fgv/ts-utils`'
// converters quote the rejected value (and `field` serializes the whole object), so none of them is
// ever surfaced. A server string reaches this package's output only after passing `line`.

/**
 * One printable line: non-empty, with no control characters (`singleLine`) and no U+2028 / U+2029,
 * the Unicode line and paragraph separators, which `singleLine` admits (they are not `\p{Cc}`) but
 * which end a line for many readers.
 */
const line: Converter<string> = UtilsConverters.string
  .singleLine()
  .withConstraint((value) => !/[\u2028\u2029]/u.test(value));

/** A block's `type`, when it is echoed in a placeholder: one printable line, bounded. */
const blockTypeLine: Converter<string> = line.withConstraint((value) => value.length <= 64);

/** Any string: block text and descriptions are free text. */
const text: Converter<string> = UtilsConverters.string;

/** An object, read in place (an embedded resource's `resource`). */
const jsonObject: Converter<JsonObject> = UtilsConverters.isA('object', isJsonObject);

/** Base64 as MCP sends it: standard or URL-safe alphabet, optional padding, no whitespace. */
const base64: Converter<string> = UtilsConverters.string.matching(/^[A-Za-z0-9+/_-]*={0,2}$/);

/** The decoded size of a base64 string, or a failure when its length cannot be base64. */
function _byteLength(data: string): Result<number> {
  const unpadded = data.replace(/=+$/, '').length;
  return unpadded % 4 === 1 ? fail('not a base64 length') : succeed(Math.floor((unpadded * 3) / 4));
}

/** The named field of `raw` converted by `converter`; `undefined` when absent or invalid. */
function _maybe<T>(raw: unknown, name: string, converter: Converter<T>): T | undefined {
  return UtilsConverters.optionalField(name, converter).convert(raw).orDefault();
}

/** The named field of `raw` converted by `converter`. */
function _required<T>(raw: unknown, name: string, converter: Converter<T>): Result<T> {
  return UtilsConverters.field(name, converter).convert(raw);
}

/** `data`'s size, and `data` itself when the caller opted in. */
function _media(data: string, includeData: boolean): Result<{ byteLength: number; data?: string }> {
  return _byteLength(data).onSuccess((byteLength) =>
    succeed({ byteLength, ...(includeData ? { data } : {}) })
  );
}

function _textBlock(raw: unknown): Result<IMcpTextBlock> {
  return _required(raw, 'text', text).onSuccess((value) => succeed({ type: 'text', text: value }));
}

function _resourceLinkBlock(raw: unknown): Result<IMcpResourceLinkBlock> {
  return _required(raw, 'uri', line).onSuccess((uri) => {
    const name = _maybe(raw, 'name', line);
    const title = _maybe(raw, 'title', line);
    const mimeType = _maybe(raw, 'mimeType', line);
    const description = _maybe(raw, 'description', text);
    return succeed<IMcpResourceLinkBlock>({
      type: 'resource_link',
      uri,
      ...(name !== undefined ? { name } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(mimeType !== undefined ? { mimeType } : {}),
      ...(description !== undefined ? { description } : {})
    });
  });
}

function _resourceBlock(
  raw: unknown,
  includeData: boolean
): Result<IMcpEmbeddedTextResourceBlock | IMcpEmbeddedBlobResourceBlock> {
  return _required(raw, 'resource', jsonObject).onSuccess((resource) =>
    _required(resource, 'uri', line).onSuccess(
      (uri): Result<IMcpEmbeddedTextResourceBlock | IMcpEmbeddedBlobResourceBlock> => {
        const mimeType = _maybe(resource, 'mimeType', line);
        const head = { type: 'resource' as const, uri, ...(mimeType !== undefined ? { mimeType } : {}) };
        const embeddedText = _maybe(resource, 'text', text);
        if (embeddedText !== undefined) {
          return succeed<IMcpEmbeddedTextResourceBlock>({ ...head, text: embeddedText });
        }
        return _required(resource, 'blob', base64)
          .onSuccess((blob) => _media(blob, includeData))
          .onSuccess((media) => succeed<IMcpEmbeddedBlobResourceBlock>({ ...head, ...media }));
      }
    )
  );
}

function _mediaBlock<T extends 'image' | 'audio'>(
  raw: unknown,
  type: T,
  includeData: boolean
): Result<{ type: T; mimeType: string; byteLength: number; data?: string }> {
  return _required(raw, 'mimeType', line).onSuccess((mimeType) =>
    _required(raw, 'data', base64)
      .onSuccess((data) => _media(data, includeData))
      .onSuccess((media) => succeed({ type, mimeType, ...media }))
  );
}

/** The block for a known type, or a failure when the block is malformed. */
function _knownBlock(raw: unknown, type: string, includeData: boolean): Result<McpContentBlock> | undefined {
  switch (type) {
    case 'text':
      return _textBlock(raw);
    case 'resource_link':
      return _resourceLinkBlock(raw);
    case 'resource':
      return _resourceBlock(raw, includeData);
    case 'image':
      return _mediaBlock<IMcpImageBlock['type']>(raw, 'image', includeData);
    case 'audio':
      return _mediaBlock<IMcpAudioBlock['type']>(raw, 'audio', includeData);
    default:
      return undefined;
  }
}

/**
 * Converts one received content block. Total: an unknown type, a malformed block, or a value that
 * cannot even be inspected (a cycle or a throwing accessor, from a custom transport) is an
 * {@link IMcpUnknownBlock}, never a throw or a failure.
 * @internal
 */
export function toContentBlock(raw: unknown, includeData: boolean): McpContentBlock {
  const blockType = captureResult(() => _maybe(raw, 'type', blockTypeLine)).orDefault();
  const unknown: IMcpUnknownBlock = { type: 'unknown', ...(blockType !== undefined ? { blockType } : {}) };
  if (blockType === undefined) {
    return unknown;
  }
  // Captured separately, so a block whose type was read keeps it when its other fields cannot be.
  return captureResult(() => _knownBlock(raw, blockType, includeData)?.orDefault()).orDefault() ?? unknown;
}

/**
 * Converts a result's received `content`: absent is no blocks; anything other than an array is a
 * single {@link IMcpUnknownBlock}, so a malformed result is visible rather than empty.
 * @internal
 */
export function toContentBlocks(raw: unknown, includeData: boolean): ReadonlyArray<McpContentBlock> {
  if (raw === undefined) {
    return [];
  }
  return Array.isArray(raw) ? raw.map((block) => toContentBlock(block, includeData)) : [{ type: 'unknown' }];
}

/** The text projection of one block (see {@link IMcpToolCallResult}). */
function _projectBlock(block: McpContentBlock): string {
  switch (block.type) {
    case 'text':
      return block.text;
    case 'resource_link':
      return block.name !== undefined
        ? `[resource_link: ${block.uri} (${block.name})]`
        : `[resource_link: ${block.uri}]`;
    case 'resource':
      return 'text' in block ? block.text : '[resource block]';
    case 'image':
    case 'audio':
      return `[${block.type} block]`;
    case 'unknown':
      return `[${block.blockType ?? 'unknown'} block]`;
  }
}

/**
 * The text projection of a result's blocks, one per block, joined by newlines.
 * @internal
 */
export function projectContent(blocks: ReadonlyArray<McpContentBlock>): string {
  return blocks.map(_projectBlock).join('\n');
}

/** Whether a JSON-shaped value holds an own `__proto__` key at any depth. */
function _holdsReservedKey(value: unknown): boolean {
  if (isJsonArray(value)) {
    return value.some(_holdsReservedKey);
  }
  if (isJsonObject(value)) {
    return Object.entries(value).some(([key, child]) => key === '__proto__' || _holdsReservedKey(child));
  }
  return false;
}

/**
 * Converts a received value to JSON verbatim, refusing it whole when it holds an own `__proto__` key.
 *
 * @remarks
 * `@fgv/ts-json-base`'s `jsonValue` drops such a key silently and reports success (see
 * `docs/TECH_DEBT.md`), so a value that holds one would come back with data missing and nothing to
 * say so. Refusing keeps a returned value whole. Total: a value that cannot be walked (a cycle from a
 * custom transport, an accessor that throws) fails rather than throws. Every message is fixed
 * text, because the converter's own message can quote the value.
 * @internal
 */
export function receivedJson(value: unknown): Result<JsonValue> {
  return captureResult(
    (): Result<JsonValue> =>
      _holdsReservedKey(value)
        ? fail('holds a reserved "__proto__" key')
        : Converters.jsonValue.convert(value).withErrorFormat(() => 'is not JSON')
  )
    .withErrorFormat(() => 'could not be read')
    .onSuccess((converted) => converted);
}
