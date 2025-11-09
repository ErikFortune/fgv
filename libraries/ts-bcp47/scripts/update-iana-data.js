#!/usr/bin/env node
/**
 * Script to update IANA language registry data from the latest online sources.
 *
 * This script:
 * 1. Downloads the latest IANA language subtag registry
 * 2. Downloads the latest IANA language tag extensions registry
 * 3. Converts them from text format to JSON format using the library's own converters
 * 4. Backs up the existing data files
 * 5. Replaces the data files with the updated versions
 *
 * Usage: node scripts/update-iana-data.js [--dry-run]
 *
 * Options:
 *   --dry-run    Download and convert data but don't replace existing files
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');
const zlib = require('zlib');

// Import ts-utils Normalizer for consistent JSON formatting
const { Normalizer } = require('@fgv/ts-utils');

// IANA registry URLs
const SUBTAGS_URL = 'https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry';
const EXTENSIONS_URL =
  'https://www.iana.org/assignments/language-tag-extensions-registry/language-tag-extensions-registry';

// File paths
const DATA_DIR = path.join(__dirname, '..', 'src', 'data', 'iana');
const TEST_DATA_DIR = path.join(__dirname, '..', 'src', 'test', 'data', 'iana');
const SUBTAGS_FILE = path.join(DATA_DIR, 'language-subtags.json');
const EXTENSIONS_FILE = path.join(DATA_DIR, 'language-tag-extensions.json');
const IANA_ZIP_FILE = path.join(DATA_DIR, 'iana-data.zip');
const TEST_SUBTAGS_JSON = path.join(TEST_DATA_DIR, 'language-subtag-registry.json');
const TEST_SUBTAGS_TXT = path.join(TEST_DATA_DIR, 'language-subtag-registry.txt');
const TEST_EXTENSIONS_JSON = path.join(TEST_DATA_DIR, 'language-tag-extension-registry.json');

// Check if this is a dry run
const isDryRun = process.argv.includes('--dry-run');

/**
 * Normalizes and formats JSON data for consistent output
 */
function normalizeAndFormat(data) {
  const normalizer = new Normalizer();
  const result = normalizer.normalize(data);

  if (result.isFailure()) {
    throw new Error(`Normalization failed: ${result.message}`);
  }

  // Format with 2-space indentation and trailing newline (prettier compatible)
  return JSON.stringify(result.value, null, 2) + '\n';
}

/**
 * Creates a ZIP file containing the IANA registry data
 */
function createIanaZipFile(subtags, extensions) {
  if (isDryRun) {
    const subtagsSize = Math.round(normalizeAndFormat(subtags).length / 1024);
    const extensionsSize = Math.round(normalizeAndFormat(extensions).length / 1024);
    const totalSize = subtagsSize + extensionsSize;
    const estimatedCompressedSize = Math.round(totalSize * 0.08); // ~92% compression ratio observed

    console.log(`🔍 Dry run: would create ${path.basename(IANA_ZIP_FILE)}`);
    console.log(`   Estimated uncompressed size: ${totalSize}KB`);
    console.log(`   Estimated compressed size: ${estimatedCompressedSize}KB`);
    console.log(`   Estimated compression ratio: ~92%`);
    return;
  }

  console.log('📦 Creating compressed IANA data ZIP file...');

  try {
    // Use the 'zip' command for simplicity and better compression
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write temporary files
    const tempSubtags = path.join(tempDir, 'language-subtags.json');
    const tempExtensions = path.join(tempDir, 'language-tag-extensions.json');

    fs.writeFileSync(tempSubtags, normalizeAndFormat(subtags));
    fs.writeFileSync(tempExtensions, normalizeAndFormat(extensions));

    // Create ZIP file using maximum compression
    const zipCommand = `cd "${tempDir}" && zip -9 "${IANA_ZIP_FILE}" language-subtags.json language-tag-extensions.json`;
    execSync(zipCommand, { stdio: 'pipe' });

    // Clean up temporary files
    fs.unlinkSync(tempSubtags);
    fs.unlinkSync(tempExtensions);
    fs.rmdirSync(tempDir);

    // Report compression statistics
    const zipStats = fs.statSync(IANA_ZIP_FILE);
    const originalSize = normalizeAndFormat(subtags).length + normalizeAndFormat(extensions).length;
    const compressionRatio = Math.round((1 - zipStats.size / originalSize) * 100);

    console.log(`✅ Created ${path.basename(IANA_ZIP_FILE)}`);
    console.log(`   Original size: ${Math.round(originalSize / 1024)}KB`);
    console.log(`   Compressed size: ${Math.round(zipStats.size / 1024)}KB`);
    console.log(`   Compression ratio: ${compressionRatio}%`);
  } catch (error) {
    console.warn(`⚠️  Failed to create ZIP file: ${error.message}`);
    console.warn('   ZIP creation is optional - individual JSON files are still available');
  }
}

