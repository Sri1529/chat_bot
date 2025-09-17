import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  startRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
  audioBlob: Blob | null;
  error: string | null;
  clearAudio: () => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    setError(null);
    setAudioBlob(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Audio recording not supported in this browser');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(audioBlob);
          
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          setError('Recording error occurred');
          setIsRecording(false);
        };
        
        mediaRecorder.start();
        setIsRecording(true);
        console.log('Audio recording started');
      })
      .catch((err) => {
        console.error('Error accessing microphone:', err);
        setError('Failed to access microphone. Please check permissions.');
      });
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('Audio recording stopped');
    }
  }, [isRecording]);

  const clearAudio = useCallback(() => {
    setAudioBlob(null);
    audioChunksRef.current = [];
  }, []);

  return {
    startRecording,
    stopRecording,
    isRecording,
    audioBlob,
    error,
    clearAudio
  };
};
