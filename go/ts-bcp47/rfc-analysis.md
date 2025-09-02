# RFC 5646 vs Practical BCP-47 Analysis

## The Issue
Our Go parser treats "en-USA" as:
- Primary Language: "en"
- ExtLang: ["usa"]
- Region: ""

But our test expects:
- Primary Language: "en"
- Region: "USA"

## RFC 5646 Parser Order
According to RFC 5646 Section 2.1, the order is:
1. **Primary Language** (2-3 letters OR 5-8 letters)
2. **Extended Language** (0-3 subtags of exactly 3 letters each)
3. **Script** (exactly 4 letters)
4. **Region** (2 letters OR 3 digits)
5. **Variants** (5-8 alphanumeric OR 4 starting with digit)

## The Conflict
"USA" is:
- ✅ Valid ExtLang: exactly 3 letters
- ✅ Valid Region: 3 letters (well-formed, though non-standard)

Since ExtLang comes before Region in parser order, "USA" should be parsed as ExtLang.

## Real-World Examples
Let's check some actual BCP-47 tags:
- `en-US` → Language: "en", Region: "US" (2 letters, unambiguous)
- `zh-yue` → Language: "zh", ExtLang: "yue" (Cantonese)
- `zh-Hans-HK` → Language: "zh", Script: "Hans", Region: "HK"

## The Question
Does TypeScript follow strict RFC 5646 order, or does it use heuristics?

## Testing Strategy
1. ✅ Check what our Go parser does (follows RFC 5646 strictly)
2. ⏳ Check what TypeScript actually does
3. ⏳ Decide if we need to match TypeScript or RFC 5646

## Practical Considerations
In practice:
- 3-letter region codes like "USA" are very rare in modern BCP-47
- Standard region codes are 2 letters (ISO 3166-1 alpha-2) or 3 digits (UN M.49)
- ExtLangs are also relatively rare and mostly used for Chinese languages

## Hypothesis
Our Go parser might be more RFC-compliant than expected, and the test might need adjustment.