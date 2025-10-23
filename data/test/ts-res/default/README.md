# Default Configuration Example

This example uses the `default` predefined configuration from ts-res, which demonstrates **territory-priority** resolution.

## Configuration Details

- **Territory Priority**: 850 (higher)
- **Language Priority**: 800 (lower)

This means that when both territory and language conditions match, the territory-specific resource will be chosen.

## Test Resources

### ui-labels.json
Contains UI labels with various combinations of language and territory conditions:
- Default (English, US formatting)
- Canada territory (CA): Canadian formatting with $ currency
- Great Britain territory (GB): British formatting with £ currency  
- French language (fr): French labels
- French + Canada (fr + CA): French labels with Canadian specifics
- French + France (fr + FR): French labels with European specifics

### greetings.json
Contains greeting messages with similar priority patterns:
- Default English greetings
- Territory-specific variations (US, CA, GB)
- French language versions
- French + territory combinations

## Testing Priority Behavior

The resource values are clearly labeled to show which candidate was selected. Look for:
- **"(DEFAULT)"** - Base candidate with no conditions
- **"(TERRITORY)"** - Territory-specific candidate chosen
- **"(LANGUAGE)"** - Language-specific candidate chosen  
- **"(BOTH)"** - Both conditions matched

### Key Test Cases

1. **Territory priority wins**: `{language: "fr", currentTerritory: "CA"}`
   - **Default Config**: Will show "BOTH: French + Canada Territory" 
   - **Language-Priority Config**: Will show "LANGUAGE: French" (territory ignored)
   
2. **Language fallback**: `{language: "fr", currentTerritory: "US"}`
   - Expected: "LANGUAGE: French" (no US+French combination exists)

3. **Territory only**: `{currentTerritory: "GB"}`
   - Expected: "TERRITORY: Great Britain" (clearly British-specific values)

4. **Language only**: `{language: "fr"}`
   - Expected: "LANGUAGE: French" (French-specific values)

### What to Look For

- **welcomeMessage**: Shows different greetings per candidate
- **source/priority fields**: Explicitly state which candidate was selected
- **Distinctive formatting**: US vs Canadian vs British vs French variations are obvious
- **Regional differences**: Canadian "eh", British "Cheerio", French "Bonjour", etc.

**Compare different predefined configurations** to see how priority changes which candidate is selected!