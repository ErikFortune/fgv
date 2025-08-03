import { Bcp47 } from './src/index';

// Test cases for comprehensive parity validation
const testCases = [
    // Basic well-formed cases
    'en',
    'eng', // 3-letter language (well-formed but not valid)
    'en-US',
    'en-U', // 1-letter region (well-formed but not valid)
    'en-USA', // 3-letter non-numeric region (well-formed but not valid)
    'zh-Hans',
    'zh-Hans-CN',
    'zh-cmn-Hans',
    'es-419', // Macro region
    'ca-valencia',
    'es-valencia',
    'en-US-oxendict',
    'en-x-test',
    'en-x-mycompany',
    
    // Edge cases that should be well-formed
    'art-lojban',
    'zh-min-nan',
    'zh-yue-HK',
    'sr-Latn-RS',
    'uz-Cyrl-UZ',
    'az-Arab-IR',
    
    // Malformed cases (should fail)
    '',
    'e',
    'en-',
    'en--US',
    '-en',
    'en-US-',
    'en-US--valencia',
    
    // Case variations
    'EN',
    'EN-US',
    'ENG',
    'ENG-US',
    'en-us',
    'En-Us',
    
    // Complex cases
    'en-US-valencia-valencia', // Duplicate variant
    'zh-Hans-CN-u-co-phonebk',
    'en-US-u-co-phonebk-kn-true',
    'ja-JP-u-ca-japanese',
    
    // Private use variations
    'x-test',
    'en-x-test-private',
    'x-very-long-private-use-tag',
];

interface TestResult {
    input: string;
    wellFormed: boolean;
    valid: boolean;
    strictlyValid: boolean;
    parsed?: {
        primaryLanguage?: string;
        extlang?: string;
        script?: string;
        region?: string;
        variants?: string[];
        extensions?: Record<string, string[]>;
        privateUse?: string[];
    };
    canonical?: string;
    preferred?: string;
    error?: string;
}

function testTag(input: string): TestResult {
    const result: TestResult = {
        input,
        wellFormed: false,
        valid: false,
        strictlyValid: false,
    };
    
    try {
        // Test well-formed parsing
        const wellFormedResult = Bcp47.tag(input, { validity: 'wellFormed' });
        if (wellFormedResult.isSuccess()) {
            result.wellFormed = true;
            const tag = wellFormedResult.value;
            result.parsed = {
                primaryLanguage: tag.subtags.primaryLanguage,
                extlang: tag.subtags.extlang,
                script: tag.subtags.script,
                region: tag.subtags.region,
                variants: tag.subtags.variants?.length ? tag.subtags.variants : undefined,
                extensions: Object.keys(tag.subtags.extensions || {}).length ? tag.subtags.extensions : undefined,
                privateUse: tag.subtags.privateUse?.length ? tag.subtags.privateUse : undefined,
            };
            
            // Test canonical form
            const canonicalResult = Bcp47.tag(input, { normalization: 'canonical' });
            if (canonicalResult.isSuccess()) {
                result.canonical = canonicalResult.value.tag;
            }
            
            // Test preferred form  
            const preferredResult = Bcp47.tag(input, { normalization: 'preferred' });
            if (preferredResult.isSuccess()) {
                result.preferred = preferredResult.value.tag;
            }
        }
        
        // Test valid parsing
        const validResult = Bcp47.tag(input, { validity: 'valid' });
        if (validResult.isSuccess()) {
            result.valid = true;
        }
        
        // Test strictly valid parsing
        const strictlyValidResult = Bcp47.tag(input, { validity: 'strictlyValid' });
        if (strictlyValidResult.isSuccess()) {
            result.strictlyValid = true;
        }
        
    } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
    }
    
    return result;
}

// Test similarity cases
const similarityTestCases = [
    ['en', 'en'], // exact
    ['en-US', 'en-us'], // case difference
    ['en', 'en-US'], // neutral vs region
    ['en-US', 'en-GB'], // sibling regions
    ['es-419', 'es-MX'], // macro region
    ['zh-Hans', 'zh-Hant'], // different scripts
    ['en', 'fr'], // different languages
    ['en-Latn-US', 'en-US'], // suppressed script
    ['ca-valencia', 'ca'], // variant vs base
    ['art-lojban', 'jbo'], // grandfathered vs preferred
];

function testSimilarity(tag1: string, tag2: string) {
    try {
        const result = Bcp47.similarity(tag1, tag2);
        if (result.isSuccess()) {
            return {
                tag1,
                tag2,
                score: result.value,
                error: null,
            };
        } else {
            return {
                tag1,
                tag2,
                score: null,
                error: result.error?.message || 'Unknown error',
            };
        }
    } catch (error) {
        return {
            tag1,
            tag2,
            score: null,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

// Generate all test results
console.log('=== BCP-47 TypeScript Test Results ===\n');

console.log('// Parsing test results');
console.log('const parsingTestResults = [');
testCases.forEach(testCase => {
    const result = testTag(testCase);
    console.log(`  ${JSON.stringify(result, null, 2)},`);
});
console.log('];');

console.log('\n// Similarity test results');
console.log('const similarityTestResults = [');
similarityTestCases.forEach(([tag1, tag2]) => {
    const result = testSimilarity(tag1, tag2);
    console.log(`  ${JSON.stringify(result, null, 2)},`);
});
console.log('];');

console.log('\n// Export for Go test consumption');
console.log('module.exports = { parsingTestResults, similarityTestResults };');