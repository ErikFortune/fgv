[Home](../README.md) > ImportView

# Variable: ImportView

ImportView component for importing resource files, directories, and bundles.

Provides a drag-and-drop interface for importing various resource formats including
individual JSON files, directory structures, ZIP archives, and pre-compiled bundles.
Automatically detects file types and processes them appropriately.

**Key Features:**
- **Drag-and-drop import**: Simple drag-and-drop interface for file import
- **Multiple format support**: JSON files, directories, ZIP archives, and bundles
- **Auto-detection**: Automatically detects and processes different file types
- **Bundle processing**: Handles pre-compiled ts-res bundles
- **ZIP archive support**: Extracts and processes ZIP-based resource collections
- **Progress tracking**: Visual feedback during import operations
- **Error handling**: Clear error messages for unsupported or corrupted files

## Type

`React.FC<IImportViewProps>`
