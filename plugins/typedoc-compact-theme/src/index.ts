/**
 * TypeDoc Compact Theme
 *
 * Renders API documentation in a compact HTML table format similar to api-documenter.
 * Uses TypeDoc's project model directly, bypassing the theme partial system for
 * complete control over output format.
 *
 * Properties table: Property | Modifiers | Type | Description (includes accessors)
 * Methods table: Method | Modifiers | Description
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Application,
  Context,
  Converter,
  DeclarationReflection,
  ParameterType,
  ProjectReflection,
  Reflection,
  ReflectionKind,
  SignatureReflection,
  CommentDisplayPart
} from 'typedoc';

/**
 * Options for the compact markdown renderer.
 */
interface ICompactMarkdownOptions {
  /**
   * If true, generate separate detail pages for inherited members.
   * If false (default), inherited members link to the defining class's page.
   */
  includeInheritedMemberPages: boolean;
}

/**
 * Represents a member for rendering.
 */
interface IMemberInfo {
  name: string;
  kind: ReflectionKind;
  modifiers: string[];
  type: string;
  description: string;
  signature?: string;
  anchor: string;
}

/**
 * URL info for a documented type.
 */
interface IUrlInfo {
  url: string;
  kind: ReflectionKind;
}

/**
 * Renders a class or interface to markdown.
 */
class CompactMarkdownRenderer {
  private _outputDir: string;
  private _options: ICompactMarkdownOptions;
  private _urlMap: Map<string, IUrlInfo> = new Map();
  private _currentFilePath: string = '';

  constructor(outputDir: string, options: ICompactMarkdownOptions) {
    this._outputDir = outputDir;
    this._options = options;
  }

  /**
   * Render the entire project.
   */
  public renderProject(project: ProjectReflection): void {
    // Clear and recreate output directory to remove stale files
    if (fs.existsSync(this._outputDir)) {
      fs.rmSync(this._outputDir, { recursive: true });
    }
    fs.mkdirSync(this._outputDir, { recursive: true });

    // First pass: build URL map for all types
    this._buildUrlMap(project, '');

    // Render index
    this._renderIndex(project);

    // Recursively render all declarations
    this._renderChildren(project, '');
  }

