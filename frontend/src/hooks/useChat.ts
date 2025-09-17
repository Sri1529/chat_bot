import { useState, useCallback } from 'react';

interface ChatResponse {
  answer: string;
  transcript?: string;
  audio_url?: string;
  is_voice: boolean;
  timestamp: number;
}

interface UseChatReturn {
  sendTextMessage: (text: string, organisationId?: number, projectId?: number) => Promise<ChatResponse>;
  sendVoiceMessage: (audioBlob: Blob, organisationId?: number, projectId?: number) => Promise<ChatResponse>;
  isLoading: boolean;
  error: string | null;
}

export const useChat = (): UseChatReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendTextMessage = useCallback(async (
    text: string, 
    organisationId: number = 1, 
    projectId: number = 1
  ): Promise<ChatResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('organisation_id', organisationId.toString());
      formData.append('project_id', projectId.toString());

      const response = await fetch('http://localhost:5001/api/v1/chat/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send text message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendVoiceMessage = useCallback(async (
    audioBlob: Blob, 
    organisationId: number = 1, 
    projectId: number = 1
  ): Promise<ChatResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('organisation_id', organisationId.toString());
      formData.append('project_id', projectId.toString());

      const response = await fetch('http://localhost:5001/api/v1/chat/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send voice message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendTextMessage,
    sendVoiceMessage,
    isLoading,
    error
  };
};
