// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Generic editing framework for entity collections.
 * Provides CRUD operations, validation, and export/import functionality.
 * @packageDocumentation
 */

// Core interfaces and types
export * from './model';

// Validation framework
export * from './validation';

// Editable collection wrapper (thin wrapper around ValidatingResultMap)
export * from './editableCollection';

// Persisted editable collection (singleton wrapper with save pipeline)
export * from './persistedEditableCollection';

// Collection manager (collection-level CRUD operations)
export * from './collectionManager';

// Editor context (base, accepts pre-validated types)
export * from './editorContext';

// Editor context validator (wrapper for raw input)
export * from './editorContextValidator';

// Validating editor context (convenience class combining base + validator)
export * from './validatingEditorContext';

// Ingredient editing (specialized)
import * as Ingredients from './ingredients';

// Mold editing (specialized)
import * as Molds from './molds';

// Task editing (specialized)
import * as Tasks from './tasks';

// Procedure editing (specialized)
import * as Procedures from './procedures';

// Decoration editing (specialized)
import * as Decorations from './decorations';

// Filling editing (specialized)
import * as Fillings from './fillings';

export { Ingredients, Molds, Tasks, Procedures, Decorations, Fillings };
