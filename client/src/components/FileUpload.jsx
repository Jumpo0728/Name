import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';

const FileUpload = ({ onFileSelect, isLoading }) => {
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: isLoading,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    }
  });

  const hasErrors = fileRejections.length > 0;

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          drop-zone relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive ? 'drag-over' : ''}
          ${hasErrors ? 'error' : ''}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <div className="spinner">
              <Upload className="h-16 w-16 text-gray-400" />
            </div>
          ) : (
            <Upload className={`h-16 w-16 ${hasErrors ? 'text-red-400' : 'text-blue-500'}`} />
          )}
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {isDragActive 
                ? 'Drop your animation pack here!' 
                : isLoading 
                  ? 'Processing...' 
                  : hasErrors 
                    ? 'Invalid File' 
                    : 'Upload Java Animation Pack'
              }
            </h3>
            
            {!isLoading && !hasErrors && (
              <p className="text-gray-600">
                Drag and drop your ZIP file here, or click to browse
              </p>
            )}
            
            {isLoading && (
              <p className="text-blue-600">
                Converting your animations to Bedrock format...
              </p>
            )}
            
            {hasErrors && (
              <div className="text-red-600">
                {fileRejections.map(({ file, errors }) => (
                  <div key={file.name} className="space-y-1">
                    <p className="font-medium">{file.name}</p>
                    {errors.map(error => (
                      <p key={error.code} className="text-sm">
                        {error.code === 'file-too-large' 
                          ? 'File is too large (max 50MB)'
                          : error.code === 'file-invalid-type'
                          ? 'Only ZIP files are accepted'
                          : error.message
                        }
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {!isLoading && !hasErrors && (
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>ZIP files only</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>Max 50MB</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {!isLoading && !hasErrors && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Supported Formats:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Minecraft Java Edition animation resource packs</li>
            <li>• ZIP files containing animation JSON files</li>
            <li>• Standard Java pack structure with animations/ folder</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;