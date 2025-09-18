import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Bot, RotateCcw, HelpCircle } from 'lucide-react';
import MessageList from './components/MessageList';
import SampleQuestions from './components/SampleQuestions';
import useChat from './hooks/useChat';
import useTextToSpeech from './hooks/useTextToSpeech';
import useAudioRecorder from './hooks/useAudioRecorder';
import './index.css';

const App = () => {
  // Generate time-appropriate greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const [messages, setMessages] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showSampleQuestions, setShowSampleQuestions] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  const { speak, stopSpeaking, isSpeaking } = useTextToSpeech();
  const { 
    startRecording: startAudioRecording, 
    stopRecording: stopAudioRecording, 
    isRecording: isAudioRecording, 
    audioBlob, 
    error: audioError,
    clearAudio 
  } = useAudioRecorder();
  
  const { 
    sendMessage, 
    sendStreamingMessage,
    getChatHistory,
    clearChatHistory,
    resetSession,
    sessionId,
    chatHistory,
    isLoading, 
    error: chatError 
  } = useChat();

  // Determine which recording mode we're in
  const isVoiceMode = isAudioRecording;
  const isProcessing = isLoading || isStreaming;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Update messages when chatHistory changes
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      const formattedMessages = chatHistory.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: new Date(msg.timestamp),
        isVoice: false
      }));
      setMessages(formattedMessages);
    } else if (!sessionId) {
      // Show welcome message when no session exists
      setMessages([
        {
          id: 'welcome',
          text: `Hello! ${getTimeGreeting()}! I'm your AI assistant powered by news and current events. How can I help you today?`,
          sender: 'bot',
          timestamp: new Date(),
          isVoice: false
        }
      ]);
    }
  }, [chatHistory, sessionId]);

  const handleVoiceToggle = () => {
    if (isVoiceMode) {
      stopAudioRecording();
    } else {
      setInputText(''); // Clear input when starting recording
      startAudioRecording();
    }
  };

  const handleMuteToggle = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  const handleResetChat = async () => {
    try {
      if (sessionId) {
        await clearChatHistory();
      }
      resetSession();
      // The welcome message will be shown automatically by the useEffect
    } catch (error) {
      console.error('Failed to reset chat:', error);
    }
  };

  const handleSampleQuestionClick = (question) => {
    setInputText(question);
    setShowSampleQuestions(false);
    // Auto-send the question
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      setIsTyping(true);
      setIsStreaming(true);
      setStreamingText('');

      // Use streaming for better UX
      await sendStreamingMessage(
        messageText,
        // onChunk
        (chunk) => {
          setStreamingText(prev => prev + chunk);
        },
        // onComplete
        (completedSessionId) => {
          setStreamingText('');
          setIsStreaming(false);
          setIsTyping(false);
          
          // Speak the response if not muted
          if (!isMuted && streamingText) {
            speak(streamingText);
          }
        },
        // onError
        (error) => {
          console.error('Streaming error:', error);
          setIsStreaming(false);
          setIsTyping(false);
          setStreamingText('');
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setIsTyping(false);
      setStreamingText('');
    }
  };

  // Handle sending voice message when audio is ready
  useEffect(() => {
    if (audioBlob && !isAudioRecording) {
      handleSendVoiceMessage(audioBlob);
    }
  }, [audioBlob, isAudioRecording]);

  const handleSendVoiceMessage = async (audioBlob) => {
    try {
      // For now, we'll just send a placeholder message
      // In a real implementation, you'd transcribe the audio first
      const userMessage = {
        id: Date.now().toString(),
        text: 'Voice message (transcription not implemented)',
        sender: 'user',
        timestamp: new Date(),
        isVoice: true
      };

      setMessages(prev => [...prev, userMessage]);
      clearAudio();
      
      // Send a text message instead
      await handleSendMessage();
    } catch (error) {
      console.error('Error sending voice message:', error);
      clearAudio();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">AI News Assistant</h1>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">
                    {sessionId ? `Session: ${sessionId.slice(0, 8)}...` : 'Ready'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSampleQuestions(!showSampleQuestions)}
                className={`p-2 rounded-full transition-colors ${
                  showSampleQuestions ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Sample Questions"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={handleResetChat}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="Reset Chat"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={handleMuteToggle}
                className={`p-2 rounded-full transition-colors ${
                  isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-b-2xl shadow-lg h-96 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <MessageList 
              messages={messages} 
              isTyping={isTyping}
              streamingText={streamingText}
              isStreaming={isStreaming}
            />
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-6">
            <div className="flex items-center space-x-4">
              {/* Voice Recording Button */}
              <button
                onClick={handleVoiceToggle}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isVoiceMode 
                    ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                }`}
                disabled={isProcessing}
                title="Voice Recording"
              >
                {isVoiceMode ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              {/* Text Input */}
              <div className="flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isVoiceMode ? "Recording... Click mic to stop" :
                    isProcessing ? "Processing..." :
                    "Ask me about current news and events..."
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isProcessing) {
                      handleSendMessage();
                    }
                  }}
                  disabled={isVoiceMode || isProcessing}
                />
              </div>

              {/* Send Button */}
              <button
                className={`p-3 rounded-full transition-colors disabled:opacity-50 ${
                  isVoiceMode 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                disabled={!inputText.trim() || isProcessing}
                onClick={handleSendMessage}
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Loading indicator */}
            {isProcessing && (
              <div className="mt-4 text-center text-gray-500">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span>Processing...</span>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {isVoiceMode && (
              <div className="mt-3 text-center">
                <p className="text-sm text-red-600 flex items-center justify-center space-x-2">
                  <Mic className="w-4 h-4" />
                  <span>Recording... Speak now</span>
                </p>
              </div>
            )}
            
            {isTyping && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <span>Assistant is typing...</span>
                </p>
              </div>
            )}

            {/* Error Messages */}
            {chatError && (
              <div className="mt-3 text-center">
                <p className="text-sm text-red-600">
                  Error: {chatError}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sample Questions */}
        {showSampleQuestions && (
          <div className="mt-4">
            <SampleQuestions onQuestionClick={handleSampleQuestionClick} isVisible={showSampleQuestions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
