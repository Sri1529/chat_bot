import React from 'react';
import { Bot, User, Mic, MessageSquare } from 'lucide-react';

const MessageList = ({ messages, isTyping, streamingText, isStreaming }) => {
  const formatTime = (timestamp) => {
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

      {/* Streaming Message */}
      {isStreaming && streamingText && (
        <div className="flex justify-start message-slide-in">
          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 max-w-xs lg:max-w-md">
            <div className="flex items-start space-x-2">
              <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm leading-relaxed">
                  {streamingText}
                  <span className="animate-pulse">|</span>
                </p>
                <p className="text-xs mt-1 text-gray-500">
                  {formatTime(new Date())}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Typing Indicator */}
      {isTyping && !isStreaming && (
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

      {/* Welcome Message */}
      {messages.length === 0 && !isTyping && !isStreaming && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Welcome to AI News Assistant</h3>
          <p className="text-gray-500 text-sm">
            Ask me about current news and events. I'm powered by the latest information!
          </p>
        </div>
      )}
    </div>
  );
};

export default MessageList;
