import React from 'react';
import { Bot, User, Mic, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isVoice?: boolean;
  transcript?: string;
  audioUrl?: string;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  voiceError?: string | null;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping, voiceError }) => {
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} message-slide-in`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
              message.sender === 'user'
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'
            }`}
          >
            <div className="flex items-start space-x-2">
              {message.sender === 'bot' && (
                <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
              )}
              {message.sender === 'user' && message.isVoice && (
                <Mic className="w-4 h-4 mt-1 flex-shrink-0" />
              )}
              {message.sender === 'user' && !message.isVoice && (
                <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <p className="text-sm leading-relaxed">{message.text}</p>
                
                {/* Show transcript if available and different from text */}
                {message.transcript && message.transcript !== message.text && (
                  <p className="text-xs text-gray-400 mt-1 italic">
                    Transcript: {message.transcript}
                  </p>
                )}
                
                {/* Audio player for bot messages with audio */}
                {message.sender === 'bot' && message.audioUrl && (
                  <div className="mt-2">
                    <audio controls className="w-full h-8">
                      <source src={`http://localhost:5001${message.audioUrl}`} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex justify-start message-slide-in">
          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-xs">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Error */}
      {voiceError && (
        <div className="flex justify-center">
          <div className="bg-red-100 text-red-800 rounded-lg px-4 py-2 text-sm">
            <p className="flex items-center space-x-2">
              <Mic className="w-4 h-4" />
              <span>Voice recognition error: {voiceError}</span>
            </p>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      {messages.length === 0 && !isTyping && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Welcome to Voice Assistant</h3>
          <p className="text-gray-500 text-sm">
            Start a conversation by typing a message or clicking the microphone to speak
          </p>
        </div>
      )}
    </div>
  );
};

export default MessageList;
