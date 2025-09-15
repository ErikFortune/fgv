# Extended Example Configuration

This example uses the `extended-example` predefined configuration from ts-res, which demonstrates a complex multi-dimensional resource management system.

## Configuration Details

This configuration includes seven qualifiers with different priorities:

1. **Home Territory** (900) - User's home territory
2. **Current Territory** (850) - User's current location  
3. **Language** (800) - User's preferred language
4. **Market** (750) - Geographic market with hierarchical structure
5. **Role** (700) - User role (admin, agent, user, guest)
6. **Environment** (650) - Deployment environment (production, development, etc.)
7. **Currency** (600) - Currency preference (case-sensitive: USD, EUR, GBP, JPY, CNY)

## Key Features Demonstrated

### Currency Configuration
- **Case-sensitive** enumerated values (USD, EUR, GBP, JPY, CNY)
- Currency-specific formatting and symbols

### Market Hierarchy
The market qualifier uses a hierarchical structure:
```
world
├── americas
│   ├── north-america
│   ├── latin-america
│   ├── caribbean
│   ├── central-america
│   └── south-america
├── europe
│   ├── western-europe
│   ├── eastern-europe
│   ├── central-europe
│   ├── nordics
│   ├── baltic
│   └── balkans
├── asia
│   └── southeast-asia
├── africa
│   ├── north-africa
│   ├── western-africa
│   ├── eastern-africa
│   ├── central-africa
│   ├── south-africa
│   └── middle-africa
├── oceania
└── middle-east
```

### Role-Based Resources
Different interface configurations based on user roles:
- **Admin**: Full access with advanced features
- **Agent**: Customer-focused tools
- **User**: Limited self-service interface
- **Guest**: Basic access

### Environment-Specific Settings
Different configurations for various deployment environments:
- **Production**: Live environment settings
- **Development**: Debug features enabled
- **Integration**: Testing configurations
- **Test**: Automated testing settings

## Test Resources

### financial-ui.json
Currency-specific financial interface elements:
- Currency symbols and formatting
- Decimal/thousand separators
- Localized labels

### admin-dashboard.json
Role and environment-specific dashboard configurations:
- Different interfaces for each user role
- Environment-specific features (debug tools in development)

### market-specific.json
Market-based feature availability:
- Payment methods by region
- Regulatory compliance requirements  
- Language support
- Customer support hours

## Resource Visual Indicators

All resource values are clearly labeled to show which candidate was selected:

- **🌍 Icons and Emojis**: Visually distinguish different regions, roles, and currencies
- **"(DEFAULT)"** labels: Base candidates with no conditions
- **"CURRENCY:", "ROLE:", "MARKET:", "ENVIRONMENT:"** prefixes: Show which qualifier matched
- **"selectedBy" field**: Explicitly states the selection criteria
- **Distinctive text**: Each candidate has unique, recognizable content

## Testing Complex Scenarios

Watch for the visual indicators as you test these context combinations:

1. **Complex Market Context**:
   ```json
   {
     "market": "western-europe",
     "currency": "EUR", 
     "language": "fr",
     "role": "admin",
     "environment": "production"
   }
   ```
   **Look for**: "🇪🇺 WESTERN EUROPE", "€ (EURO)", "🔐 ADMIN", "FRANÇAIS"

2. **Development Environment**:
   ```json
   {
     "market": "north-america",
     "currency": "USD",
     "language": "en", 
     "role": "admin",
     "environment": "development"
   }
   ```
   **Look for**: "🇺🇸🇨🇦 NORTH AMERICA", "🛠️ DEV Debug Console"

3. **Customer Agent Context**:
   ```json
   {
     "market": "asia",
     "currency": "JPY",
     "language": "en",
     "role": "agent",
     "environment": "production"
   }
   ```
   **Look for**: "🌏 ASIA", "¥ (JAPANESE YEN)", "🎧 AGENT Support Center"

4. **Market Hierarchy Test**:
   ```json
   {
     "market": "western-europe"
   }
   ```
   **Expected**: More specific "Western Europe" candidate instead of general "Europe"

### Priority Resolution Visibility

Each resource clearly shows **which qualifier** caused it to be selected, making it easy to understand how the priority system (900→850→800→750→700→650→600) affects resolution.