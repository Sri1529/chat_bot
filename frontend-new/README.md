# VoiceBot Frontend - React Application

A modern React frontend for an AI-powered voice chatbot with streaming responses, voice recording capabilities, and real-time chat interface.

## 🚀 Features

- **Real-time Chat Interface** with streaming responses
- **Voice Recording** with audio input support
- **Text-to-Speech** for bot responses
- **Session Management** with chat history
- **Responsive Design** with Tailwind CSS
- **Modern UI/UX** with smooth animations
- **Error Handling** and loading states
- **Docker Support** for easy deployment

## 🛠️ Tech Stack

- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Fetch API
- **Audio**: Web Audio API
- **Build Tool**: Create React App
- **Deployment**: Docker, Netlify, Vercel

## 📦 Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Backend API running (see backend README)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   echo "REACT_APP_API_URL=http://localhost:3000/api" > .env
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Build and Run

1. **Build the Docker image**
   ```bash
   docker build -t voicebot-frontend .
   ```

2. **Run the container**
   ```bash
   docker run -d \
     -p 80:80 \
     -e REACT_APP_API_URL=http://your-backend-url/api \
     voicebot-frontend
   ```

### Using Docker Compose

The frontend is included in the main `docker-compose.yml` file:

```bash
docker-compose up frontend
```

## ☁️ Cloud Deployment

### Netlify

1. **Connect your repository** to Netlify
2. **Set build settings**:
   - Build command: `npm run build`
   - Publish directory: `build`
3. **Set environment variables**:
   - `REACT_APP_API_URL`: Your backend API URL
4. **Deploy** automatically

### Vercel

1. **Connect your repository** to Vercel
2. **Set environment variables**:
   - `REACT_APP_API_URL`: Your backend API URL
3. **Deploy** automatically

## 🎨 UI Components

### Main Components

- **App**: Main application component with chat interface
- **MessageList**: Displays chat messages with streaming support
- **useChat**: Custom hook for API communication
- **useTextToSpeech**: Text-to-speech functionality
- **useAudioRecorder**: Voice recording capabilities

### Features

- **Streaming Responses**: Real-time message streaming
- **Voice Recording**: Browser-based audio recording
- **Session Management**: Persistent chat sessions
- **Responsive Design**: Mobile-friendly interface
- **Error Handling**: User-friendly error messages
- **Loading States**: Visual feedback during operations

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:3000/api` |

### API Integration

The frontend communicates with the backend through:

- **Chat API**: `/api/chat` for sending messages
- **History API**: `/api/chat/history/:sessionId` for chat history
- **Reset API**: `/api/chat/reset/:sessionId` for clearing history
- **Streaming API**: `/api/chat/stream` for real-time responses

## 📱 Usage

### Basic Chat

1. **Type a message** in the input field
2. **Press Enter** or click Send
3. **View streaming response** in real-time
4. **Use voice recording** by clicking the microphone button

### Voice Features

- **Click microphone** to start recording
- **Speak your message** clearly
- **Click microphone again** to stop and send
- **Toggle mute** to disable text-to-speech

### Session Management

- **Chat history** is automatically saved
- **Reset button** clears current session
- **Sessions persist** across browser refreshes

## 🎯 Key Features

### Streaming Responses

The frontend supports real-time streaming of AI responses:

```javascript
await sendStreamingMessage(
  message,
  (chunk) => {
    // Handle each chunk of the response
    setStreamingText(prev => prev + chunk);
  },
  (sessionId) => {
    // Handle completion
    setIsStreaming(false);
  },
  (error) => {
    // Handle errors
    console.error('Streaming error:', error);
  }
);
```

### Voice Recording

Browser-based audio recording with Web Audio API:

```javascript
const { startRecording, stopRecording, audioBlob } = useAudioRecorder();

// Start recording
await startRecording();

// Stop recording and get audio blob
stopRecording();
```

### Text-to-Speech

Built-in browser speech synthesis:

```javascript
const { speak, stopSpeaking } = useTextToSpeech();

// Speak text
speak("Hello, how can I help you?");

// Stop speaking
stopSpeaking();
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🎨 Styling

The application uses Tailwind CSS for styling with custom animations:

- **Message animations**: Slide-in effects for new messages
- **Typing indicators**: Animated dots for bot responses
- **Responsive design**: Mobile-first approach
- **Dark mode ready**: CSS variables for theming

## 🔒 Security

- **CORS handling**: Proper cross-origin request handling
- **Input validation**: Client-side validation for user inputs
- **Error boundaries**: Graceful error handling
- **Secure headers**: Security headers in production builds

## 🚀 Performance

- **Code splitting**: Automatic code splitting with React
- **Lazy loading**: Components loaded on demand
- **Optimized builds**: Production builds with minification
- **Caching**: Browser caching for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed description
3. Include browser and environment details

## 🔄 Migration from Original Frontend

This React frontend replaces the original with the following improvements:

- **Modern React**: Updated to React 18 with hooks
- **Better UX**: Streaming responses and real-time updates
- **Improved Design**: Modern UI with Tailwind CSS
- **Enhanced Features**: Better voice recording and TTS
- **Session Management**: Persistent chat sessions
- **Error Handling**: Better error states and user feedback
- **Performance**: Optimized rendering and API calls
- **Accessibility**: Better keyboard navigation and screen reader support
