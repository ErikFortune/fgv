#!/usr/bin/env node
/**
 * Script to normalize JSON data files for consistent formatting and diffing.
 *
 * This script:
 * 1. Uses ts-utils Normalizer to sort object keys
 * 2. Applies consistent JSON formatting with 2-space indentation
 * 3. Prepares for prettier formatting with project configuration
 *
 * Usage: node scripts/normalize-data.js
 */

const fs = require('fs');
const path = require('path');

// Import the normalizer from ts-utils
const { Normalizer } = require('@fgv/ts-utils');

// File paths to normalize
const dataFiles = [
  'src/data/iana/language-subtags.json',
  'src/data/iana/language-tag-extensions.json',
  'src/test/data/iana/language-subtag-registry.json',
  'src/test/data/iana/language-tag-extension-registry.json'
];

/**
 * Normalizes and formats a JSON file
 */
function normalizeJsonFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  console.log(`🔄 Normalizing ${filePath}...`);

  try {
    // Read and parse the file
    const content = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);

    // Normalize using ts-utils Normalizer
    const normalizer = new Normalizer();
    const normalizedResult = normalizer.normalize(data);

    if (normalizedResult.isFailure()) {
      throw new Error(`Normalization failed: ${normalizedResult.message}`);
    }

    const normalized = normalizedResult.value;

    // Format with consistent indentation
    const formatted = JSON.stringify(normalized, null, 2);

    // Write back to file
    fs.writeFileSync(fullPath, formatted + '\n');

    console.log(`✅ Normalized ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to normalize ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Main execution function
 */
function main() {
  try {
    console.log('🚀 JSON Data Normalizer');
    console.log('========================\n');

    // Normalize each data file
    for (const filePath of dataFiles) {
      normalizeJsonFile(filePath);
    }

    console.log('\n✅ All JSON data files normalized!');
    console.log('\n📝 Next steps:');
    console.log("   1. Run tests to verify normalization didn't break anything: rushx test");
    console.log('   2. Run prettier to apply final formatting: rush prettier');
    console.log('   3. Check git diff to see formatting changes');
  } catch (error) {
    console.error('\n❌ Normalization failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
