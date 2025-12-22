import React from 'react';
import FileUpload from './components/FileUpload';
import ConversionProgress from './components/ConversionProgress';
import AnimationPreview from './components/AnimationPreview';
import DownloadSection from './components/DownloadSection';
import Header from './components/Header';
import Footer from './components/Footer';
import { useAnimationConverter } from './hooks/useAnimationConverter';
import './App.css';

function App() {
  const {
    state,
    uploadFile,
    resetState,
    downloadFile
  } = useAnimationConverter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Minecraft Animation
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Converter
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Convert your Minecraft Java Edition animation resource packs to Bedrock-compatible format instantly
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {!state.file && !state.isConverting && !state.result && (
              <FileUpload onFileSelect={uploadFile} isLoading={state.isConverting} />
            )}

            {state.isConverting && (
              <ConversionProgress 
                progress={state.progress}
                status={state.status}
                animationsFound={state.animationsFound}
              />
            )}

            {state.result && (
              <>
                <AnimationPreview 
                  animations={state.result.animations}
                  packName={state.result.packName}
                />
                <DownloadSection 
                  result={state.result}
                  onDownload={downloadFile}
                  onReset={resetState}
                />
              </>
            )}

            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">Conversion Failed</h3>
                  </div>
                </div>
                <p className="text-red-700 mb-4">{state.error}</p>
                <button
                  onClick={resetState}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Upload</h3>
              <p className="text-gray-600">Simply drag and drop your Java animation resource pack ZIP file</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Conversion</h3>
              <p className="text-gray-600">Automatically converts Euler angles to quaternions and maps bone names</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Download</h3>
              <p className="text-gray-600">Get your Bedrock-ready .mcpack file immediately after conversion</p>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-gray-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Java Animation Format</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Uses Euler angles for rotations</li>
                  <li>• Different bone naming conventions</li>
                  <li>• JSON-based animation files</li>
                  <li>• Timeline-based keyframes</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bedrock Animation Format</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Uses quaternions for rotations</li>
                  <li>• Standardized bone names</li>
                  <li>• Animation controller system</li>
                  <li>• Optimized performance</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;