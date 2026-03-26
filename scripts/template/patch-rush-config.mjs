#!/usr/bin/env node
/**
 * patch-rush-config.mjs - Apply targeted edits to JSONC config files
 *
 * Uses jsonc-parser to modify JSON-with-comments files while preserving
 * all comments and formatting.
 *
 * Usage:
 *   node patch-rush-config.mjs <file> <operations...>
 *
 * Operations:
 *   --set <path>=<value>         Set a value at a JSON path (dot-separated)
 *   --set-json <path>=<json>     Set a value using raw JSON (for objects/arrays)
 *   --uncomment <path>           Uncomment a commented-out property
 *   --add-to-array <path>=<json> Append a value to an array
 *   --remove <path>              Remove a property
 *
 * Examples:
 *   node patch-rush-config.mjs rush.json \
 *     --set 'ensureConsistentVersions=true' \
 *     --set 'repository.url=https://github.com/ErikFortune/chocolate-lab' \
 *     --uncomment 'projectFolderMinDepth' \
 *     --set 'projectFolderMinDepth=2'
 *
 *   node patch-rush-config.mjs rush.json \
 *     --add-to-array 'projects={"packageName":"@fgv/my-lib","projectFolder":"libraries/my-lib"}'
 */

import { readFileSync, writeFileSync } from 'fs';
import { modify, applyEdits, parse } from 'jsonc-parser';

const FORMATTING_OPTIONS = {
  tabSize: 2,
  insertSpaces: true,
  eol: '\n'
};

/**
 * Parse a dot-separated path into a JSON path array.
 * Numeric segments are treated as array indices.
 */
function parsePath(pathStr) {
  return pathStr.split('.').map((seg) => {
    const num = Number(seg);
    return Number.isInteger(num) && num >= 0 ? num : seg;
  });
}

/**
 * Parse a value string into a JS value.
 * Handles: true, false, null, numbers, and strings (quoted or unquoted).
 */
function parseValue(valueStr) {
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

/**
 * Uncomment a commented-out JSON property in a JSONC string.
 *
 * Handles patterns like:
 *   // "propertyName": value,
 *   // "propertyName": value
 *
 * Returns the modified string with the property uncommented.
 */
function uncommentProperty(source, propertyName) {
  // Match commented-out property with optional leading whitespace
  // Handles both // and /* */ style single-line comments
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

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Apply a single operation to a JSONC source string.
 */
function applyOperation(source, op) {
  switch (op.type) {
    case 'set': {
      const path = parsePath(op.path);
      const edits = modify(source, path, op.value, { formattingOptions: FORMATTING_OPTIONS });
      return applyEdits(source, edits);
    }
    case 'set-json': {
      const path = parsePath(op.path);
      const value = JSON.parse(op.value);
      const edits = modify(source, path, value, { formattingOptions: FORMATTING_OPTIONS });
      return applyEdits(source, edits);
    }
    case 'uncomment': {
      // Use the leaf property name for the regex search, since nested
      // properties like "repository.defaultBranch" appear as just
      // "defaultBranch" in the file (inside their parent object).
      const leafName = op.path.split('.').pop();
      return uncommentProperty(source, leafName);
    }
    case 'add-to-array': {
      const path = parsePath(op.path);
      const value = JSON.parse(op.value);
      // Use -1 as array index to append
      const edits = modify(source, [...path, -1], value, {
        formattingOptions: FORMATTING_OPTIONS,
        isArrayInsertion: true
      });
      return applyEdits(source, edits);
    }
    case 'remove': {
      const path = parsePath(op.path);
      const edits = modify(source, path, undefined, { formattingOptions: FORMATTING_OPTIONS });
      return applyEdits(source, edits);
    }
    default:
      throw new Error(`Unknown operation type: ${op.type}`);
  }
}

/**
 * Parse command-line arguments into operations.
 */
function parseArgs(args) {
  const operations = [];
  let filePath = null;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (!arg.startsWith('--')) {
      if (filePath === null) {
        filePath = arg;
      } else {
        throw new Error(`Unexpected positional argument: ${arg}`);
      }
      i++;
      continue;
    }

    const opType = arg.slice(2); // strip --
    if (!['set', 'set-json', 'uncomment', 'add-to-array', 'remove'].includes(opType)) {
      throw new Error(`Unknown operation: ${arg}`);
    }

    i++;
    if (i >= args.length) {
      throw new Error(`Missing value for ${arg}`);
    }

    const operand = args[i];
    i++;

    if (opType === 'uncomment' || opType === 'remove') {
      operations.push({ type: opType, path: operand });
    } else {
      const eqIndex = operand.indexOf('=');
      if (eqIndex === -1) {
        throw new Error(`Expected path=value for ${arg}, got: ${operand}`);
      }
      const path = operand.slice(0, eqIndex);
      const rawValue = operand.slice(eqIndex + 1);

      if (opType === 'set') {
        operations.push({ type: opType, path, value: parseValue(rawValue) });
      } else {
        // set-json and add-to-array pass raw JSON
        operations.push({ type: opType, path, value: rawValue });
      }
    }
  }

  if (!filePath) {
    throw new Error('No file path specified');
  }

  return { filePath, operations };
}

function usage() {
  console.error(`Usage: node patch-rush-config.mjs <file> <operations...>

Operations:
  --set <path>=<value>         Set a value at a JSON path
  --set-json <path>=<json>     Set a value using raw JSON
  --uncomment <path>           Uncomment a commented-out property
  --add-to-array <path>=<json> Append to an array
  --remove <path>              Remove a property

Examples:
  node patch-rush-config.mjs rush.json --set 'ensureConsistentVersions=true'
  node patch-rush-config.mjs rush.json --uncomment projectFolderMinDepth --set 'projectFolderMinDepth=2'
  node patch-rush-config.mjs rush.json --add-to-array 'projects={"packageName":"@fgv/my-lib"}'`);
  process.exit(1);
}

// Main
const cliArgs = process.argv.slice(2);
if (cliArgs.length === 0 || cliArgs.includes('--help') || cliArgs.includes('-h')) {
  usage();
}

try {
  const { filePath, operations } = parseArgs(cliArgs);

  console.log(`Patching: ${filePath}`);
  let source = readFileSync(filePath, 'utf-8');

  for (const op of operations) {
    const desc =
      op.type === 'uncomment' || op.type === 'remove'
        ? `  ${op.type}: ${op.path}`
        : `  ${op.type}: ${op.path} = ${op.value}`;
    console.log(desc);
    source = applyOperation(source, op);
  }

  writeFileSync(filePath, source);
  console.log(`  Done: ${operations.length} operation(s) applied`);
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
}
