#!/usr/bin/env node

/**
 * Transforms source YAML and JSON files into embedded TypeScript.
 *
 * Usage: rushx build:data
 *
 * This script reads all YAML and JSON files from data/published/ingredients/ and data/published/recipes/
 * and generates a TypeScript file with the data embedded as JSON objects.
 *
 * - YAML files are parsed and converted to JSON objects (unencrypted data)
 * - JSON files are included as-is (typically encrypted collection files)
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const INGREDIENTS_DIR = path.join(__dirname, '../data/published/ingredients');
const RECIPES_DIR = path.join(__dirname, '../data/published/recipes');
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

// Load recipes
const recipes = loadCollectionsFromDir(RECIPES_DIR);

// Build source file comments
const sourceComments = [
  ...ingredients.files.map((f) => `//   - data/published/ingredients/${f}`),
  ...recipes.files.map((f) => `//   - data/published/recipes/${f}`)
].join('\n');

// Generate TypeScript with embedded JSON
const output = `// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Run 'rushx build:data' to regenerate from source YAML files
//
// Source files:
${sourceComments}

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
 * Generated recipe collections from source YAML files.
 * @public
 */
export const recipeCollections: Record<string, JsonObject> = ${JSON.stringify(recipes.collections, null, 2)};
/* eslint-enable @typescript-eslint/naming-convention */
`;

fs.writeFileSync(OUTPUT_FILE, output);

// Count file types for reporting
const yamlCount = [...ingredients.files, ...recipes.files].filter(isYamlFile).length;
const jsonCount = [...ingredients.files, ...recipes.files].filter(isJsonFile).length;

console.log(
  `Generated ${path.relative(process.cwd(), OUTPUT_FILE)} from ${
    ingredients.files.length
  } ingredient files and ${recipes.files.length} recipe files (${yamlCount} YAML, ${jsonCount} JSON)`
);
