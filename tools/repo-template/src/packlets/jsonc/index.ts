/**
 * JSONC patching operations using jsonc-parser.
 * Modifies JSON-with-comments files while preserving all comments and formatting.
 */

import { modify, applyEdits, FormattingOptions } from 'jsonc-parser';

const FORMATTING_OPTIONS: FormattingOptions = {
  tabSize: 2,
  insertSpaces: true,
  eol: '\n'
};

export type PatchOperationType = 'set' | 'set-json' | 'uncomment' | 'add-to-array' | 'remove';

export interface IPatchOperation {
  type: PatchOperationType;
  path: string;
  value?: unknown;
}

/**
 * Parse a dot-separated path into a JSON path array.
 * Numeric segments are treated as array indices.
 */
function parsePath(pathStr: string): (string | number)[] {
  return pathStr.split('.').map((seg) => {
    const num = Number(seg);
    return Number.isInteger(num) && num >= 0 ? num : seg;
  });
}

/**
 * Parse a value string into a JS value.
 */
export function parseValue(valueStr: string): unknown {
  if (valueStr === 'true') return true;
  if (valueStr === 'false') return false;
  if (valueStr === 'null') return null;
  const num = Number(valueStr);
  if (!isNaN(num) && valueStr.trim() !== '') return num;
  // Strip surrounding quotes if present
  if (
    (valueStr.startsWith('"') && valueStr.endsWith('"')) ||
    (valueStr.startsWith("'") && valueStr.endsWith("'"))
  ) {
    return valueStr.slice(1, -1);
  }
  return valueStr;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Uncomment a commented-out JSON property in a JSONC string.
 * Handles `// "propertyName": value` patterns.
 */
function uncommentProperty(source: string, propertyName: string): string {
  /* eslint-disable-next-line @rushstack/security/no-unsafe-regexp */
  const pattern = new RegExp(`^(\\s*)\\/\\/\\s*("${escapeRegExp(propertyName)}"\\s*:.*)$`, 'm');

  const match = source.match(pattern);
  if (!match) {
    console.warn(`  Warning: Could not find commented-out property "${propertyName}" to uncomment`);
    return source;
  }

  const indent = match[1];
  const content = match[2];
  return source.replace(match[0], `${indent}${content}`);
}

/**
 * Apply a single patch operation to a JSONC source string.
 */
export function applyOperation(source: string, op: IPatchOperation): string {
  switch (op.type) {
    case 'set': {
      const jsonPath = parsePath(op.path);
      const edits = modify(source, jsonPath, op.value, { formattingOptions: FORMATTING_OPTIONS });
      return applyEdits(source, edits);
    }
    case 'set-json': {
      const jsonPath = parsePath(op.path);
      const value = JSON.parse(op.value as string);
      const edits = modify(source, jsonPath, value, { formattingOptions: FORMATTING_OPTIONS });
      return applyEdits(source, edits);
    }
    case 'uncomment': {
      // Use the leaf property name for the regex, since nested properties
      // appear as just their leaf name in the file.
      const leafName = op.path.split('.').pop()!;
      return uncommentProperty(source, leafName);
    }
    case 'add-to-array': {
      const jsonPath = parsePath(op.path);
      const value = JSON.parse(op.value as string);
      const edits = modify(source, [...jsonPath, -1], value, {
        formattingOptions: FORMATTING_OPTIONS,
        isArrayInsertion: true
      });
      return applyEdits(source, edits);
    }
    case 'remove': {
      const jsonPath = parsePath(op.path);
      const edits = modify(source, jsonPath, undefined, { formattingOptions: FORMATTING_OPTIONS });
      return applyEdits(source, edits);
    }
    default:
      throw new Error(`Unknown operation type: ${(op as IPatchOperation).type}`);
  }
}

/**
 * Apply a sequence of patch operations to a JSONC source string.
 */
export function applyOperations(source: string, operations: IPatchOperation[]): string {
  let result = source;
  for (const op of operations) {
    result = applyOperation(result, op);
  }
  return result;
}

/**
 * Read a JSONC file, apply patch operations, and write it back.
 */
export function patchFile(filePath: string, operations: IPatchOperation[]): void {
  const fs = require('fs');
  let source = fs.readFileSync(filePath, 'utf-8');
  source = applyOperations(source, operations);
  fs.writeFileSync(filePath, source);
}
