import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Bot } from 'lucide-react';
import MessageList from './components/MessageList';
import { useWebSocket } from './hooks/useWebSocket';
import { useVoiceToText } from './hooks/useVoiceToText';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { useChat } from './hooks/useChat';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import './index.css';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isVoice?: boolean;
  transcript?: string;
  audioUrl?: string;
}

const App: React.FC = () => {
  // Generate time-appropriate greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `Hello! ${getTimeGreeting()}! How can I help you today?`,
      sender: 'bot',
      timestamp: new Date(),
      isVoice: false
    }
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    startRecording, 
    stopRecording, 
    isRecording, 
    transcript,
    setTranscript,
    error: voiceError 
  } = useVoiceToText();
  
  const { speak, stopSpeaking, isSpeaking } = useTextToSpeech();
  
  const { 
    sendMessage, 
    isConnected: wsConnected, 
    lastMessage 
  } = useWebSocket('ws://localhost:5001/ws');

  const { sendTextMessage, sendVoiceMessage, isLoading: chatLoading, error: chatError } = useChat();
  
  const { 
    startRecording: startAudioRecording, 
    stopRecording: stopAudioRecording, 
    isRecording: isAudioRecording, 
    audioBlob, 
    error: audioError,
    clearAudio 
  } = useAudioRecorder();

  // Determine which recording mode we're in
  const isVoiceMode = isRecording || isAudioRecording;
  const isServerMode = isAudioRecording;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle WebSocket connection status
  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  // Handle incoming messages from WebSocket
  useEffect(() => {
    if (lastMessage) {
      try {
        console.log('Raw WebSocket message:', lastMessage);
        const data = JSON.parse(lastMessage);
        console.log('Parsed WebSocket data:', data);
        
        if (data.type === 'bot_response') {
          const botMessage: Message = {
            id: Date.now().toString(),
            text: data.text,
            sender: 'bot',
            timestamp: new Date(),
            isVoice: data.isVoice || false
          };
          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
          
          // Speak the response if not muted
          if (!isMuted && data.text) {
            speak(data.text);
          }
        } else if (data.type === 'typing') {
          setIsTyping(data.isTyping);
        } else if (data.type === 'error') {
          console.error('WebSocket error:', data.message);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: `Error: ${data.message}`,
            sender: 'bot',
            timestamp: new Date(),
            isVoice: false
          }]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        console.error('Raw message that failed to parse:', lastMessage);
      }
    }
  }, [lastMessage, isMuted, speak]);

  // Handle voice transcript - just update the input field, don't send automatically
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const handleVoiceToggle = () => {
    if (isVoiceMode) {
      // Stop any active recording
      if (isRecording) {
        stopRecording();
      }
      if (isAudioRecording) {
        stopAudioRecording();
      }
    } else {
      // Start server audio recording (better quality)
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

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Stop recording if currently recording
    if (isRecording) {
      stopRecording();
    }

    // Determine if this is a voice message (if we have transcript or were recording)
    const isVoiceMessage = transcript !== null || isRecording;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
      isVoice: isVoiceMessage,
      transcript: isVoiceMessage ? inputText.trim() : undefined
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Send text message to new chat API
      const response = await sendTextMessage(inputText.trim(), 1, 1);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        sender: 'bot',
        timestamp: new Date(),
        isVoice: response.is_voice,
        audioUrl: response.audio_url
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${chatError || 'Failed to send message'}`,
        sender: 'bot',
        timestamp: new Date(),
        isVoice: false
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    // Clear input and transcript
    setInputText('');
    setTranscript(null);
  };


  // Handle sending voice message when audio is ready
  useEffect(() => {
    if (audioBlob && !isAudioRecording) {
      handleSendVoiceMessage(audioBlob);
    }
  }, [audioBlob, isAudioRecording]);

  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    try {
      const response = await sendVoiceMessage(audioBlob, 1, 1);
      
      const userMessage: Message = {
        id: Date.now().toString(),
        text: response.transcript || 'Voice message',
        sender: 'user',
        timestamp: new Date(),
        isVoice: true,
        transcript: response.transcript
      };

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        sender: 'bot',
        timestamp: new Date(),
        isVoice: response.is_voice,
        audioUrl: response.audio_url
      };

      setMessages(prev => [...prev, userMessage, botMessage]);
      clearAudio();
    } catch (error) {
      console.error('Error sending voice message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${chatError || 'Failed to send voice message'}`,
        sender: 'bot',
        timestamp: new Date(),
        isVoice: false
      };
      setMessages(prev => [...prev, errorMessage]);
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
                <h1 className="text-2xl font-bold text-gray-800">Voice Assistant</h1>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
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
              voiceError={voiceError}
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
                disabled={!isConnected || chatLoading}
                title={isServerMode ? "Server Audio Processing" : "Voice Recording"}
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
                    chatLoading ? "Processing..." :
                    "Type a message or click mic to record..."
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  disabled={isVoiceMode || !isConnected || chatLoading}
                />
              </div>

              {/* Send Button */}
              <button
                className={`p-3 rounded-full transition-colors disabled:opacity-50 ${
                  isVoiceMode 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                disabled={!isConnected || !inputText.trim() || chatLoading}
                onClick={handleSendMessage}
                title={isVoiceMode ? "Click to stop recording and send" : "Send message"}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Loading indicator */}
            {chatLoading && (
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
                  <span>{isServerMode ? "Recording... Speak now" : "Listening... Speak now"}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
