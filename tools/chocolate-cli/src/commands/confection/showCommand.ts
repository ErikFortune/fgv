// Copyright (c) 2026 Erik Fortune
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

import { Command } from 'commander';
import * as yaml from 'yaml';
import { ConfectionId, ConfectionVersionSpec, Converters, Entities } from '@fgv/ts-chocolate';

import { IEntityBaseOptions, OutputFormat, loadConfectionsLibrary, formatUrls } from '../shared';

/**
 * Options for confection show command
 */
interface IConfectionShowOptions extends IEntityBaseOptions {
  version?: string;
}

/**
 * Formats a confection for human-readable output
 */
function formatConfectionHuman(
  confection: Entities.Confections.ConfectionData,
  confectionId: ConfectionId,
  versionSpec?: ConfectionVersionSpec
): string {
  const lines: string[] = [];

  lines.push(`Confection: ${confection.name}`);
  lines.push(`ID: ${confectionId}`);
  lines.push(`Type: ${confection.confectionType}`);

  if (confection.description) {
    lines.push(`Description: ${confection.description}`);
  }

  if (confection.tags && confection.tags.length > 0) {
    lines.push(`Tags: ${confection.tags.join(', ')}`);
  }

  lines.push('');

  // Find the requested version
  const targetVersionSpec = versionSpec ?? confection.goldenVersionSpec;
  const version = confection.versions.find((v) => v.versionSpec === targetVersionSpec);

  if (!version) {
    lines.push(`Version ${targetVersionSpec} not found.`);
    lines.push(`Available versions: ${confection.versions.map((v) => v.versionSpec).join(', ')}`);
    return lines.join('\n');
  }

  const isGolden = targetVersionSpec === confection.goldenVersionSpec;
  lines.push(`Version: ${version.versionSpec}${isGolden ? ' (golden)' : ''}`);
  lines.push(`Created: ${version.createdDate}`);

  // Yield
  lines.push(`Yield: ${version.yield.count} ${version.yield.unit ?? 'pieces'}`);
  if (version.yield.weightPerPiece !== undefined) {
    lines.push(`Weight per piece: ${version.yield.weightPerPiece}g`);
  }

  // Type-specific information
  if (Entities.Confections.isMoldedBonBonVersion(version)) {
    lines.push('');
    lines.push('Molds:');
    const preferredMoldId = version.molds.preferredId;
    for (const moldRef of version.molds.options) {
      const isPreferred = moldRef.id === preferredMoldId;
      const preferredMarker = isPreferred ? ' (preferred)' : '';
      const notes = moldRef.notes ? ` - ${moldRef.notes}` : '';
      lines.push(`  ${moldRef.id}${preferredMarker}${notes}`);
    }

    lines.push('');
    lines.push('Shell Chocolate:');
    const preferredShellId = version.shellChocolate.preferredId;
    for (const chocId of version.shellChocolate.ids) {
      const isPreferred = chocId === preferredShellId;
      const preferredMarker = isPreferred ? ' (preferred)' : '';
      lines.push(`  ${chocId}${preferredMarker}`);
    }

    if (version.additionalChocolates && version.additionalChocolates.length > 0) {
      for (const addlChoc of version.additionalChocolates) {
        lines.push('');
        lines.push(`${addlChoc.purpose} Chocolate:`);
        const preferredAddlId = addlChoc.chocolate.preferredId;
        for (const chocId of addlChoc.chocolate.ids) {
          const isPreferred = chocId === preferredAddlId;
          const preferredMarker = isPreferred ? ' (preferred)' : '';
          lines.push(`  ${chocId}${preferredMarker}`);
        }
      }
    }
  } else if (Entities.Confections.isBarTruffleVersion(version)) {
    lines.push('');
    lines.push('Frame Dimensions:');
    const fd = version.frameDimensions;
    lines.push(`  ${fd.width} x ${fd.height} x ${fd.depth} mm`);

    lines.push('');
    lines.push('BonBon Dimensions:');
    const bd = version.singleBonBonDimensions;
    lines.push(`  ${bd.width} x ${bd.height} mm`);

    if (version.enrobingChocolate) {
      lines.push('');
      lines.push('Enrobing Chocolate:');
      const preferredId = version.enrobingChocolate.preferredId;
      for (const chocId of version.enrobingChocolate.ids) {
        const isPreferred = chocId === preferredId;
        const preferredMarker = isPreferred ? ' (preferred)' : '';
        lines.push(`  ${chocId}${preferredMarker}`);
      }
    }
  } else if (Entities.Confections.isRolledTruffleVersion(version)) {
    if (version.enrobingChocolate) {
      lines.push('');
      lines.push('Enrobing Chocolate:');
      const preferredId = version.enrobingChocolate.preferredId;
      for (const chocId of version.enrobingChocolate.ids) {
        const isPreferred = chocId === preferredId;
        const preferredMarker = isPreferred ? ' (preferred)' : '';
        lines.push(`  ${chocId}${preferredMarker}`);
      }
    }

    if (version.coatings) {
      lines.push('');
      lines.push('Coatings:');
      const preferredId = version.coatings.preferredId;
      for (const coatingId of version.coatings.ids) {
        const isPreferred = coatingId === preferredId;
        const preferredMarker = isPreferred ? ' (preferred)' : '';
        lines.push(`  ${coatingId}${preferredMarker}`);
      }
    }
  }

  // Fillings
  if (version.fillings && version.fillings.length > 0) {
    lines.push('');
    lines.push('Fillings:');
    for (const slot of version.fillings) {
      const slotName = slot.name ?? slot.slotId;
      lines.push(`  ${slotName}:`);
      const preferredId = slot.filling.preferredId;
      for (const opt of slot.filling.options) {
        const isPreferred = opt.id === preferredId;
        const preferredMarker = isPreferred ? ' (preferred)' : '';
        const typeMarker = ` [${opt.type}]`;
        const notes = opt.notes ? ` - ${opt.notes}` : '';
        lines.push(`    ${opt.id}${typeMarker}${preferredMarker}${notes}`);
      }
    }
  }

  // Decorations
  if (version.decorations && version.decorations.length > 0) {
    lines.push('');
    lines.push('Decorations:');
    for (const decoration of version.decorations) {
      const preferredMarker = decoration.preferred ? ' (preferred)' : '';
      lines.push(`  ${decoration.description}${preferredMarker}`);
    }
  }

  // Procedures
  if (version.procedures && version.procedures.options.length > 0) {
    lines.push('');
    lines.push('Procedures:');
    const preferredProcId = version.procedures.preferredId;
    for (const procRef of version.procedures.options) {
      const isPreferred = procRef.id === preferredProcId;
      const preferredMarker = isPreferred ? ' (preferred)' : '';
      const notes = procRef.notes ? ` - ${procRef.notes}` : '';
      lines.push(`  ${procRef.id}${preferredMarker}${notes}`);
    }
  }

  // Notes
  if (version.notes) {
    lines.push('');
    lines.push(`Notes: ${version.notes}`);
  }

  // URLs
  if (confection.urls && confection.urls.length > 0) {
    formatUrls(confection.urls, lines);
  }

  // Other versions
  if (confection.versions.length > 1) {
    lines.push('');
    lines.push(`Other versions (${confection.versions.length - 1}):`);
    for (const v of confection.versions) {
      if (v.versionSpec !== targetVersionSpec) {
        const golden = v.versionSpec === confection.goldenVersionSpec ? ' (golden)' : '';
        lines.push(`  ${v.versionSpec}${golden} - ${v.createdDate}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Creates the confection show subcommand
 */
export function createShowSubcommand(): Command {
  const cmd = new Command('show');

  cmd
    .description('Display details of a specific confection')
    .argument('<confectionId>', 'Confection ID (e.g., "myshop.dark-ganache-bonbon")')
    .option('--version <spec>', 'Show a specific version (default: golden version)')
    .action(async (confectionIdArg: string, localOptions: { version?: string }) => {
      // Merge with parent options
      const parentOptions = cmd.optsWithGlobals() as IConfectionShowOptions;
      const options: IConfectionShowOptions = {
        ...parentOptions,
        ...localOptions
      };

      // Validate confection ID
      const confectionIdResult = Converters.confectionId.convert(confectionIdArg);
      if (confectionIdResult.isFailure()) {
        console.error(`Invalid confection ID "${confectionIdArg}": ${confectionIdResult.message}`);
        process.exit(1);
      }
      const confectionId = confectionIdResult.value;

      // Load the confections library
      const libraryResult = await loadConfectionsLibrary(options);
      if (libraryResult.isFailure()) {
        console.error(`Error loading confections: ${libraryResult.message}`);
        process.exit(1);
      }
      const library = libraryResult.value;

      // Get the confection
      const confectionResult = library.get(confectionId);
      if (confectionResult.isFailure()) {
        console.error(`Confection not found: ${confectionId}`);
        process.exit(1);
      }
      const confection = confectionResult.value;

      // Validate version spec if provided
      let versionSpec: ConfectionVersionSpec | undefined;
      if (options.version) {
        const versionResult = Converters.confectionVersionSpec.convert(options.version);
        if (versionResult.isFailure()) {
          console.error(`Invalid version spec "${options.version}": ${versionResult.message}`);
          process.exit(1);
        }
        versionSpec = versionResult.value;

        // Check that the version exists
        const version = confection.versions.find((v) => v.versionSpec === versionSpec);
        if (!version) {
          console.error(`Version ${versionSpec} not found in confection ${confectionId}`);
          console.error(`Available versions: ${confection.versions.map((v) => v.versionSpec).join(', ')}`);
          process.exit(1);
        }
      }

      const format = (options.format ?? 'human') as OutputFormat;

      // Format and output
      switch (format) {
        case 'json':
          console.log(JSON.stringify(confection, null, 2));
          break;
        case 'yaml':
          console.log(yaml.stringify(confection));
          break;
        case 'table':
        case 'human':
        default:
          console.log(formatConfectionHuman(confection, confectionId, versionSpec));
          break;
      }
    });

  return cmd;
}
