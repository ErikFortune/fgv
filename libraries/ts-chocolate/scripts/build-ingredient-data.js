#!/usr/bin/env node

/**
 * Transforms source YAML files into embedded TypeScript.
 *
 * Usage: rushx build:data
 *
 * This script reads all YAML files from data/ingredients/ and data/recipes/
 * and generates a TypeScript file with the data embedded as JSON objects.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const INGREDIENTS_DIR = path.join(__dirname, '../data/ingredients');
const RECIPES_DIR = path.join(__dirname, '../data/recipes');
const OUTPUT_FILE = path.join(__dirname, '../src/packlets/built-in/builtInData.generated.ts');

/**
 * Reads all YAML files from a directory and returns them as a collections object.
 * @param {string} dir - Directory to read from
 * @returns {{ collections: Record<string, object>, files: string[] }}
 */
function loadCollectionsFromDir(dir) {
  const collections = {};
  let files = [];

  if (fs.existsSync(dir)) {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
    for (const file of files) {
      const name = path.basename(file, path.extname(file));
      const content = yaml.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      collections[name] = content;
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
  ...ingredients.files.map((f) => `//   - data/ingredients/${f}`),
  ...recipes.files.map((f) => `//   - data/recipes/${f}`)
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
console.log(
  `Generated ${path.relative(process.cwd(), OUTPUT_FILE)} from ${
    ingredients.files.length
  } ingredient files and ${recipes.files.length} recipe files`
);
