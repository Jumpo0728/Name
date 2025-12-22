import { useState, useCallback } from 'react';
import axios from 'axios';

export function useAnimationConverter() {
  const [state, setState] = useState({
    file: null,
    isConverting: false,
    progress: 0,
    status: '',
    animationsFound: 0,
    result: null,
    error: null
  });

  const uploadFile = useCallback(async (file) => {
    try {
      setState(prev => ({
        ...prev,
        file,
        isConverting: true,
        progress: 0,
        status: 'Initializing conversion...',
        error: null,
        result: null
      }));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState(prev => {
          if (prev.progress < 90 && prev.isConverting) {
            return {
              ...prev,
              progress: prev.progress + Math.random() * 10,
              status: getStatusMessage(prev.progress)
            };
          }
          return prev;
        });
      }, 500);

      const formData = new FormData();
      formData.append('animation-pack', file);

      const response = await axios.post('/api/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
      });

      clearInterval(progressInterval);

      if (response.data.success) {
        setState(prev => ({
          ...prev,
          isConverting: false,
          progress: 100,
          status: 'Conversion complete!',
          animationsFound: response.data.data.animationsFound,
          result: response.data.data
        }));
      } else {
        throw new Error(response.data.error || 'Conversion failed');
      }

    } catch (error) {
      console.error('Conversion error:', error);
      
      let errorMessage = 'Failed to convert animation pack';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Conversion timed out. Please try with a smaller file or check your connection.';
      }

      setState(prev => ({
        ...prev,
        isConverting: false,
        progress: 0,
        status: '',
        error: errorMessage
      }));
    }
  }, []);

  const downloadFile = useCallback(async () => {
    try {
      if (!state.result?.downloadUrl) {
        throw new Error('No download URL available');
      }

      // Create download link
      const link = document.createElement('a');
      link.href = state.result.downloadUrl;
      link.download = state.result.fileName.replace('.zip', '.mcpack');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Download error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to download file. Please try again.'
      }));
    }
  }, [state.result]);

  const resetState = useCallback(() => {
    setState({
      file: null,
      isConverting: false,
      progress: 0,
      status: '',
      animationsFound: 0,
      result: null,
      error: null
    });
  }, []);

  return {
    state,
    uploadFile,
    downloadFile,
    resetState
  };
}

function getStatusMessage(progress) {
  if (progress < 20) {
    return 'Reading Java animation pack...';
  } else if (progress < 40) {
    return 'Parsing animation JSON files...';
  } else if (progress < 60) {
    return 'Converting Euler angles to quaternions...';
  } else if (progress < 80) {
    return 'Mapping bone names to Bedrock format...';
  } else {
    return 'Generating .mcpack file...';
  }
}