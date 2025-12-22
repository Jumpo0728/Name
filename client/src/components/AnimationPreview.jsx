import React from 'react';
import { Play, Clock, Bone } from 'lucide-react';

const AnimationPreview = ({ animations, packName }) => {
  if (!animations || animations.length === 0) {
    return null;
  }

  const formatDuration = (duration) => {
    if (duration < 1) {
      return `${Math.round(duration * 100)}ms`;
    }
    return `${duration.toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Animation Preview</h2>
        <p className="text-gray-600">
          Found {animations.length} animation{animations.length !== 1 ? 's' : ''} in your Java pack
        </p>
      </div>

      {/* Pack Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{packName}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Play className="h-4 w-4 text-blue-600" />
            <span className="text-gray-600">{animations.length} animations</span>
          </div>
          <div className="flex items-center space-x-2">
            <Bone className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">
              {animations.reduce((total, anim) => total + anim.boneCount, 0)} total bones
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-gray-600">
              Max {formatDuration(Math.max(...animations.map(a => a.duration)))}
            </span>
          </div>
        </div>
      </div>

      {/* Animation List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Converted Animations</h3>
        <div className="grid gap-4">
          {animations.map((animation, index) => (
            <div 
              key={animation.name || index}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-1">
                    {animation.name}
                  </h4>
                  {animation.originalFile && (
                    <p className="text-sm text-gray-500">
                      Source: {animation.originalFile}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-1 text-green-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-medium">Converted</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Bones</div>
                  <div className="font-medium text-gray-900">{animation.boneCount}</div>
                </div>
                <div>
                  <div className="text-gray-500">Duration</div>
                  <div className="font-medium text-gray-900">{formatDuration(animation.duration)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Format</div>
                  <div className="font-medium text-gray-900">Bedrock</div>
                </div>
                <div>
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium text-green-600">Ready</div>
                </div>
              </div>

              {/* Bone List Preview */}
              {animation.animation && animation.animation.animations && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600 mb-2">Animated Bones:</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(animation.animation.animations).slice(0, 6).map((boneName) => (
                      <span 
                        key={boneName}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        <Bone className="h-3 w-3 mr-1" />
                        {boneName}
                      </span>
                    ))}
                    {Object.keys(animation.animation.animations).length > 6 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        +{Object.keys(animation.animation.animations).length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Conversion Notes:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Java Euler angles have been converted to Bedrock quaternions</li>
          <li>• Bone names have been mapped to Bedrock-compatible names</li>
          <li>• Animation controllers have been generated for optimal performance</li>
          <li>• All timing data has been preserved and optimized</li>
        </ul>
      </div>
    </div>
  );
};

export default AnimationPreview;