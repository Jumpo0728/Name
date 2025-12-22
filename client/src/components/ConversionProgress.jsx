import React from 'react';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const ConversionProgress = ({ progress, status, animationsFound }) => {
  const getProgressSteps = () => [
    {
      id: 'upload',
      label: 'Uploading pack',
      description: 'Reading your Java animation pack',
      completed: progress > 10
    },
    {
      id: 'analyze',
      label: 'Analyzing animations',
      description: 'Extracting animation data',
      completed: progress > 30
    },
    {
      id: 'convert',
      label: 'Converting format',
      description: 'Transforming Java to Bedrock',
      completed: progress > 60
    },
    {
      id: 'generate',
      label: 'Generating .mcpack',
      description: 'Creating Bedrock pack',
      completed: progress > 85
    },
    {
      id: 'complete',
      label: 'Finalizing',
      description: 'Preparing download',
      completed: progress >= 100
    }
  ];

  const steps = getProgressSteps();

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          {progress < 100 ? (
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          ) : (
            <CheckCircle className="h-12 w-12 text-green-500" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {progress < 100 ? 'Converting Animations' : 'Conversion Complete!'}
        </h2>
        <p className="text-gray-600">
          {status || (progress < 100 ? 'Processing your animations...' : 'Your Bedrock pack is ready!')}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="progress-bar bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-4">
            <div className={`
              flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
              ${step.completed 
                ? 'bg-green-100 text-green-600' 
                : progress < 100 && index === steps.findIndex(s => !s.completed)
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-400'
              }
            `}>
              {step.completed ? (
                <CheckCircle className="h-5 w-5" />
              ) : progress < 100 && index === steps.findIndex(s => !s.completed) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className={`
                  font-medium
                  ${step.completed 
                    ? 'text-green-700' 
                    : progress < 100 && index === steps.findIndex(s => !s.completed)
                    ? 'text-blue-700'
                    : 'text-gray-500'
                  }
                `}>
                  {step.label}
                </h3>
                {progress >= 100 && step.completed && animationsFound > 0 && (
                  <span className="text-sm text-green-600 font-medium">
                    {step.id === 'analyze' ? `${animationsFound} found` : 'Done'}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      {progress > 30 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {progress < 100 ? Math.round(progress) : 100}%
              </div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
            {animationsFound > 0 && (
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {animationsFound}
                </div>
                <div className="text-sm text-gray-600">Animations</div>
              </div>
            )}
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {progress < 100 ? '~30s' : '< 5s'}
              </div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {progress < 100 ? 'Active' : 'Ready'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">What we're doing:</p>
            <ul className="text-blue-800 space-y-1">
              <li>• Parsing Java animation JSON files</li>
              <li>• Converting Euler angles to quaternions</li>
              <li>• Mapping bone names to Bedrock format</li>
              <li>• Generating optimized Bedrock animation controllers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionProgress;