#!/usr/bin/env node

/**
 * Transforms source ingredient YAML files into embedded TypeScript.
 *
 * Usage: rushx build:data
 *
 * This script reads all YAML files from data/ingredients/ and generates
 * a TypeScript file with the data embedded as JSON objects.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const SOURCE_DIR = path.join(__dirname, '../data/ingredients');
const OUTPUT_FILE = path.join(__dirname, '../src/packlets/built-in/builtInData.generated.ts');

// Read all YAML files and convert to JSON
const collections = {};
const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

for (const file of files) {
  const name = path.basename(file, path.extname(file));
  const content = yaml.parse(fs.readFileSync(path.join(SOURCE_DIR, file), 'utf-8'));
  collections[name] = content;
}

// Generate TypeScript with embedded JSON
const output = `// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Run 'rushx build:data' to regenerate from source YAML files in data/ingredients/
//
// Source files:
${files.map((f) => `//   - data/ingredients/${f}`).join('\n')}

import { JsonObject } from '@fgv/ts-json-base';

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Generated ingredient collections from source YAML files.
 * @public
 */
export const ingredientCollections: Record<string, JsonObject> = ${JSON.stringify(collections, null, 2)};
/* eslint-enable @typescript-eslint/naming-convention */
`;

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`Generated ${path.relative(process.cwd(), OUTPUT_FILE)} from ${files.length} YAML files`);