  /**
   * Build URL map for all documented types.
   */
  private _buildUrlMap(parent: Reflection, basePath: string): void {
    if (!(parent instanceof DeclarationReflection) && !(parent instanceof ProjectReflection)) {
      return;
    }

    const children = parent.children ?? [];

    for (const child of children) {
      const name = child.name;
      let subdir = '';
      let shouldIndex = true;

      if (child.kind === ReflectionKind.Class) {
        subdir = 'classes';
      } else if (child.kind === ReflectionKind.Interface) {
        subdir = 'interfaces';
      } else if (child.kind === ReflectionKind.Enum) {
        subdir = 'enums';
      } else if (child.kind === ReflectionKind.TypeAlias) {
        subdir = 'type-aliases';
      } else if (child.kind === ReflectionKind.Function) {
        subdir = 'functions';
      } else if (child.kind === ReflectionKind.Variable) {
        subdir = 'variables';
      } else if (child.kind === ReflectionKind.Namespace || child.kind === ReflectionKind.Module) {
        // Recurse into namespaces
        const nsPath = path.join(basePath, this._sanitizeName(child.name));
        this._buildUrlMap(child, nsPath);
        shouldIndex = false;
      } else {
        shouldIndex = false;
      }

      if (shouldIndex && subdir) {
        const url = path.join(basePath, subdir, `${this._sanitizeName(name)}.md`);
        this._urlMap.set(name, { url, kind: child.kind });

        // Also index with full path for namespaced types
        if (basePath) {
          const fullName = basePath.replace(/\//g, '.') + '.' + name;
          this._urlMap.set(fullName, { url, kind: child.kind });
        }
      }

      // Recurse into children for nested types
      this._buildUrlMap(child, basePath);
    }
  }

  private _renderChildren(parent: Reflection, basePath: string): void {
    if (!(parent instanceof DeclarationReflection) && !(parent instanceof ProjectReflection)) {
      return;
    }

    const children = parent.children ?? [];

    for (const child of children) {
      if (child.kind === ReflectionKind.Class || child.kind === ReflectionKind.Interface) {
        this._renderClassOrInterface(child, basePath);
      } else if (child.kind === ReflectionKind.Namespace || child.kind === ReflectionKind.Module) {
        // Create subdirectory for namespace and render its index
        const nsPath = path.join(basePath, this._sanitizeName(child.name));
        this._renderNamespaceIndex(child, nsPath);
        this._renderChildren(child, nsPath);
      } else if (child.kind === ReflectionKind.Enum) {
        this._renderEnum(child, basePath);
      } else if (child.kind === ReflectionKind.TypeAlias) {
        this._renderTypeAlias(child, basePath);
      } else if (child.kind === ReflectionKind.Function) {
        this._renderFunction(child, basePath);
      } else if (child.kind === ReflectionKind.Variable) {
        this._renderVariable(child, basePath);
      }

      // Recurse into children
      this._renderChildren(child, basePath);
    }
  }

  private _renderIndex(project: ProjectReflection): void {
    this._setCurrentFile('README.md');

    const lines: string[] = [];
    lines.push(`# ${project.name}`);
    lines.push('');

    if (project.comment?.summary) {
      lines.push(this._getCommentText(project.comment.summary));
      lines.push('');
    }

    // Find namespaces/modules first
    const namespaces = this._findByKind(project, ReflectionKind.Namespace);
    const modules = this._findByKind(project, ReflectionKind.Module);
    const allNamespaces = [...namespaces, ...modules];

    if (allNamespaces.length > 0) {
      lines.push('## Namespaces');
      lines.push('');
      lines.push(this._renderIndexTable(allNamespaces, (n) => `./${this._sanitizeName(n.name)}/README.md`));
      lines.push('');
    }

    // List all top-level exports
    const classes = this._findByKind(project, ReflectionKind.Class);
    const interfaces = this._findByKind(project, ReflectionKind.Interface);
    const enums = this._findByKind(project, ReflectionKind.Enum);
    const typeAliases = this._findByKind(project, ReflectionKind.TypeAlias);
    const functions = this._findByKind(project, ReflectionKind.Function);
    const variables = this._findByKind(project, ReflectionKind.Variable);

    if (classes.length > 0) {
      lines.push('## Classes');
      lines.push('');
      lines.push(this._renderIndexTable(classes, (c) => `./classes/${this._sanitizeName(c.name)}.md`));
      lines.push('');
    }

    if (interfaces.length > 0) {
      lines.push('## Interfaces');
      lines.push('');
      lines.push(this._renderIndexTable(interfaces, (i) => `./interfaces/${this._sanitizeName(i.name)}.md`));
      lines.push('');
    }

    if (enums.length > 0) {
      lines.push('## Enums');
      lines.push('');
      lines.push(this._renderIndexTable(enums, (e) => `./enums/${this._sanitizeName(e.name)}.md`));
      lines.push('');
    }

    if (typeAliases.length > 0) {
      lines.push('## Type Aliases');
      lines.push('');
      lines.push(
        this._renderIndexTable(typeAliases, (t) => `./type-aliases/${this._sanitizeName(t.name)}.md`)
      );
      lines.push('');
    }

    if (functions.length > 0) {
      lines.push('## Functions');
      lines.push('');
      lines.push(this._renderIndexTable(functions, (f) => `./functions/${this._sanitizeName(f.name)}.md`));
      lines.push('');
    }

    if (variables.length > 0) {
      lines.push('## Variables');
      lines.push('');
      lines.push(this._renderIndexTable(variables, (v) => `./variables/${this._sanitizeName(v.name)}.md`));
      lines.push('');
    }

    const indexPath = path.join(this._outputDir, 'README.md');
    fs.writeFileSync(indexPath, lines.join('\n'));
  }

  /**
   * Render an index table for a list of declarations.
   */
  private _renderIndexTable(
    items: DeclarationReflection[],
    urlFn: (item: DeclarationReflection) => string
  ): string {
    const lines: string[] = [];

    lines.push('<table><thead><tr><th>');
    lines.push('');
    lines.push('Name');
    lines.push('');
    lines.push('</th><th>');
    lines.push('');
    lines.push('Description');
    lines.push('');
    lines.push('</th></tr></thead>');
    lines.push('<tbody>');

    for (const item of items) {
      const url = urlFn(item);
      const desc = this._getItemDescription(item);

      lines.push('<tr><td>');
      lines.push('');
      lines.push(`[${item.name}](${url})`);
      lines.push('');
      lines.push('</td><td>');
      lines.push('');
      lines.push(desc);
      lines.push('');
      lines.push('</td></tr>');
    }

    lines.push('</tbody></table>');
    return lines.join('\n');
  }

  /**
   * Get description for an item (first line of comment or signature comment).
   */
  private _getItemDescription(item: DeclarationReflection): string {
    // Try item's own comment
    if (item.comment?.summary) {
      return this._getFirstLine(this._getCommentText(item.comment.summary));
    }

    // For functions, try signature comment
    const sig = item.signatures?.[0];
    if (sig?.comment?.summary) {
      return this._getFirstLine(this._getCommentText(sig.comment.summary));
    }

    // For accessors, try getter/setter comment
    if (item.getSignature?.comment?.summary) {
      return this._getFirstLine(this._getCommentText(item.getSignature.comment.summary));
    }

    return '';
  }

  /**
   * Get the first line/sentence of a description.
   */
  private _getFirstLine(text: string): string {
    // Split on period followed by space or newline
    const firstSentence = text.split(/\.\s|\.\n/)[0];
    if (firstSentence && firstSentence !== text) {
      return firstSentence + '.';
    }
    // If no period, take first line
    const firstLine = text.split('\n')[0];
    return firstLine.trim();
  }

  /**
   * Render an index page for a namespace/module.
   */
  private _renderNamespaceIndex(ns: DeclarationReflection, nsPath: string): void {
    const filePath = path.join(nsPath, 'README.md');
    this._setCurrentFile(filePath);

    const lines: string[] = [];
    const kindName = ns.kind === ReflectionKind.Namespace ? 'Namespace' : 'Module';

    // Breadcrumb - nsPath includes this namespace, file is at nsPath/README.md
    // We need to go up one level more than pathParts length to reach root
    const pathParts = nsPath.split('/').filter((p) => p);
    const depth = pathParts.length;
    const homePrefix = '../'.repeat(depth);

    const breadcrumbParts: string[] = [`[Home](${homePrefix}README.md)`];

    // Add parent namespaces (all but the last one)
    for (let i = 0; i < pathParts.length - 1; i++) {
      const levelsUp = depth - (i + 1);
      const nsPrefix = '../'.repeat(levelsUp);
      breadcrumbParts.push(`[${pathParts[i]}](${nsPrefix}README.md)`);
    }

    // Current namespace (not linked)
    breadcrumbParts.push(ns.name);
    lines.push(breadcrumbParts.join(' > '));
    lines.push('');

    lines.push(`# ${kindName}: ${ns.name}`);
    lines.push('');

    if (ns.comment?.summary) {
      lines.push(this._getCommentText(ns.comment.summary));
      lines.push('');
    }

    // Collect children by kind
    const children = ns.children ?? [];
    const childNamespaces = children.filter(
      (c) => c.kind === ReflectionKind.Namespace || c.kind === ReflectionKind.Module
    );
    const classes = children.filter((c) => c.kind === ReflectionKind.Class);
    const interfaces = children.filter((c) => c.kind === ReflectionKind.Interface);
    const enums = children.filter((c) => c.kind === ReflectionKind.Enum);
    const typeAliases = children.filter((c) => c.kind === ReflectionKind.TypeAlias);
    const functions = children.filter((c) => c.kind === ReflectionKind.Function);
    const variables = children.filter((c) => c.kind === ReflectionKind.Variable);

    if (childNamespaces.length > 0) {
      lines.push('## Namespaces');
      lines.push('');
      lines.push(this._renderIndexTable(childNamespaces, (n) => `./${this._sanitizeName(n.name)}/README.md`));
      lines.push('');
    }

    if (classes.length > 0) {
      lines.push('## Classes');
      lines.push('');
      lines.push(this._renderIndexTable(classes, (c) => `./classes/${this._sanitizeName(c.name)}.md`));
      lines.push('');
    }

    if (interfaces.length > 0) {
      lines.push('## Interfaces');
      lines.push('');
      lines.push(this._renderIndexTable(interfaces, (i) => `./interfaces/${this._sanitizeName(i.name)}.md`));
      lines.push('');
    }

    if (enums.length > 0) {
      lines.push('## Enums');
      lines.push('');
      lines.push(this._renderIndexTable(enums, (e) => `./enums/${this._sanitizeName(e.name)}.md`));
      lines.push('');
    }

    if (typeAliases.length > 0) {
      lines.push('## Type Aliases');
      lines.push('');
      lines.push(
        this._renderIndexTable(typeAliases, (t) => `./type-aliases/${this._sanitizeName(t.name)}.md`)
      );
      lines.push('');
    }

    if (functions.length > 0) {
      lines.push('## Functions');
      lines.push('');
      lines.push(this._renderIndexTable(functions, (f) => `./functions/${this._sanitizeName(f.name)}.md`));
      lines.push('');
    }

    if (variables.length > 0) {
      lines.push('## Variables');
      lines.push('');
      lines.push(this._renderIndexTable(variables, (v) => `./variables/${this._sanitizeName(v.name)}.md`));
      lines.push('');
    }

    // Ensure directory exists
    const outDir = path.join(this._outputDir, nsPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outPath = path.join(this._outputDir, filePath);
    fs.writeFileSync(outPath, lines.join('\n'));
  }

  private _renderClassOrInterface(decl: DeclarationReflection, basePath: string): void {
    const lines: string[] = [];
    const kindName = decl.kind === ReflectionKind.Class ? 'Class' : 'Interface';

    // Set current file for relative URL computation
    const subdir = decl.kind === ReflectionKind.Class ? 'classes' : 'interfaces';
    const filePath = path.join(basePath, subdir, `${this._sanitizeName(decl.name)}.md`);
    this._setCurrentFile(filePath);

    // Breadcrumb
    lines.push(this._generateBreadcrumb(basePath, decl.name, subdir));
    lines.push('');

    // Header
    lines.push(`# ${kindName}: ${decl.name}`);
    lines.push('');

    // Description
    if (decl.comment?.summary) {
      lines.push(this._getCommentText(decl.comment.summary));
      lines.push('');
    }

    // Extends and Implements on single lines with links
    if (decl.extendedTypes && decl.extendedTypes.length > 0) {
      const extList = decl.extendedTypes.map((t) => this._linkTypeInline(t.toString())).join(', ');
      lines.push(`**Extends:** ${extList}`);
      lines.push('');
    }

    if (decl.implementedTypes && decl.implementedTypes.length > 0) {
      const implList = decl.implementedTypes.map((t) => this._linkTypeInline(t.toString())).join(', ');
      lines.push(`**Implements:** ${implList}`);
      lines.push('');
    }

    // Collect members by category
    const children = decl.children ?? [];
    const constructors = children.filter((c) => c.kind === ReflectionKind.Constructor);
    const properties = children.filter((c) => c.kind === ReflectionKind.Property);
    const accessors = children.filter((c) => c.kind === ReflectionKind.Accessor);
    const methods = children.filter((c) => c.kind === ReflectionKind.Method);

    // Member detail pages base path
    const memberBasePath = path.join(basePath, subdir);

    // Render constructors
    if (constructors.length > 0) {
      lines.push('## Constructors');
      lines.push('');
      lines.push(this._renderConstructorsTable(constructors, decl.name, memberBasePath));
      lines.push('');
    }

    // Render properties + accessors combined
    const allProperties = [...properties, ...accessors];
    if (allProperties.length > 0) {
      lines.push('## Properties');
      lines.push('');
      lines.push(this._renderPropertiesTable(allProperties, decl.name, memberBasePath));
      lines.push('');

      // Render property detail pages (optionally skip inherited members)
      for (const prop of allProperties) {
        if (this._options.includeInheritedMemberPages || !prop.inheritedFrom) {
          this._renderPropertyDetailPage(prop, decl, memberBasePath);
        }
      }
    }

    // Render methods
    if (methods.length > 0) {
      lines.push('## Methods');
      lines.push('');
      lines.push(this._renderMethodsTable(methods, decl.name, memberBasePath));
      lines.push('');

      // Render method detail pages (optionally skip inherited members)
      for (const method of methods) {
        if (this._options.includeInheritedMemberPages || !method.inheritedFrom) {
          this._renderMethodDetailPage(method, decl, memberBasePath);
        }
      }
    }

    // Write file
    const outDir = path.join(this._outputDir, basePath, subdir);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, `${this._sanitizeName(decl.name)}.md`);
    fs.writeFileSync(outPath, lines.join('\n'));
  }

  /**
   * Render a detail page for a property or accessor.
   */
  private _renderPropertyDetailPage(
    prop: DeclarationReflection,
    parent: DeclarationReflection,
    basePath: string
  ): void {
    const fileName = `${this._sanitizeName(parent.name)}.${this._sanitizeName(prop.name)}.md`;
    const filePath = path.join(basePath, fileName);
    this._setCurrentFile(filePath);

    const lines: string[] = [];
    const kindLabel = prop.kind === ReflectionKind.Accessor ? 'property' : 'property';

    // Breadcrumb: extract namespace path from basePath (which is like "Namespace/classes")
    const pathParts = basePath.split('/').filter((p) => p);
    const subdir = pathParts.pop(); // Remove "classes" or "interfaces"
    const namespacePath = pathParts.join('/');

    // Generate breadcrumb with linked parent class
    const breadcrumbParts: string[] = [];
    const depth = pathParts.length + 1; // +1 for subdir

    breadcrumbParts.push(`[Home](${'../'.repeat(depth)}README.md)`);

    // Add namespace parts
    for (let i = 0; i < pathParts.length; i++) {
      const levelsUp = depth - (i + 1);
      breadcrumbParts.push(`[${pathParts[i]}](${'../'.repeat(levelsUp)}README.md)`);
    }

    // Add linked parent class
    breadcrumbParts.push(`[${parent.name}](./${this._sanitizeName(parent.name)}.md)`);

    // Add current property (unlinked)
    breadcrumbParts.push(prop.name);

    lines.push(breadcrumbParts.join(' > '));
    lines.push('');

    // Header
    lines.push(`## ${parent.name}.${prop.name} ${kindLabel}`);
    lines.push('');

    // Description
    let description = '';
    if (prop.kind === ReflectionKind.Accessor) {
      const getter = prop.getSignature;
      const setter = prop.setSignature;
      if (getter?.comment?.summary) {
        description = this._getCommentText(getter.comment.summary);
      } else if (setter?.comment?.summary) {
        description = this._getCommentText(setter.comment.summary);
      }
    } else if (prop.comment?.summary) {
      description = this._getCommentText(prop.comment.summary);
    }

    if (description) {
      lines.push(description);
      lines.push('');
    }

    // Signature
    lines.push('**Signature:**');
    lines.push('');
    lines.push('```typescript');
    lines.push(this._getPropertySignature(prop));
    lines.push('```');
    lines.push('');

    // Write file
    const outDir = path.join(this._outputDir, basePath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(this._outputDir, filePath);
    fs.writeFileSync(outPath, lines.join('\n'));
  }

  /**
   * Render a detail page for a method.
   */
  private _renderMethodDetailPage(
    method: DeclarationReflection,
    parent: DeclarationReflection,
    basePath: string
  ): void {
    const fileName = `${this._sanitizeName(parent.name)}.${this._sanitizeName(method.name)}.md`;
    const filePath = path.join(basePath, fileName);
    this._setCurrentFile(filePath);

    const lines: string[] = [];

    // Breadcrumb: extract namespace path from basePath (which is like "Namespace/classes")
    const pathParts = basePath.split('/').filter((p) => p);
    pathParts.pop(); // Remove "classes" or "interfaces"

    // Generate breadcrumb with linked parent class
    const breadcrumbParts: string[] = [];
    const depth = pathParts.length + 1; // +1 for subdir

    breadcrumbParts.push(`[Home](${'../'.repeat(depth)}README.md)`);

    // Add namespace parts
    for (let i = 0; i < pathParts.length; i++) {
      const levelsUp = depth - (i + 1);
      breadcrumbParts.push(`[${pathParts[i]}](${'../'.repeat(levelsUp)}README.md)`);
    }

    // Add linked parent class
    breadcrumbParts.push(`[${parent.name}](./${this._sanitizeName(parent.name)}.md)`);

    // Add current method (unlinked)
    breadcrumbParts.push(method.name);

    lines.push(breadcrumbParts.join(' > '));
    lines.push('');

    // Header
    lines.push(`## ${parent.name}.${method.name}() method`);
    lines.push('');

    // Description from signature
    const sig = method.signatures?.[0];
    if (sig?.comment?.summary) {
      lines.push(this._getCommentText(sig.comment.summary));
      lines.push('');
    }

    // Signature
    lines.push('**Signature:**');
    lines.push('');
    lines.push('```typescript');
    lines.push(this._getMethodSignature(method));
    lines.push('```');
    lines.push('');

    // Parameters
    if (sig?.parameters && sig.parameters.length > 0) {
      lines.push('**Parameters:**');
      lines.push('');
      lines.push('<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>');
      lines.push('<tbody>');
      for (const param of sig.parameters) {
        const paramType = param.type?.toString() ?? 'unknown';
        const paramDesc = param.comment?.summary ? this._getCommentText(param.comment.summary) : '';
        lines.push(
          `<tr><td>${param.name}</td><td>${this._escapeHtml(paramType)}</td><td>${paramDesc}</td></tr>`
        );
      }
      lines.push('</tbody></table>');
      lines.push('');
    }

    // Returns
    if (sig?.type) {
      lines.push('**Returns:**');
      lines.push('');
      lines.push(`${this._linkType(sig.type.toString())}`);
      if (sig.comment?.blockTags) {
        const returnsTag = sig.comment.blockTags.find((t) => t.tag === '@returns');
        if (returnsTag?.content) {
          lines.push('');
          lines.push(this._getCommentText(returnsTag.content));
        }
      }
      lines.push('');
    }

    // Write file
    const outDir = path.join(this._outputDir, basePath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(this._outputDir, filePath);
    fs.writeFileSync(outPath, lines.join('\n'));
  }

  /**
   * Get signature string for a property.
   */
  private _getPropertySignature(prop: DeclarationReflection): string {
    const modifiers: string[] = [];
    if (prop.flags?.isReadonly) modifiers.push('readonly');
    if (prop.flags?.isStatic) modifiers.push('static');

    let typeStr = '';
    if (prop.kind === ReflectionKind.Accessor) {
      const getter = prop.getSignature;
      const setter = prop.setSignature;
      if (getter?.type) {
        typeStr = getter.type.toString();
      } else if (setter?.parameters?.[0]?.type) {
        typeStr = setter.parameters[0].type.toString();
      }
      if (getter && !setter) modifiers.push('readonly');
    } else {
      typeStr = prop.type?.toString() ?? 'unknown';
    }

    const modStr = modifiers.length > 0 ? modifiers.join(' ') + ' ' : '';
    return `${modStr}${prop.name}: ${typeStr};`;
  }

  /**
   * Get signature string for a method.
   */
  private _getMethodSignature(method: DeclarationReflection): string {
    const sig = method.signatures?.[0];
    if (!sig) return `${method.name}(): unknown;`;

    const modifiers: string[] = [];
    if (method.flags?.isStatic) modifiers.push('static');

    const params =
      sig.parameters
        ?.map((p) => {
          const optional = p.flags?.isOptional ? '?' : '';
          return `${p.name}${optional}: ${p.type?.toString() ?? 'unknown'}`;
        })
        .join(', ') ?? '';

    const returnType = sig.type?.toString() ?? 'void';
    const modStr = modifiers.length > 0 ? modifiers.join(' ') + ' ' : '';

    return `${modStr}${method.name}(${params}): ${returnType};`;
  }

  private _renderEnum(decl: DeclarationReflection, basePath: string): void {
    const lines: string[] = [];

    // Breadcrumb
    lines.push(this._generateBreadcrumb(basePath, decl.name, 'enums'));
    lines.push('');

    lines.push(`# Enum: ${decl.name}`);
    lines.push('');

    if (decl.comment?.summary) {
      lines.push(this._getCommentText(decl.comment.summary));
      lines.push('');
    }

    const members = decl.children ?? [];
    if (members.length > 0) {
      lines.push('## Members');
      lines.push('');
      lines.push('<table><thead><tr><th>');
      lines.push('');
      lines.push('Member');
      lines.push('');
      lines.push('</th><th>');
      lines.push('');
      lines.push('Value');
      lines.push('');
      lines.push('</th><th>');
      lines.push('');
      lines.push('Description');
      lines.push('');
      lines.push('</th></tr></thead>');
      lines.push('<tbody>');

      for (const member of members) {
        const value = member.type?.toString() ?? '';
        const desc = member.comment?.summary ? this._getCommentText(member.comment.summary) : '';
        lines.push('<tr><td>');
        lines.push('');
        lines.push(`\`${member.name}\``);
        lines.push('');
        lines.push('</td><td>');
        lines.push('');
        lines.push(value);
        lines.push('');
        lines.push('</td><td>');
        lines.push('');
        lines.push(desc);
        lines.push('');
        lines.push('</td></tr>');
      }

      lines.push('</tbody></table>');
      lines.push('');
    }

    const outDir = path.join(this._outputDir, basePath, 'enums');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, `${this._sanitizeName(decl.name)}.md`);
    fs.writeFileSync(outPath, lines.join('\n'));
  }

  private _renderTypeAlias(decl: DeclarationReflection, basePath: string): void {
    const lines: string[] = [];

    // Breadcrumb
    lines.push(this._generateBreadcrumb(basePath, decl.name, 'type-aliases'));
    lines.push('');

    lines.push(`# Type Alias: ${decl.name}`);
    lines.push('');

    if (decl.comment?.summary) {
      lines.push(this._getCommentText(decl.comment.summary));
      lines.push('');
    }

    if (decl.type) {
      lines.push('## Type');
      lines.push('');
      lines.push('```typescript');
      lines.push(`type ${decl.name} = ${decl.type.toString()}`);
      lines.push('```');
      lines.push('');
    }

    const outDir = path.join(this._outputDir, basePath, 'type-aliases');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, `${this._sanitizeName(decl.name)}.md`);
    fs.writeFileSync(outPath, lines.join('\n'));
  }

  private _renderFunction(decl: DeclarationReflection, basePath: string): void {
    const lines: string[] = [];

    // Breadcrumb
    lines.push(this._generateBreadcrumb(basePath, decl.name, 'functions'));
    lines.push('');

    lines.push(`# Function: ${decl.name}`);
    lines.push('');

    const sig = decl.signatures?.[0];
    if (sig?.comment?.summary) {
      lines.push(this._getCommentText(sig.comment.summary));
      lines.push('');
    }

    if (sig) {
      lines.push('## Signature');
      lines.push('');
      lines.push('```typescript');
      lines.push(this._renderSignature(decl.name, sig));
      lines.push('```');
      lines.push('');
    }

    const outDir = path.join(this._outputDir, basePath, 'functions');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, `${this._sanitizeName(decl.name)}.md`);
    fs.writeFileSync(outPath, lines.join('\n'));
  }

