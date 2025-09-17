import { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const useChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(() => {
    // Load session ID from localStorage on initialization
    return localStorage.getItem('chatSessionId') || null;
  });
  const [chatHistory, setChatHistory] = useState([]);

  // Save session ID to localStorage whenever it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('chatSessionId', sessionId);
    } else {
      localStorage.removeItem('chatSessionId');
    }
  }, [sessionId]);

  // Load chat history when session ID is available
  useEffect(() => {
    if (sessionId) {
      loadChatHistory();
    }
  }, [sessionId]);

  const loadChatHistory = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setChatHistory(data.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (message, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: sessionId || options.sessionId,
          stream: options.stream || false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Set session ID if not already set
        if (!sessionId && data.data.sessionId) {
          setSessionId(data.data.sessionId);
        }
        
        // Reload chat history to get the latest messages
        if (data.data.sessionId) {
          await loadChatHistory();
        }
        
        return {
          response: data.data.message,
          sessionId: data.data.sessionId,
          contextFound: data.data.metadata?.hasContext || false,
          contextChunks: data.data.metadata?.articles || [],
          timestamp: data.data.timestamp
        };
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const sendStreamingMessage = useCallback(async (message, onChunk, onComplete, onError) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use regular chat endpoint instead of streaming
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Set session ID if not already set
        if (!sessionId && data.data.sessionId) {
          setSessionId(data.data.sessionId);
        }
        
        // Simulate streaming by breaking the response into chunks
        const responseText = data.data.message;
        const words = responseText.split(' ');
        
        // Send chunks word by word
        for (let i = 0; i < words.length; i++) {
          const word = words[i] + (i < words.length - 1 ? ' ' : '');
          if (onChunk) onChunk(word);
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Reload chat history to get the latest messages
        if (data.data.sessionId) {
          await loadChatHistory();
        }
        
        if (onComplete) onComplete(data.data.sessionId);
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send streaming message';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const getChatHistory = useCallback(async (sessionIdToUse = sessionId) => {
    if (!sessionIdToUse) {
      throw new Error('No session ID provided');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat/history/${sessionIdToUse}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data.messages;
      } else {
        throw new Error(data.error || 'Failed to get chat history');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get chat history';
      setError(errorMessage);
      throw err;
    }
  }, [sessionId]);

  const clearChatHistory = useCallback(async (sessionIdToUse = sessionId) => {
    if (!sessionIdToUse) {
      throw new Error('No session ID provided');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/chat/reset/${sessionIdToUse}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Clear local chat history
        setChatHistory([]);
        // Reset local session ID if clearing current session
        if (sessionIdToUse === sessionId) {
          setSessionId(null);
        }
        return true;
      } else {
        throw new Error(data.error || 'Failed to clear chat history');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear chat history';
      setError(errorMessage);
      throw err;
    }
  }, [sessionId]);

  const resetSession = useCallback(() => {
    setSessionId(null);
    setChatHistory([]);
    setError(null);
  }, []);

  return {
    sendMessage,
    sendStreamingMessage,
    getChatHistory,
    clearChatHistory,
    resetSession,
    sessionId,
    chatHistory,
    isLoading,
    error
  };
};

export default useChat;
