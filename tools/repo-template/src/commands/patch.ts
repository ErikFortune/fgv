/**
 * Patch command — apply targeted edits to JSONC config files.
 */

import * as fs from 'fs';
import { IPatchOperation, PatchOperationType, applyOperations, parseValue } from '../packlets/jsonc';

export interface IPatchOptions {
  file: string;
  operations: IPatchOperation[];
}

/**
 * Parse CLI arguments for the patch command into operations.
 * Expects pairs like: --set 'path=value', --uncomment 'path', etc.
 */
export function parsePatchArgs(args: string[]): IPatchOperation[] {
  const operations: IPatchOperation[] = [];
  const validOps: PatchOperationType[] = ['set', 'set-json', 'uncomment', 'add-to-array', 'remove'];

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const opType = arg.slice(2) as PatchOperationType;
    if (!validOps.includes(opType)) {
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
      const opPath = operand.slice(0, eqIndex);
      const rawValue = operand.slice(eqIndex + 1);

      if (opType === 'set') {
        operations.push({ type: opType, path: opPath, value: parseValue(rawValue) });
      } else {
        // set-json and add-to-array pass raw JSON string
        operations.push({ type: opType, path: opPath, value: rawValue });
      }
    }
  }

  return operations;
}

export async function runPatch(options: IPatchOptions): Promise<void> {
  const { file, operations } = options;

  if (!fs.existsSync(file)) {
    throw new Error(`File not found: ${file}`);
  }

  console.log(`Patching: ${file}`);
  let source = fs.readFileSync(file, 'utf-8');

  for (const op of operations) {
    const desc =
      op.type === 'uncomment' || op.type === 'remove'
        ? `  ${op.type}: ${op.path}`
        : `  ${op.type}: ${op.path} = ${op.value}`;
    console.log(desc);
  }

  source = applyOperations(source, operations);
  fs.writeFileSync(file, source);
  console.log(`  Done: ${operations.length} operation(s) applied`);
}
