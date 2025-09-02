import React from 'react';
import { ArchiveBoxIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Bundle } from '@fgv/ts-res';

export interface BundleInfoProps {
  bundleMetadata: Bundle.IBundleMetadata;
  isCompact?: boolean;
  showStatus?: boolean;
  className?: string;
}

const BundleInfo: React.FC<BundleInfoProps> = ({
  bundleMetadata,
  isCompact = false,
  showStatus = false,
  className = ''
}) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatChecksum = (checksum: string) => {
    return checksum.length > 12 ? `${checksum.substring(0, 12)}...` : checksum;
  };

  if (isCompact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <ArchiveBoxIcon className="h-4 w-4 text-blue-600" />
        <span className="text-sm text-gray-700">Bundle {bundleMetadata.version || 'v1.0.0'}</span>
        <span className="text-xs text-gray-500">({formatDate(bundleMetadata.dateBuilt)})</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-blue-200 p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <ArchiveBoxIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Bundle Information</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Build Date:</span>
          <span className="font-medium">{formatDate(bundleMetadata.dateBuilt)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Checksum:</span>
          <span className="font-mono text-xs text-gray-700">{formatChecksum(bundleMetadata.checksum)}</span>
        </div>

        {bundleMetadata.version && (
          <div className="flex justify-between">
            <span className="text-gray-600">Version:</span>
            <span className="font-medium">{bundleMetadata.version}</span>
          </div>
        )}

        {bundleMetadata.description && (
          <div className="flex justify-between">
            <span className="text-gray-600">Description:</span>
            <span className="font-medium text-right max-w-xs truncate">{bundleMetadata.description}</span>
          </div>
        )}
      </div>

      {showStatus && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Bundle Loaded Successfully!</p>
              <p>Configuration and resources have been auto-applied from the bundle.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleInfo;
