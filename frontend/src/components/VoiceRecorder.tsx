import React from 'react';

interface VoiceRecorderProps {
  onTranscript: (transcript: string) => void;
  onError: (error: string) => void;
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  onError,
  isRecording,
  onStart,
  onStop
}) => {
  return null; // This component is handled by the useVoiceToText hook
};

export default VoiceRecorder;
