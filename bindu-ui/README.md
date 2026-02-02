# Bindu UI - Modern Chat Interface for Bindu Agents

A modern, containerized web UI for testing Bindu agents locally. Inspired by Hugging Face Chat, this interface provides a delightful developer experience with zero setup required.

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Pull and run the latest image
docker run --rm -p 5173:5173 \
  -e AGENT_BASE_URL=http://localhost:3773 \
  getbindu/bindu-ui:latest

# Or build locally
git clone https://github.com/getbindu/bindu-ui.git
cd bindu-ui
docker build -t bindu-ui .
docker run --rm -p 5173:5173 bindu-ui
```

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/getbindu/bindu-ui.git
cd bindu-ui

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## 🌟 Features

- **Modern UI/UX**: Clean, responsive interface inspired by Hugging Face Chat
- **Dark/Light Theme**: Built-in theme switching
- **Real-time Chat**: Live messaging with typing indicators
- **Conversation Management**: Multiple conversations with context switching
- **Agent Information**: View agent details, skills, and DID identity
- **Authentication**: JWT token support for secure agent access
- **Payment Support**: x402 payment flow integration
- **Task Polling**: Real-time task status updates
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Zero Dependencies**: Pure Vanilla JavaScript - no React required
- **Containerized**: Docker-based deployment for easy setup

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_BASE_URL` | `http://localhost:3773` | Bindu agent server URL |
| `VITE_APP_TITLE` | `Bindu Agent Chat` | Application title |

### Settings

Access settings via the ⚙️ button in the header:

- **Agent URL**: Configure your Bindu agent endpoint
- **Auth Token**: Set JWT token for authenticated agents
- **Auto-scroll**: Toggle automatic message scrolling

## 🔧 Development

### Project Structure

```
bindu-ui/
├── src/
│   ├── index.html          # Main HTML file
│   ├── styles/             # CSS styles
│   │   ├── main.css        # Base styles and theme
│   │   └── components.css  # Component styles
│   └── js/                 # JavaScript modules
│       ├── main.js          # Application entry point
│       ├── api-client.js    # Bindu API client
│       ├── state-manager.js # State management
│       └── ui-components.js # UI components
├── Dockerfile              # Docker configuration
├── nginx.conf              # Nginx configuration
├── package.json            # Dependencies and scripts
└── vite.config.js          # Vite build configuration
```

### Build Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run
```

### Architecture

The UI is built with **Vanilla JavaScript** using modern ES6+ modules:

- **State Management**: Simple event-driven state manager
- **API Client**: JSON-RPC client for Bindu protocol
- **Components**: Reusable UI components
- **Theme System**: CSS custom properties for theming
- **Responsive**: Mobile-first responsive design

## 🔌 API Integration

The UI communicates with Bindu agents via the standard JSON-RPC protocol:

### Supported Endpoints

- `POST /` - JSON-RPC API calls
- `GET /.well-known/agent.json` - Agent metadata
- `GET /agent/skills` - Skills list
- `GET /health` - Health check
- `GET /agent/skills/{id}` - Skill details
- `POST /did/resolve` - DID resolution

### JSON-RPC Methods

- `message/send` - Send messages to agent
- `tasks/get` - Get task status
- `tasks/cancel` - Cancel running task
- `tasks/list` - List all tasks
- `contexts/list` - List conversations
- `contexts/clear` - Clear conversation
- `tasks/feedback` - Submit feedback

## 🎨 UI Components

### Layout

- **Header**: Agent info, theme toggle, settings
- **Sidebar**: Conversation list, new chat button
- **Chat Area**: Messages, input field, typing indicators
- **Modals**: Settings, confirmations, feedback

### Features

- **Message Types**: User/agent messages with markdown support
- **Status Indicators**: Sending, sent, error states
- **Typing Indicators**: Real-time typing feedback
- **Example Prompts**: Quick-start message suggestions
- **Keyboard Shortcuts**: Ctrl+K for new chat, Escape to close modals

## 🐳 Docker Deployment

### Building the Image

```bash
# Build locally
docker build -t bindu-ui .

# Build with custom agent URL
docker build --build-arg AGENT_BASE_URL=https://your-agent.com -t bindu-ui .
```

### Running the Container

```bash
# Basic usage
docker run --rm -p 5173:5173 bindu-ui

# With custom agent URL
docker run --rm -p 5173:5173 \
  -e AGENT_BASE_URL=https://your-agent.com \
  bindu-ui

# With authentication
docker run --rm -p 5173:5173 \
  -e AGENT_BASE_URL=https://your-agent.com \
  -e AUTH_TOKEN=your-jwt-token \
  bindu-ui
```

### Production Considerations

- **Security**: Runs as non-root user
- **Performance**: Gzip compression, static asset caching
- **Health Checks**: Built-in health endpoint
- **Headers**: Security headers and CSP policies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Open a Pull Request

### Development Guidelines

- Use Vanilla JavaScript (no frameworks)
- Follow the existing code style
- Test on multiple browsers and devices
- Update documentation for new features

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/getbindu/bindu-ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/getbindu/bindu-ui/discussions)
- **Documentation**: [Bindu Docs](https://docs.getbindu.com)

## 🔗 Related Projects

- [Bindu Framework](https://github.com/getbindu/Bindu) - Agent framework
- [Bindu Directory](https://bindus.directory) - Agent discovery
- [Hugging Face Chat UI](https://github.com/huggingface/chat-ui) - Design inspiration

---

Built with ❤️ by the Bindu team in Amsterdam
