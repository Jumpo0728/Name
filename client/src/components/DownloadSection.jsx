import React from 'react';
import { Download, RefreshCw, FileText, CheckCircle } from 'lucide-react';

const DownloadSection = ({ result, onDownload, onReset }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Conversion Successful!
        </h2>
        <p className="text-gray-600">
          Your Java animations have been converted to Bedrock format
        </p>
      </div>

      {/* Conversion Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Conversion Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {result.animationsFound}
            </div>
            <div className="text-sm text-green-800">Animations Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {result.animationsConverted}
            </div>
            <div className="text-sm text-green-800">Successfully Converted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatFileSize(result.fileSize)}
            </div>
            <div className="text-sm text-green-800">Output Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatDuration(result.processingTime)}
            </div>
            <div className="text-sm text-green-800">Processing Time</div>
          </div>
        </div>
      </div>

      {/* Download Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onDownload}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 btn-hover-lift"
        >
          <Download className="h-5 w-5" />
          <span>Download .mcpack File</span>
        </button>
        
        <button
          onClick={onReset}
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Convert Another Pack</span>
        </button>
      </div>

      {/* File Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-1">Download Information</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>File:</strong> {result.fileName}</p>
              <p><strong>Format:</strong> Bedrock .mcpack (ZIP)</p>
              <p><strong>Compatibility:</strong> Minecraft Bedrock 1.2.0+</p>
              <p><strong>Pack Name:</strong> {result.packName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">Installation Instructions</h4>
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <h5 className="font-medium mb-1">For Minecraft Bedrock (Windows 10/11, Mobile, Console):</h5>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Download the .mcpack file</li>
              <li>Open Minecraft Bedrock Edition</li>
              <li>Go to Settings → Storage</li>
              <li>Tap "Import" or "Add Storage"</li>
              <li>Select the downloaded .mcpack file</li>
              <li>The animations will be available in your resource packs</li>
            </ol>
          </div>
          <div>
            <h5 className="font-medium mb-1">For Minecraft Dungeons:</h5>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Extract the .mcpack file</li>
              <li>Place the extracted folder in your Dungeons resource packs directory</li>
              <li>Enable the pack in the Dungeons settings</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Troubleshooting</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• <strong>Animations not appearing:</strong> Ensure you're using Minecraft Bedrock 1.2.0 or later</li>
          <li>• <strong>Broken animations:</strong> Check that your Java pack uses standard bone names</li>
          <li>• <strong>Performance issues:</strong> Reduce render distance or disable other resource packs</li>
          <li>• <strong>File won't install:</strong> Make sure you're importing as a .mcpack file, not a ZIP</li>
        </ul>
      </div>
    </div>
  );
};

export default DownloadSection;