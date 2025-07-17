# TS-RES Test Data

This directory contains test data for the ts-res-browser tool that demonstrates all ts-res file formats and naming conventions.

## Structure

The test data demonstrates three different JSON file formats supported by ts-res:

### 1. Simple JSON Files (Auto-converted to Resource Candidates)
Individual JSON files with plain resource values that the ImportManager automatically converts to resource candidates.

### 2. Resource Collection Format (`IResourceCollectionDecl`)
JSON files that explicitly define multiple resources with their candidates and conditions.

### 3. Resource Tree Format (`IResourceTreeRootDecl`)
JSON files that define hierarchical resource structures with nested organization.

## Directory Structure

```
src/resources/
├── strings.json                              # Resource Collection (common, errors resources)
├── app.json                                  # Resource Tree (app.config, app.ui.dashboard, app.ui.icons.* resources)
├── strings/
│   ├── common.json                           # Simple JSON → "common" resource
│   ├── common.language=es.json               # Simple JSON → "common" resource (Spanish)
│   ├── common.language=fr.json               # Simple JSON → "common" resource (French)
│   ├── language=en-US.json                   # Simple JSON → "language" resource
│   ├── dashboard.json                        # Simple JSON → "dashboard" resource
│   ├── dashboard.role=user.json              # Simple JSON → "dashboard" resource (user)
│   ├── dashboard.role=admin.json             # Simple JSON → "dashboard" resource (admin)
│   ├── dashboard.home=CA,language=fr.json    # Simple JSON → "dashboard" resource (CA+FR)
│   └── errors.json                           # Simple JSON → "errors" resource
├── config/
│   ├── app.json                              # Simple JSON → "app" resource
│   ├── app.env=development.json              # Simple JSON → "app" resource (dev)
│   └── app.platform=mobile.json             # Simple JSON → "app" resource (mobile)
├── images/
│   ├── home.json                             # Simple JSON → "home" resource
│   ├── home.density=hdpi.json                # Simple JSON → "home" resource (hdpi)
│   ├── user.json                             # Simple JSON → "user" resource
│   ├── user.density=hdpi.json                # Simple JSON → "user" resource (hdpi)
│   ├── settings.json                         # Simple JSON → "settings" resource
│   ├── settings.density=hdpi.json            # Simple JSON → "settings" resource (hdpi)
│   ├── logout.json                           # Simple JSON → "logout" resource
│   └── logout.density=hdpi.json              # Simple JSON → "logout" resource (hdpi)
├── en-US/
│   └── common.json                           # Simple JSON → "common" resource (en-US context)
├── home=CA/
│   └── common.json                           # Simple JSON → "common" resource (CA context)
└── import-config.json                        # TS-RES configuration
```

## Format Examples

### Simple JSON Format
```json
{
  "welcome": "Welcome to the application",
  "hello": "Hello",
  "goodbye": "Goodbye"
}
```
*Auto-converted to resource candidate by ImportManager*

### Resource Collection Format
```json
{
  "resources": [
    {
      "id": "common",
      "resourceTypeName": "json", 
      "candidates": [
        {
          "json": {
            "welcome": "Welcome to the application",
            "hello": "Hello"
          }
        },
        {
          "json": {
            "welcome": "Bienvenido a la aplicación", 
            "hello": "Hola"
          },
          "conditions": {
            "language": "es"
          }
        }
      ]
    }
  ]
}
```

### Resource Tree Format
```json
{
  "context": {
    "baseId": "app"
  },
  "resources": {
    "config": {
      "resourceTypeName": "json",
      "candidates": [
        {
          "json": {
            "app_name": "Sample Application",
            "version": "1.0.0"
          }
        }
      ]
    }
  },
  "children": {
    "ui": {
      "resources": {
        "dashboard": {
          "resourceTypeName": "json",
          "candidates": [
            {
              "json": {
                "title": "Dashboard",
                "overview": "Overview"
              }
            }
          ]
        }
      }
    }
  }
}
```

## Resources Generated

The test data creates these resources:

### From Simple JSON Files
- `common` (4 candidates: base, Spanish, French, directory-based)
- `dashboard` (4 candidates: base, user, admin, CA+French)
- `errors` (1 candidate: base)
- `language` (1 candidate: en-US)
- `app` (3 candidates: base, dev, mobile)
- `home`, `user`, `settings`, `logout` (2 candidates each: standard, hdpi)

### From Resource Collection (strings.json)
- `common` (3 candidates: base, Spanish, French)
- `errors` (1 candidate: base)

### From Resource Tree (app.json)
- `app.config` (3 candidates: base, dev, mobile)
- `app.ui.dashboard` (3 candidates: base, user, admin)
- `app.ui.icons.home` (2 candidates: standard, hdpi)
- `app.ui.icons.user` (2 candidates: standard, hdpi)

## Qualifiers Demonstrated

- **language**: `es`, `fr`, `en-US` (language codes)
- **homeTerritory**: `CA` (with `home=` token, optional)
- **role**: `user`, `admin` (literal values)
- **env**: `development` (literal values)
- **platform**: `mobile` (literal values)
- **density**: `hdpi` (literal values)

## Import Configuration

The `import-config.json` file defines:
- **Qualifier Types**: language, territory, literal
- **Qualifiers**: language, homeTerritory, currentTerritory, role, env, platform, density
- **Resource Types**: json

## Usage

This test data demonstrates:

1. **Simple JSON Import**: Basic file-to-resource conversion
2. **Resource Collections**: Multiple resources with candidates in one file
3. **Resource Trees**: Hierarchical organization with nested resources
4. **Qualifier Parsing**: File-based and explicit condition formats
5. **Multi-condition Resources**: Complex qualifier combinations
6. **Directory-based Organization**: Conditional directories
7. **Mixed Formats**: Using different formats together

The data follows ts-res patterns and provides comprehensive examples for testing all browser tool features. 