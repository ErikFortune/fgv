// Simple test to check TypeScript BCP-47 behavior for "en-USA"
// This will help us understand what the expected behavior should be

const testCases = ['en-U', 'en-USA', 'en-US'];

testCases.forEach(testCase => {
    console.log(`\n=== Testing: ${testCase} ===`);
    
    // Mock the expected behavior based on RFC 5646
    // According to RFC 5646, the parsing order is:
    // 1. Primary language (2-3 or 5-8 letters)
    // 2. Extended language (0-3 subtags of 3 letters each)
    // 3. Script (4 letters)
    // 4. Region (2 letters or 3 digits)
    // 5. Variants
    
    const parts = testCase.split('-');
    const language = parts[0]; // "en"
    const second = parts[1]; // "U", "USA", "US"
    
    console.log(`Language: "${language}"`);
    console.log(`Second part: "${second}"`);
    
    // Check what the second part should be interpreted as:
    if (second.length === 3 && /^[a-zA-Z]{3}$/.test(second)) {
        console.log(`"${second}" could be:`)
        console.log(`  - ExtLang: 3 letters ✓`);
        console.log(`  - Region: 3 letters (well-formed but not standard) ✓`);
        console.log(`Expected: ExtLang takes precedence in parser order`);
    } else if (second.length === 2 && /^[A-Z]{2}$/i.test(second)) {
        console.log(`"${second}" is likely a Region: 2 letters ✓`);
    } else if (second.length === 1 && /^[A-Z]$/i.test(second)) {
        console.log(`"${second}" could be:`)
        console.log(`  - Region: 1 letter (well-formed but not standard) ✓`);
        console.log(`Expected: Region (no other option)`);
    }
});

console.log('\n=== RFC 5646 Reference ===');
console.log('Parser order: Language → ExtLang → Script → Region → Variant');
console.log('ExtLang: 3 lowercase letters (up to 3 subtags)');
console.log('Region: 2 uppercase letters OR 3 digits (standard)');
console.log('Well-formed allows more variation than strict validation');