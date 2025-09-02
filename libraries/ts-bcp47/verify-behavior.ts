#!/usr/bin/env ts-node
/*
 * Verification script to test TypeScript BCP-47 behavior for edge cases
 * This helps us understand what the Go implementation should match
 */

import * as Bcp47 from './src/packlets/bcp47';

const testCases = [
    'eng',        // 3-letter language (lowercase)
    'ENG',        // 3-letter language (uppercase) 
    'en-U',       // 1-letter region
    'en-USA',     // 3-letter region (non-numeric)
    'en-1234',    // 4-digit (should be variant)
    'en-x-mycompany', // private use > 8 chars
    'zh-hans-cn',    // lowercase script
    'zh-Hans-CN',    // proper case
];

console.log('TypeScript BCP-47 Behavior Verification');
console.log('==========================================\n');

for (const testCase of testCases) {
    console.log(`Testing: "${testCase}"`);
    
    // Test well-formed
    const wellFormedResult = Bcp47.LanguageTag.createFromTag(testCase, { validity: 'well-formed' });
    console.log(`  Well-formed: ${wellFormedResult.success ? 'SUCCESS' : 'FAIL'}`);
    if (wellFormedResult.success) {
        console.log(`    Parsed: ${JSON.stringify(wellFormedResult.value.subtags)}`);
    } else {
        console.log(`    Error: ${wellFormedResult.message}`);
    }
    
    // Test valid
    const validResult = Bcp47.LanguageTag.createFromTag(testCase, { validity: 'valid' });
    console.log(`  Valid: ${validResult.success ? 'SUCCESS' : 'FAIL'}`);
    if (!validResult.success) {
        console.log(`    Error: ${validResult.message}`);
    }
    
    // Test strictly valid
    const strictResult = Bcp47.LanguageTag.createFromTag(testCase, { validity: 'strictly-valid' });
    console.log(`  Strictly Valid: ${strictResult.success ? 'SUCCESS' : 'FAIL'}`);
    if (!strictResult.success) {
        console.log(`    Error: ${strictResult.message}`);
    }
    
    console.log('');
}

// Test some similarities
console.log('\nSimilarity Tests:');
console.log('=================');

const similarityTests = [
    ['en', 'en-US'],
    ['en-US', 'en-GB'], 
    ['zh-Hans', 'zh-Hant'],
    ['eng', 'en'],    // If eng is parsed successfully
    ['ENG', 'EN'],    // Case variations
];

for (const [tag1, tag2] of similarityTests) {
    try {
        const matcher = new Bcp47.LanguageSimilarityMatcher();
        const result = matcher.match(tag1, tag2);
        console.log(`  ${tag1} ↔ ${tag2}: ${result.score} (${result.similarity})`);
    } catch (error) {
        console.log(`  ${tag1} ↔ ${tag2}: ERROR - ${error.message}`);
    }
}