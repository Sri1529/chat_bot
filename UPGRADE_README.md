# Chatbot Upgrade: Dual Input Support

This document describes the upgraded chatbot functionality that supports both typed and voice input with audio responses.

## 🚀 New Features

### 1. Dual Input Support
- **Text Input**: Type messages and get text responses
- **Voice Input**: Record audio and get both text and audio responses

### 2. Audio Processing Pipeline
- **Voice Input**: Browser audio recording → Server transcription (OpenAI Whisper) → Vector search → LLM response → Audio synthesis (OpenAI TTS)
- **Text Input**: Direct text → Vector search → LLM response

### 3. Enhanced UI
- Two microphone buttons:
  - **Blue Mic**: Browser Speech Recognition (existing functionality)
  - **Purple Mic**: Server Audio Processing (new functionality)
- Audio player for bot responses
- Loading indicators
- Transcript display

## 🏗️ Architecture

### Backend Changes

#### New Services
- **`AudioService`** (`backend/app/services/audio_service.py`):
  - `transcribe_audio()`: Convert audio to text using OpenAI Whisper
  - `synthesize_speech()`: Convert text to speech using OpenAI TTS
  - `create_temp_audio_file()`: Manage temporary audio files
  - `cleanup_audio_file()`: Clean up temporary files
  - `get_audio_url()`: Generate serving URLs

#### New API Endpoint
- **`POST /api/v1/chat`**:
  - Accepts either `text` or `audio` form data
  - Returns structured response with `answer`, `transcript`, `audio_url`
  - Handles both input types seamlessly

#### Static File Serving
- Audio files served from `/static/audio/` directory
- Automatic cleanup of temporary files

### Frontend Changes

#### New Hooks
- **`useChat`** (`frontend/src/hooks/useChat.ts`):
  - `sendTextMessage()`: Send text to new chat API
  - `sendVoiceMessage()`: Send audio to new chat API
  - Loading states and error handling

- **`useAudioRecorder`** (`frontend/src/hooks/useAudioRecorder.ts`):
  - Browser audio recording with MediaRecorder API
  - WebM format support
  - Error handling and cleanup

#### Enhanced Components
- **`MessageList`**: Now displays audio players and transcripts
- **`App`**: Dual input handling with loading states

## 🔧 Configuration

### Backend Environment Variables
```bash
# Existing variables
OPENAI_API_KEY=your_openai_api_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
# ... other existing variables

# No new variables required - uses existing OpenAI key
```

### Frontend Configuration
- Backend URL: `http://localhost:5001` (configurable in hooks)
- Audio format: WebM with Opus codec
- CORS: Configured for localhost development

## 🚀 Usage

### Starting the Application

1. **Backend**:
   ```bash
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm start
   ```

### Using the Interface

#### Text Input
1. Type in the text input field
2. Press Enter or click Send
3. Receive text response

#### Voice Input (Browser Speech Recognition)
1. Click the blue microphone button
2. Speak your message
3. Click Send to process
4. Receive text response

#### Voice Input (Server Audio Processing)
1. Click the purple microphone button
2. Speak your message
3. Click the microphone again to stop
4. Audio is automatically sent to server
5. Receive both text and audio response

## 📁 File Structure

```
chatbot/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   └── audio_service.py          # NEW: Audio processing
│   │   ├── api/v1/endpoints/
│   │   │   └── chat.py                   # UPDATED: New /chat endpoint
│   │   └── main.py                       # UPDATED: Static file serving
│   └── static/audio/                     # NEW: Audio file storage
├── frontend/
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useChat.ts                # NEW: Chat API integration
│   │   │   └── useAudioRecorder.ts       # NEW: Audio recording
│   │   ├── components/
│   │   │   └── MessageList.tsx           # UPDATED: Audio support
│   │   └── App.tsx                       # UPDATED: Dual input UI
│   └── ...
└── test_upgrade.py                       # NEW: Test script
```

## 🧪 Testing

### Automated Testing
```bash
# Run the test script
python test_upgrade.py
```

### Manual Testing
1. **Text Input**: Type "Hello" and verify text response
2. **Voice Input**: Use purple mic, say "Hello", verify audio response
3. **Audio Playback**: Check that audio files play correctly
4. **Error Handling**: Test with invalid inputs

## 🔄 API Flow

### Text Input Flow
```
User types → Frontend → POST /api/v1/chat (text) → Vector search → LLM → Text response
```

### Voice Input Flow
```
User speaks → Frontend records → POST /api/v1/chat (audio) → 
Transcribe → Vector search → LLM → Synthesize → Audio file → Response with audio URL
```

## 🎯 Key Benefits

1. **Flexibility**: Users can choose between text and voice input
2. **Accessibility**: Audio responses for voice input
3. **Performance**: Efficient audio processing pipeline
4. **Scalability**: Modular design for easy extension
5. **User Experience**: Intuitive dual-input interface

## 🔧 Troubleshooting

### Common Issues

1. **Audio not recording**: Check microphone permissions
2. **Audio not playing**: Verify static file serving is working
3. **Transcription errors**: Check OpenAI API key and quota
4. **CORS errors**: Ensure backend CORS is configured correctly

### Debug Steps

1. Check browser console for errors
2. Verify backend logs for processing errors
3. Test API endpoints directly with curl/Postman
4. Check file permissions for audio directory

## 🚀 Future Enhancements

1. **Streaming Audio**: Real-time audio streaming
2. **Base64 Audio**: Inline audio data instead of files
3. **Audio Formats**: Support for more audio formats
4. **Voice Cloning**: Custom voice synthesis
5. **Multi-language**: Support for multiple languages

## 📝 Notes

- Audio files are temporarily stored and cleaned up automatically
- The system maintains backward compatibility with existing WebSocket functionality
- All existing features continue to work as before
- The upgrade is modular and can be easily extended