  private _renderVariable(decl: DeclarationReflection, basePath: string): void {
    const lines: string[] = [];

    // Breadcrumb
    lines.push(this._generateBreadcrumb(basePath, decl.name, 'variables'));
    lines.push('');

    lines.push(`# Variable: ${decl.name}`);
    lines.push('');

    if (decl.comment?.summary) {
      lines.push(this._getCommentText(decl.comment.summary));
      lines.push('');
    }

    if (decl.type) {
      lines.push('## Type');
      lines.push('');
      lines.push(`\`${decl.type.toString()}\``);
      lines.push('');
    }

    const outDir = path.join(this._outputDir, basePath, 'variables');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, `${this._sanitizeName(decl.name)}.md`);
    fs.writeFileSync(outPath, lines.join('\n'));
  }

  private _renderConstructorsTable(
    constructors: DeclarationReflection[],
    _parentName: string,
    _basePath: string
  ): string {
    const lines: string[] = [];

    lines.push('<table><thead><tr><th>');
    lines.push('');
    lines.push('Constructor');
    lines.push('');
    lines.push('</th><th>');
    lines.push('');
    lines.push('Modifiers');
    lines.push('');
    lines.push('</th><th>');
    lines.push('');
    lines.push('Description');
    lines.push('');
    lines.push('</th></tr></thead>');
    lines.push('<tbody>');

    for (const ctor of constructors) {
      const sig = ctor.signatures?.[0];
      const params = sig?.parameters?.map((p) => p.name).join(', ') ?? '';
      const ctorSig = `constructor(${params})`;

      const modifiers: string[] = [];
      if (ctor.flags?.isProtected) modifiers.push('protected');
      if (ctor.flags?.isPrivate) modifiers.push('private');

      const desc = sig?.comment?.summary ? this._getCommentText(sig.comment.summary) : '';

      lines.push('<tr><td>');
      lines.push('');
      lines.push(`\`${ctorSig}\``);
      lines.push('');
      lines.push('</td><td>');
      lines.push('');
      lines.push(modifiers.map((m) => `\`${m}\``).join(' '));
      lines.push('');
      lines.push('</td><td>');
      lines.push('');
      lines.push(desc);
      lines.push('');
      lines.push('</td></tr>');
    }

    lines.push('</tbody></table>');
    return lines.join('\n');
  }

  private _renderPropertiesTable(
    members: DeclarationReflection[],
    parentName: string,
    _basePath: string
  ): string {
    const lines: string[] = [];

    lines.push('<table><thead><tr><th>');
    lines.push('');
    lines.push('Property');
    lines.push('');
    lines.push('</th><th>');
    lines.push('');
    lines.push('Modifiers');
    lines.push('');
    lines.push('</th><th>');
    lines.push('');
    lines.push('Type');
    lines.push('');
    lines.push('</th><th>');
    lines.push('');
    lines.push('Description');
    lines.push('');
    lines.push('</th></tr></thead>');
    lines.push('<tbody>');

    for (const member of members) {
      if (member.kind === ReflectionKind.Accessor) {
        lines.push(this._renderAccessorRow(member, parentName));
      } else {
        lines.push(this._renderPropertyRow(member, parentName));
      }
    }

    lines.push('</tbody></table>');
    return lines.join('\n');
  }

  private _renderPropertyRow(prop: DeclarationReflection, parentName: string): string {
    const typeStr = prop.type?.toString() ?? '';

    const modifiers: string[] = [];
    if (prop.flags?.isReadonly) modifiers.push('readonly');
    if (prop.flags?.isProtected) modifiers.push('protected');
    if (prop.flags?.isPrivate) modifiers.push('private');
    if (prop.flags?.isStatic) modifiers.push('static');

    const desc = prop.comment?.summary ? this._getFirstLine(this._getCommentText(prop.comment.summary)) : '';

    // For inherited members, link to the defining class's detail page (unless includeInheritedMemberPages is true)
    const definingClass =
      !this._options.includeInheritedMemberPages && prop.inheritedFrom
        ? this._sanitizeName(prop.inheritedFrom.reflection?.parent?.name ?? parentName)
        : parentName;
    const detailUrl = `./${this._sanitizeName(definingClass)}.${this._sanitizeName(prop.name)}.md`;

    return this._formatTableRow(prop.name, modifiers, typeStr, desc, detailUrl);
  }

  private _renderAccessorRow(accessor: DeclarationReflection, parentName: string): string {
    const getter = accessor.getSignature;
    const setter = accessor.setSignature;

    let typeStr = '';
    if (getter?.type) {
      typeStr = getter.type.toString();
    } else if (setter?.parameters?.[0]?.type) {
      typeStr = setter.parameters[0].type.toString();
    }

    const modifiers: string[] = [];
    if (getter && !setter) modifiers.push('readonly');
    if (accessor.flags?.isProtected) modifiers.push('protected');
    if (accessor.flags?.isPrivate) modifiers.push('private');
    if (accessor.flags?.isStatic) modifiers.push('static');

    let desc = '';
    if (getter?.comment?.summary) {
      desc = this._getFirstLine(this._getCommentText(getter.comment.summary));
    } else if (setter?.comment?.summary) {
      desc = this._getFirstLine(this._getCommentText(setter.comment.summary));
    }

    // For inherited members, link to the defining class's detail page (unless includeInheritedMemberPages is true)
    const definingClass =
      !this._options.includeInheritedMemberPages && accessor.inheritedFrom
        ? this._sanitizeName(accessor.inheritedFrom.reflection?.parent?.name ?? parentName)
        : parentName;
    const detailUrl = `./${this._sanitizeName(definingClass)}.${this._sanitizeName(accessor.name)}.md`;

    return this._formatTableRow(accessor.name, modifiers, typeStr, desc, detailUrl);
  }

  private _formatTableRow(
    name: string,
    modifiers: string[],
    type: string,
    description: string,
    detailUrl?: string
  ): string {
    const linkedType = this._linkType(type);
    const modifierStr = modifiers.map((m) => `\`${m}\``).join(' ');

    // Create linked name if detail URL provided
    const nameDisplay = detailUrl ? `[${name}](${detailUrl})` : `\`${name}\``;

    const lines: string[] = [];
    lines.push('<tr><td>');
    lines.push('');
    lines.push(nameDisplay);
    lines.push('');
    lines.push('</td><td>');
    lines.push('');
    lines.push(modifierStr);
    lines.push('');
    lines.push('</td><td>');
    lines.push('');
    lines.push(linkedType);
    lines.push('');
    lines.push('</td><td>');
    lines.push('');
    lines.push(description);
    lines.push('');
    lines.push('</td></tr>');

    return lines.join('\n');
  }

  private _renderMethodsTable(
    methods: DeclarationReflection[],
    parentName: string,
    _basePath: string
  ): string {
    const lines: string[] = [];

    lines.push('<table><thead><tr><th>');
    lines.push('');
    lines.push('Method');
    lines.push('');
    lines.push('</th><th>');
    lines.push('');
    lines.push('Modifiers');
    lines.push('');
    lines.push('</th><th>');
    lines.push('');
    lines.push('Description');
    lines.push('');
    lines.push('</th></tr></thead>');
    lines.push('<tbody>');

    for (const method of methods) {
      const sig = method.signatures?.[0];
      const params = sig?.parameters?.map((p) => p.name).join(', ') ?? '';
      const methodSig = `${method.name}(${params})`;

      const modifiers: string[] = [];
      if (method.flags?.isProtected) modifiers.push('protected');
      if (method.flags?.isPrivate) modifiers.push('private');
      if (method.flags?.isStatic) modifiers.push('static');

      const desc = sig?.comment?.summary ? this._getFirstLine(this._getCommentText(sig.comment.summary)) : '';

      // For inherited members, link to the defining class's detail page (unless includeInheritedMemberPages is true)
      const definingClass =
        !this._options.includeInheritedMemberPages && method.inheritedFrom
          ? this._sanitizeName(method.inheritedFrom.reflection?.parent?.name ?? parentName)
          : parentName;
      const detailUrl = `./${this._sanitizeName(definingClass)}.${this._sanitizeName(method.name)}.md`;

      lines.push('<tr><td>');
      lines.push('');
      lines.push(`[${methodSig}](${detailUrl})`);
      lines.push('');
      lines.push('</td><td>');
      lines.push('');
      lines.push(modifiers.map((m) => `\`${m}\``).join(' '));
      lines.push('');
      lines.push('</td><td>');
      lines.push('');
      lines.push(desc);
      lines.push('');
      lines.push('</td></tr>');
    }

    lines.push('</tbody></table>');
    return lines.join('\n');
  }

  private _renderSignature(name: string, sig: SignatureReflection): string {
    const params =
      sig.parameters?.map((p) => `${p.name}: ${p.type?.toString() ?? 'unknown'}`).join(', ') ?? '';
    const returnType = sig.type?.toString() ?? 'void';
    return `function ${name}(${params}): ${returnType}`;
  }

  /**
   * Find direct children of a specific kind (no recursion into namespaces).
   */
  private _findByKind(parent: Reflection, kind: ReflectionKind): DeclarationReflection[] {
    if (!(parent instanceof DeclarationReflection) && !(parent instanceof ProjectReflection)) {
      return [];
    }
    return (parent.children ?? []).filter((child) => child.kind === kind);
  }

  private _sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Generate breadcrumb navigation for a page.
   * @param basePath - The namespace path (e.g., "LibraryRuntime/Indexers")
   * @param currentName - The name of the current item
   * @param subdir - The subdirectory within the namespace (e.g., "classes", "interfaces")
   */
  private _generateBreadcrumb(basePath: string, currentName: string, subdir?: string): string {
    const parts: string[] = [];

    // Calculate how many levels deep we are
    const pathParts = basePath ? basePath.split('/').filter((p) => p) : [];
    const subdirDepth = subdir ? 1 : 0;
    const totalDepth = pathParts.length + subdirDepth;

    // Home link - go up the appropriate number of directories
    const homePrefix = totalDepth > 0 ? '../'.repeat(totalDepth) : './';
    parts.push(`[Home](${homePrefix}README.md)`);

    // Namespace path components
    let accumulatedPath = '';
    for (let i = 0; i < pathParts.length; i++) {
      const nsName = pathParts[i];
      accumulatedPath += (accumulatedPath ? '/' : '') + nsName;

      // Calculate relative path from current location to this namespace
      const levelsUp = totalDepth - (i + 1);
      const nsPrefix = levelsUp > 0 ? '../'.repeat(levelsUp) : './';
      parts.push(`[${nsName}](${nsPrefix}README.md)`);
    }

    // Current item (not linked)
    parts.push(currentName);

    return parts.join(' > ');
  }

  private _escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private _getCommentText(summary: CommentDisplayPart[]): string {
    return summary.map((part) => part.text).join('');
  }

  /**
   * Compute relative path from current file to target file.
   */
  private _relativePath(from: string, to: string): string {
    const fromDir = path.dirname(from);
    return path.relative(fromDir, to);
  }

  /**
   * Convert a type string to a linked version where possible (for HTML table cells).
   * Handles generic types like `Map<K, V>` by linking individual type names.
   */
  private _linkType(typeStr: string): string {
    if (!typeStr) return '';

    // Parse type string and link known types
    // This regex matches type names (identifiers) that might be linkable
    const result = typeStr.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, (match, typeName) => {
      const urlInfo = this._urlMap.get(typeName);
      if (urlInfo) {
        const relativePath = this._relativePath(this._currentFilePath, urlInfo.url);
        return `[${typeName}](${relativePath})`;
      }
      return match;
    });

    return this._escapeHtml(result);
  }

  /**
   * Convert a type string to a linked version for inline markdown (not in HTML tables).
   * Returns the type wrapped in backticks, with links if the type is documented.
   */
  private _linkTypeInline(typeStr: string): string {
    if (!typeStr) return '';

    // Check if the whole type name (without generics) is linkable
    const baseType = typeStr.split('<')[0].trim();
    const urlInfo = this._urlMap.get(baseType);

    if (urlInfo) {
      const relativePath = this._relativePath(this._currentFilePath, urlInfo.url);
      return `[\`${typeStr}\`](${relativePath})`;
    }

    return `\`${typeStr}\``;
  }

  /**
   * Set the current file being rendered (for computing relative URLs).
   */
  private _setCurrentFile(filePath: string): void {
    this._currentFilePath = filePath;
  }
}

