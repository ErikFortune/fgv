/**
 * Validate ZIP file extension
 * @public
 */
export function isZipFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.zip');
}
