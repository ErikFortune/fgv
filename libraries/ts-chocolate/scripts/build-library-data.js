#!/usr/bin/env node

/**
 * Transforms source YAML and JSON files into embedded TypeScript.
 *
 * Usage: rushx build:data
 *
 * This script reads all YAML and JSON files from:
 *   - data/published/ingredients/
 *   - data/published/fillings/
 *   - data/published/molds/
 *   - data/published/procedures/
 *   - data/published/tasks/
 * and generates a TypeScript file with the data embedded as JSON objects.
 *
 * - YAML files are parsed and converted to JSON objects (unencrypted data)
 * - JSON files are included as-is (typically encrypted collection files)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const INGREDIENTS_DIR = path.join(__dirname, '../data/published/ingredients');
const FILLINGS_DIR = path.join(__dirname, '../data/published/fillings');
const MOLDS_DIR = path.join(__dirname, '../data/published/molds');
const PROCEDURES_DIR = path.join(__dirname, '../data/published/procedures');
const TASKS_DIR = path.join(__dirname, '../data/published/tasks');
const CONFECTIONS_DIR = path.join(__dirname, '../data/published/confections');
const DECORATIONS_DIR = path.join(__dirname, '../data/published/decorations');
const OUTPUT_FILE = path.join(__dirname, '../src/packlets/built-in/builtInData.generated.ts');

/**
 * Checks if a file is a YAML file
 * @param {string} filename
 * @returns {boolean}
 */
function isYamlFile(filename) {
  return filename.endsWith('.yaml') || filename.endsWith('.yml');
}

/**
 * Checks if a file is a JSON file
 * @param {string} filename
 * @returns {boolean}
 */
function isJsonFile(filename) {
  return filename.endsWith('.json');
}

/**
 * Reads all YAML and JSON files from a directory and returns them as a collections object.
 * @param {string} dir - Directory to read from
 * @returns {{ collections: Record<string, object>, files: string[] }}
 */
function loadCollectionsFromDir(dir) {
  const collections = {};
  let files = [];

  if (fs.existsSync(dir)) {
    files = fs.readdirSync(dir).filter((f) => isYamlFile(f) || isJsonFile(f));
    for (const file of files) {
      const name = path.basename(file, path.extname(file));
      const filePath = path.join(dir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      if (isYamlFile(file)) {
        // Parse YAML files
        collections[name] = yaml.parse(fileContent);
      } else {
        // Parse JSON files (typically encrypted collections)
        collections[name] = JSON.parse(fileContent);
      }
    }
  }

  return { collections, files };
}

// Load ingredients
const ingredients = loadCollectionsFromDir(INGREDIENTS_DIR);

// Load fillings
const fillings = loadCollectionsFromDir(FILLINGS_DIR);

// Load molds
const molds = loadCollectionsFromDir(MOLDS_DIR);

// Load procedures
const procedures = loadCollectionsFromDir(PROCEDURES_DIR);

// Load tasks
const tasks = loadCollectionsFromDir(TASKS_DIR);

// Load confections
const confections = loadCollectionsFromDir(CONFECTIONS_DIR);

// Load decorations
const decorations = loadCollectionsFromDir(DECORATIONS_DIR);

// Build source file comments
const sourceComments = [
  ...ingredients.files.map((f) => `//   - data/published/ingredients/${f}`),
  ...fillings.files.map((f) => `//   - data/published/fillings/${f}`),
  ...molds.files.map((f) => `//   - data/published/molds/${f}`),
  ...procedures.files.map((f) => `//   - data/published/procedures/${f}`),
  ...tasks.files.map((f) => `//   - data/published/tasks/${f}`),
  ...confections.files.map((f) => `//   - data/published/confections/${f}`),
  ...decorations.files.map((f) => `//   - data/published/decorations/${f}`)
].join('\n');

// Generate TypeScript with embedded JSON
const output = `// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Run 'rushx build:data' to regenerate from source YAML files
//
// Source files:
${sourceComments}

/* eslint-disable max-lines */
import { JsonObject } from '@fgv/ts-json-base';

/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Generated ingredient collections from source YAML files.
 * @public
 */
export const ingredientCollections: Record<string, JsonObject> = ${JSON.stringify(
  ingredients.collections,
  null,
  2
)};

/**
 * Generated fillings collections from source YAML files.
 * @public
 */
export const fillingCollections: Record<string, JsonObject> = ${JSON.stringify(
  fillings.collections,
  null,
  2
)};

/**
 * Generated mold collections from source YAML files.
 * @public
 */
export const moldCollections: Record<string, JsonObject> = ${JSON.stringify(molds.collections, null, 2)};

/**
 * Generated procedure collections from source YAML files.
 * @public
 */
export const procedureCollections: Record<string, JsonObject> = ${JSON.stringify(
  procedures.collections,
  null,
  2
)};

/**
 * Generated task collections from source YAML files.
 * @public
 */
export const taskCollections: Record<string, JsonObject> = ${JSON.stringify(tasks.collections, null, 2)};

/**
 * Generated confection collections from source YAML files.
 * @public
 */
export const confectionCollections: Record<string, JsonObject> = ${JSON.stringify(
  confections.collections,
  null,
  2
)};

/**
 * Generated decoration collections from source YAML files.
 * @public
 */
export const decorationCollections: Record<string, JsonObject> = ${JSON.stringify(
  decorations.collections,
  null,
  2
)};
/* eslint-enable @typescript-eslint/naming-convention */
`;

fs.writeFileSync(OUTPUT_FILE, output);

// Count file types for reporting
const allFiles = [
  ...ingredients.files,
  ...fillings.files,
  ...molds.files,
  ...procedures.files,
  ...tasks.files,
  ...confections.files,
  ...decorations.files
];
const yamlCount = allFiles.filter(isYamlFile).length;
const jsonCount = allFiles.filter(isJsonFile).length;

console.log(
  `Generated ${path.relative(process.cwd(), OUTPUT_FILE)} from ${
    ingredients.files.length
  } ingredient files, ${fillings.files.length} filling files, ${molds.files.length} mold files, ${
    procedures.files.length
  } procedure files, ${tasks.files.length} task files, and ${
    confections.files.length
  } confection files, and ${decorations.files.length} decoration files (${yamlCount} YAML, ${jsonCount} JSON)`
);
