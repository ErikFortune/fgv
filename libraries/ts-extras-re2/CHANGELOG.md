# Change Log - @fgv/ts-extras-re2

This log was last generated on Fri, 20 Nov 2026 05:01:24 GMT and should not be manually modified.

## 5.1.0
Fri, 20 Nov 2026 05:01:24 GMT

### Minor changes

- Initial release: `re2PatternValidator`, an RE2 (re2js) validator for JSON Schema `pattern` from sources you do not control, such as an MCP server's tool schema — linear-time matching, ECMA-262 meaning or refusal.
- Pass it as `patternValidator` to `JsonSchema.fromJson` or `adaptMcpTools`; `createRe2PatternValidator` sets the source-length and program-size limits.