/**
 * Plugin load function - entry point for TypeDoc.
 */
export function load(app: Application): void {
  // Declare custom option for inherited member pages
  app.options.addDeclaration({
    name: 'includeInheritedMemberPages',
    help: '[Compact Theme] Generate separate detail pages for inherited members instead of linking to parent class',
    type: ParameterType.Boolean,
    defaultValue: false
  });

  // Read options after bootstrap
  let outputDir: string | undefined;
  let includeInheritedMemberPages: boolean = false;

  app.on(Application.EVENT_BOOTSTRAP_END, () => {
    outputDir = app.options.getValue('out') as string;
    includeInheritedMemberPages = app.options.getValue('includeInheritedMemberPages') as boolean;
  });

  // Render our markdown after conversion completes, before the renderer runs
  app.converter.on(Converter.EVENT_RESOLVE_END, (context: Context) => {
    if (!outputDir) {
      console.error('[compact-markdown] Output directory not set');
      return;
    }

    // Render using our custom format
    const options: ICompactMarkdownOptions = {
      includeInheritedMemberPages
    };
    const renderer = new CompactMarkdownRenderer(outputDir, options);
    renderer.renderProject(context.project);

    console.log(`[compact-markdown] Generated markdown documentation at ${outputDir}`);

    // Exit before TypeDoc's HTML renderer runs
    // This is the simplest way to prevent default output without intermediate files
    process.exit(0);
  });
}
