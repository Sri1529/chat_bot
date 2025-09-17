import { useState, useCallback } from 'react';

interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  error: string | null;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback((text: string) => {
    if (!text.trim()) return;

    // Stop any current speech
    speechSynthesis.cancel();

    setError(null);

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to use a consistent voice (prefer female voices for better clarity)
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('Alex') && 
        (voice.name.includes('Samantha') || voice.name.includes('Karen') || voice.name.includes('Victoria') || 
         voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Alex'))
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('Using voice:', preferredVoice.name);
      } else {
        // Fallback to any English voice
        const fallbackVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (fallbackVoice) {
          utterance.voice = fallbackVoice;
          console.log('Using fallback voice:', fallbackVoice.name);
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log('Text-to-speech started');
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('Text-to-speech ended');
      };

      utterance.onerror = (event) => {
        console.error('Text-to-speech error:', event.error);
        setError(`Text-to-speech error: ${event.error}`);
        setIsSpeaking(false);
      };
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error creating speech utterance:', err);
      setError('Failed to create speech utterance');
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    error
  };
};
