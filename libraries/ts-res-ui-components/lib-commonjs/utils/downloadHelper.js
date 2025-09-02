'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DownloadUtils = void 0;
const ts_utils_1 = require('@fgv/ts-utils');
/**
 * Download utilities namespace for file export functionality
 * @public
 */
var DownloadUtils;
(function (DownloadUtils) {
  /**
   * Creates a timestamp string suitable for filenames
   * @public
   */
  function createTimestamp(customFormat) {
    if (customFormat) {
      return customFormat;
    }
    return new Date().toISOString().replace(/[:]/g, '-').split('.')[0];
  }
  DownloadUtils.createTimestamp = createTimestamp;
  /**
   * Generates a filename based on options
   * @public
   */
  function generateFilename(baseFilename, type, options = {}) {
    if (!baseFilename || !baseFilename.trim()) {
      return (0, ts_utils_1.fail)('Base filename cannot be empty');
    }
    const { extension = 'json', includeTimestamp = true, timestampFormat, filenameTransformer } = options;
    let filename = baseFilename.trim();
    // Add type if provided
    if (type) {
      filename = `${filename}-${type}`;
    }
    // Add timestamp if requested
    if (includeTimestamp) {
      const timestamp = createTimestamp(timestampFormat);
      filename = `${filename}-${timestamp}`;
    }
    // Apply custom transformer if provided
    if (filenameTransformer) {
      filename = filenameTransformer(filename);
    }
    // Add extension
    filename = `${filename}.${extension}`;
    return (0, ts_utils_1.succeed)(filename);
  }
  DownloadUtils.generateFilename = generateFilename;
  /**
   * Downloads data as a file using the browser's download mechanism
   * @public
   */
  function downloadFile(data, type, options = {}) {
    const { baseFilename = 'ts-res-export', extension = 'json', mimeType } = options;
    // Generate filename
    const filenameResult = generateFilename(baseFilename, type, options);
    if (filenameResult.isFailure()) {
      return (0, ts_utils_1.fail)(`Failed to generate filename: ${filenameResult.message}`);
    }
    return (0, ts_utils_1.captureResult)(() => {
      // Convert data to string
      let content;
      if (typeof data === 'string') {
        content = data;
      } else if (extension === 'json') {
        content = JSON.stringify(data, null, 2);
      } else {
        content = String(data);
      }
      // Determine MIME type
      const finalMimeType = mimeType ?? (extension === 'json' ? 'application/json' : 'text/plain');
      // Create blob and download
      const blob = new Blob([content], { type: finalMimeType });
      const url = URL.createObjectURL(blob);
      // Create temporary download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filenameResult.value;
      link.style.display = 'none';
      // Trigger download
      document.body.appendChild(link);
      link.click();
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }).withErrorFormat((error) => `Failed to download file: ${error}`);
  }
  DownloadUtils.downloadFile = downloadFile;
  /**
   * Downloads JSON data with ts-res specific defaults
   * @public
   */
  function downloadTsResJson(data, type) {
    return downloadFile(data, type, {
      baseFilename: 'ts-res',
      extension: 'json',
      includeTimestamp: true,
      mimeType: 'application/json'
    });
  }
  DownloadUtils.downloadTsResJson = downloadTsResJson;
  /**
   * Downloads a bundle with enhanced naming
   * @public
   */
  function downloadBundle(data, resourceCount, configName) {
    const options = {
      baseFilename: 'ts-res-bundle',
      extension: 'json',
      includeTimestamp: true,
      mimeType: 'application/json',
      filenameTransformer: (base) => {
        let enhanced = base;
        // Add resource count if available
        if (resourceCount !== undefined && resourceCount > 0) {
          enhanced = `${enhanced}-${resourceCount}res`;
        }
        // Add config name if available
        if (configName) {
          const cleanConfigName = configName.replace(/[^a-zA-Z0-9-_]/g, '-');
          enhanced = `${enhanced}-${cleanConfigName}`;
        }
        return enhanced;
      }
    };
    return downloadFile(data, '', options);
  }
  DownloadUtils.downloadBundle = downloadBundle;
  /**
   * Downloads resource data with enhanced naming
   * @public
   */
  function downloadResources(data, resourceCount, collectionName) {
    const options = {
      baseFilename: 'ts-res-resources',
      extension: 'json',
      includeTimestamp: true,
      mimeType: 'application/json',
      filenameTransformer: (base) => {
        let enhanced = base;
        // Add resource count if available
        if (resourceCount !== undefined && resourceCount > 0) {
          enhanced = `${enhanced}-${resourceCount}items`;
        }
        // Add collection name if available
        if (collectionName) {
          const cleanName = collectionName.replace(/[^a-zA-Z0-9-_]/g, '-');
          enhanced = `${enhanced}-${cleanName}`;
        }
        return enhanced;
      }
    };
    return downloadFile(data, '', options);
  }
  DownloadUtils.downloadResources = downloadResources;
  /**
   * Downloads compiled resources with specific naming
   * @public
   */
  function downloadCompiledResources(data, resourceCount) {
    return downloadFile(data, 'compiled', {
      baseFilename: 'ts-res',
      extension: 'json',
      includeTimestamp: true,
      mimeType: 'application/json',
      filenameTransformer: (base) => {
        if (resourceCount !== undefined && resourceCount > 0) {
          return `${base}-${resourceCount}res`;
        }
        return base;
      }
    });
  }
  DownloadUtils.downloadCompiledResources = downloadCompiledResources;
  /**
   * Downloads source resources with specific naming
   * @public
   */
  function downloadSourceResources(data, resourceCount) {
    return downloadFile(data, 'source', {
      baseFilename: 'ts-res',
      extension: 'json',
      includeTimestamp: true,
      mimeType: 'application/json',
      filenameTransformer: (base) => {
        if (resourceCount !== undefined && resourceCount > 0) {
          return `${base}-${resourceCount}res`;
        }
        return base;
      }
    });
  }
  DownloadUtils.downloadSourceResources = downloadSourceResources;
})(DownloadUtils || (exports.DownloadUtils = DownloadUtils = {}));
//# sourceMappingURL=downloadHelper.js.map