/**
 * Runs prettier on the generated JSON files
 */
function runPrettierOnGeneratedFiles() {
  if (isDryRun) {
    console.log('🔍 Dry run: would run prettier on generated files');
    return;
  }

  console.log('🎨 Running prettier on generated JSON files...');

  const jsonFiles = [SUBTAGS_FILE, EXTENSIONS_FILE, TEST_SUBTAGS_JSON, TEST_EXTENSIONS_JSON];

  try {
    const relativePathsArray = jsonFiles.map((f) => path.relative(process.cwd(), f));
    execFileSync('npx', ['prettier', '--write', ...relativePathsArray], {
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Prettier formatting applied to all JSON files');
  } catch (error) {
    console.warn('⚠️  Prettier formatting failed, files may have inconsistent formatting:', error.message);
  }
}

/**
 * Downloads content from a URL
 */
function downloadUrl(url) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading ${url}...`);

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ts-bcp47-updater/1.0; +https://github.com/ErikFortune/fgv)'
      }
    };

    https
      .get(url, options, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: ${response.statusCode} ${response.statusMessage}`));
          return;
        }

        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          console.log(`✅ Downloaded ${Math.round(data.length / 1024)}KB from ${url}`);
          resolve(data);
        });
      })
      .on('error', (error) => {
        reject(new Error(`Network error downloading ${url}: ${error.message}`));
      });
  });
}

/**
 * Converts IANA text format to JSON using the library's converters
 */
function convertIanaData() {
  try {
    // Import the library's converters (from compiled lib directory)
    const libPath = path.join(__dirname, '..', 'lib', 'packlets', 'iana');
    const { LanguageSubtags, LanguageTagExtensions } = require(libPath);

    return { LanguageSubtags, LanguageTagExtensions };
  } catch (error) {
    throw new Error(
      `Failed to import library converters. Make sure the library is built first: rushx build\nError: ${error.message}`
    );
  }
}

/**
 * Converts subtags registry from text to JSON preserving array fields
 */
function convertSubtags(content, converters) {
  console.log('🔄 Converting language subtags registry...');

  const result = converters.LanguageSubtags.JarConverters.loadTxtSubtagRegistryFromString(content);

  if (result.isFailure()) {
    throw new Error(`Failed to convert subtags registry: ${result.message}`);
  }

  const registry = result.value;

  // Fix the prefix field to be arrays for extlang entries
  registry.entries.forEach((entry) => {
    if (entry.type === 'extlang' && entry.prefix && typeof entry.prefix === 'string') {
      entry.prefix = [entry.prefix];
    }
  });

  console.log(`✅ Converted ${registry.entries.length} subtag entries (file date: ${registry.fileDate})`);

  // Debug: Check prefix format in extlang entries
  const extlangSample = registry.entries.find((e) => e.type === 'extlang' && e.prefix);
  if (extlangSample) {
    console.log(`🔍 Sample extlang prefix format:`, JSON.stringify(extlangSample.prefix));
  }

  return registry;
}

/**
 * Converts subtags registry to test format (JAR intermediate format)
 */
function convertSubtagsToTestFormat(content, converters) {
  console.log('🔄 Converting language subtags registry to test format...');

  const result = converters.LanguageSubtags.JarConverters.loadRawSubtagRegistryFromString(content);

  if (result.isFailure()) {
    throw new Error(`Failed to convert subtags registry to test format: ${result.message}`);
  }

  const registry = result.value;
  console.log(
    `✅ Converted ${registry.entries.length} subtag entries to test format (file date: ${registry.fileDate})`
  );

  return registry;
}

/**
 * Converts extensions registry from text to JSON
 */
function convertExtensions(content, converters) {
  console.log('🔄 Converting language tag extensions registry...');

  const result =
    converters.LanguageTagExtensions.JarConverters.loadTxtLanguageTagExtensionsRegistryFromString(content);

  if (result.isFailure()) {
    throw new Error(`Failed to convert extensions registry: ${result.message}`);
  }

  const registry = result.value;
  console.log(`✅ Converted ${registry.entries.length} extension entries (file date: ${registry.fileDate})`);

  return registry;
}

/**
 * Converts extensions registry to test format (JAR intermediate format)
 */
function convertExtensionsToTestFormat(content, converters) {
  console.log('🔄 Converting language tag extensions registry to test format...');

  const result =
    converters.LanguageTagExtensions.JarConverters.loadRawLanguageTagExtensionsRegistryFromString(content);

  if (result.isFailure()) {
    throw new Error(`Failed to convert extensions registry to test format: ${result.message}`);
  }

  const registry = result.value;
  console.log(
    `✅ Converted ${registry.entries.length} extension entries to test format (file date: ${registry.fileDate})`
  );

  return registry;
}

