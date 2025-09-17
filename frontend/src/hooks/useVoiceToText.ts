import { useState, useRef, useCallback } from 'react';

// Define SpeechRecognition interfaces
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface UseVoiceToTextReturn {
  startRecording: () => void;
  stopRecording: () => void;
  isRecording: boolean;
  transcript: string | null;
  setTranscript: (transcript: string | null) => void;
  error: string | null;
}

export const useVoiceToText = (): UseVoiceToTextReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startRecording = useCallback(() => {
    setError(null);
    setTranscript(null);

    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;  // Keep recording until manually stopped
      recognition.interimResults = true;  // Show interim results while speaking
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        console.log('Voice recognition started');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Accumulate all results for continuous recording
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        // Only update transcript if we have final results
        if (finalTranscript) {
          setTranscript(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
          console.log('Voice recognition result:', finalTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Voice recognition error:', event.error);
        setError(`Voice recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        // Don't automatically stop recording - let user control it manually
        console.log('Voice recognition session ended, but continuing if still recording');
        // Only stop if there was an error or if manually stopped
        if (recognitionRef.current) {
          // Restart recognition if we're still supposed to be recording
          setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Recognition already started or error restarting');
              }
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      setError('Speech recognition not supported in this browser');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;  // Clear the reference
    }
    setIsRecording(false);
    console.log('Voice recording stopped manually');
  }, []);

  return {
    startRecording,
    stopRecording,
    isRecording,
    transcript,
    setTranscript,
    error
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