/**
 * Backs up existing data files
 */
function backupExistingFiles() {
  if (isDryRun) {
    console.log('🔍 Dry run: would backup existing files (production and test data)');
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Backup production files
  if (fs.existsSync(SUBTAGS_FILE)) {
    const backupPath = `${SUBTAGS_FILE}.backup-${timestamp}`;
    fs.copyFileSync(SUBTAGS_FILE, backupPath);
    console.log(`📋 Backed up production subtags to: ${path.basename(backupPath)}`);
  }

  if (fs.existsSync(EXTENSIONS_FILE)) {
    const backupPath = `${EXTENSIONS_FILE}.backup-${timestamp}`;
    fs.copyFileSync(EXTENSIONS_FILE, backupPath);
    console.log(`📋 Backed up production extensions to: ${path.basename(backupPath)}`);
  }

  if (fs.existsSync(IANA_ZIP_FILE)) {
    const backupPath = `${IANA_ZIP_FILE}.backup-${timestamp}`;
    fs.copyFileSync(IANA_ZIP_FILE, backupPath);
    console.log(`📋 Backed up production ZIP to: ${path.basename(backupPath)}`);
  }

  // Backup test files
  if (fs.existsSync(TEST_SUBTAGS_JSON)) {
    const backupPath = `${TEST_SUBTAGS_JSON}.backup-${timestamp}`;
    fs.copyFileSync(TEST_SUBTAGS_JSON, backupPath);
    console.log(`📋 Backed up test subtags JSON to: ${path.basename(backupPath)}`);
  }

  if (fs.existsSync(TEST_SUBTAGS_TXT)) {
    const backupPath = `${TEST_SUBTAGS_TXT}.backup-${timestamp}`;
    fs.copyFileSync(TEST_SUBTAGS_TXT, backupPath);
    console.log(`📋 Backed up test subtags TXT to: ${path.basename(backupPath)}`);
  }

  if (fs.existsSync(TEST_EXTENSIONS_JSON)) {
    const backupPath = `${TEST_EXTENSIONS_JSON}.backup-${timestamp}`;
    fs.copyFileSync(TEST_EXTENSIONS_JSON, backupPath);
    console.log(`📋 Backed up test extensions to: ${path.basename(backupPath)}`);
  }
}

/**
 * Writes the new data files
 */
function writeDataFiles(subtags, extensions, testSubtags, testExtensions, subtagsContent, extensionsContent) {
  if (isDryRun) {
    console.log('🔍 Dry run: would write updated data files');
    console.log(`  Production:`);
    console.log(
      `    - ${path.basename(SUBTAGS_FILE)}: ${subtags.entries.length} entries (${subtags.fileDate})`
    );
    console.log(`       📏 Estimated size: ${Math.round(normalizeAndFormat(subtags).length / 1024)}KB`);
    console.log(
      `    - ${path.basename(EXTENSIONS_FILE)}: ${extensions.entries.length} entries (${extensions.fileDate})`
    );
    console.log(`       📏 Estimated size: ${Math.round(normalizeAndFormat(extensions).length / 1024)}KB`);
    console.log(`  Test:`);
    console.log(
      `    - ${path.basename(TEST_SUBTAGS_JSON)}: ${testSubtags.entries.length} entries (${
        testSubtags.fileDate
      })`
    );
    console.log(`       📏 Estimated size: ${Math.round(normalizeAndFormat(testSubtags).length / 1024)}KB`);
    console.log(`    - ${path.basename(TEST_SUBTAGS_TXT)}: original text format`);
    console.log(`       📏 Estimated size: ${Math.round(subtagsContent.length / 1024)}KB`);
    console.log(
      `    - ${path.basename(TEST_EXTENSIONS_JSON)}: ${testExtensions.entries.length} entries (${
        testExtensions.fileDate
      })`
    );
    console.log(
      `       📏 Estimated size: ${Math.round(normalizeAndFormat(testExtensions).length / 1024)}KB`
    );
    return;
  }

  // Ensure data directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
  }

  // Write production files (normalized and formatted)
  const normalizedSubtags = normalizeAndFormat(subtags);
  fs.writeFileSync(SUBTAGS_FILE, normalizedSubtags);
  console.log(
    `💾 Updated production ${path.basename(SUBTAGS_FILE)}: ${subtags.entries.length} entries (${
      subtags.fileDate
    })`
  );
  console.log(`   📏 File size: ${Math.round(normalizedSubtags.length / 1024)}KB`);

  const normalizedExtensions = normalizeAndFormat(extensions);
  fs.writeFileSync(EXTENSIONS_FILE, normalizedExtensions);
  console.log(
    `💾 Updated production ${path.basename(EXTENSIONS_FILE)}: ${extensions.entries.length} entries (${
      extensions.fileDate
    })`
  );
  console.log(`   📏 File size: ${Math.round(normalizedExtensions.length / 1024)}KB`);

  // Write test files (normalized and formatted)
  const normalizedTestSubtags = normalizeAndFormat(testSubtags);
  fs.writeFileSync(TEST_SUBTAGS_JSON, normalizedTestSubtags);
  console.log(
    `💾 Updated test ${path.basename(TEST_SUBTAGS_JSON)}: ${testSubtags.entries.length} entries (${
      testSubtags.fileDate
    })`
  );
  console.log(`   📏 File size: ${Math.round(normalizedTestSubtags.length / 1024)}KB`);

  fs.writeFileSync(TEST_SUBTAGS_TXT, subtagsContent);
  console.log(`💾 Updated test ${path.basename(TEST_SUBTAGS_TXT)}: original text format`);
  console.log(`   📏 File size: ${Math.round(subtagsContent.length / 1024)}KB`);

  const normalizedTestExtensions = normalizeAndFormat(testExtensions);
  fs.writeFileSync(TEST_EXTENSIONS_JSON, normalizedTestExtensions);
  console.log(
    `💾 Updated test ${path.basename(TEST_EXTENSIONS_JSON)}: ${testExtensions.entries.length} entries (${
      testExtensions.fileDate
    })`
  );
  console.log(`   📏 File size: ${Math.round(normalizedTestExtensions.length / 1024)}KB`);
}

/**
 * Compares old and new data to show what changed
 */
function showChanges(subtags, extensions) {
  try {
    if (fs.existsSync(SUBTAGS_FILE)) {
      const oldSubtags = JSON.parse(fs.readFileSync(SUBTAGS_FILE, 'utf-8'));
      const oldCount = oldSubtags.entries.length;
      const newCount = subtags.entries.length;
      const countDiff = newCount - oldCount;

      console.log(`📊 Subtags changes: ${oldSubtags.fileDate} → ${subtags.fileDate}`);
      console.log(`   Entries: ${oldCount} → ${newCount} (${countDiff > 0 ? '+' : ''}${countDiff})`);
    }

    if (fs.existsSync(EXTENSIONS_FILE)) {
      const oldExtensions = JSON.parse(fs.readFileSync(EXTENSIONS_FILE, 'utf-8'));
      const oldCount = oldExtensions.entries.length;
      const newCount = extensions.entries.length;
      const countDiff = newCount - oldCount;

      console.log(`📊 Extensions changes: ${oldExtensions.fileDate} → ${extensions.fileDate}`);
      console.log(`   Entries: ${oldCount} → ${newCount} (${countDiff > 0 ? '+' : ''}${countDiff})`);
    }
  } catch (error) {
    console.log('📊 Could not compare with existing files (they may not exist yet)');
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 IANA Language Registry Data Updater');
    console.log('=====================================\n');

    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No files will be modified\n');
    }

    // Get converters
    const converters = convertIanaData();

    // Download latest data
    const [subtagsContent, extensionsContent] = await Promise.all([
      downloadUrl(SUBTAGS_URL),
      downloadUrl(EXTENSIONS_URL)
    ]);

    console.log(); // Empty line for readability

    // Convert to production JSON format
    const subtags = convertSubtags(subtagsContent, converters);
    const extensions = convertExtensions(extensionsContent, converters);

    // Convert to test format (JAR intermediate format)
    const testSubtags = convertSubtagsToTestFormat(subtagsContent, converters);
    const testExtensions = convertExtensionsToTestFormat(extensionsContent, converters);

    console.log(); // Empty line for readability

    // Show what's changing
    showChanges(subtags, extensions);

    console.log(); // Empty line for readability

    // Backup and update files
    backupExistingFiles();
    writeDataFiles(subtags, extensions, testSubtags, testExtensions, subtagsContent, extensionsContent);

    // Create compressed ZIP file
    createIanaZipFile(subtags, extensions);

    // Generate embedded data module for browser compatibility
    if (!isDryRun) {
      try {
        execSync('node scripts/generate-embedded-data.js', { stdio: 'inherit' });
      } catch (error) {
        console.warn('⚠️  Failed to generate embedded data module:', error.message);
        console.warn('   You can manually run: rushx generate-embedded-data');
      }
    }

    // Apply prettier formatting to ensure consistent formatting
    runPrettierOnGeneratedFiles();

    console.log('\n✅ IANA registry data update complete!');

    if (!isDryRun) {
      console.log('\n📝 Next steps:');
      console.log('   1. Run tests to ensure compatibility: rushx test');
      console.log('   2. If tests pass, commit the updated data files');
      console.log('   3. Consider updating any version-dependent documentation');
    }
  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}
