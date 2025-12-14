# StealthLink - Secret Temporary Chat Mini App

🔒 **A secure, temporary chat Mini App for Telegram with disappearing messages and real-time communication.**

## Features

- **🔐 Secret Chat Sessions**: Create or join private chat rooms with unique codes
- **⏰ Disappearing Messages**: All messages automatically delete after 15 seconds
- **📱 Native Integration**: Seamlessly integrated with Telegram using the Mini App SDK
- **👥 Real-time Communication**: Live typing indicators and online status tracking
- **🎨 Dark Theme**: Stealth-optimized dark interface with OLED battery savings
- **🔒 Telegram Authentication**: Secure login using Telegram user data
- **📱 Responsive Design**: Optimized for mobile devices with safe area support
- **⚡ Snappy Performance**: Fast loading and smooth animations following Telegram design guidelines

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Telegram      │    │   Mini App       │    │   Bot Server    │
│   Client        │◄──►│   (Frontend)     │◄──►│   (Backend)     │
│                 │    │                  │    │                 │
│ • WebApp SDK    │    │ • HTML/CSS/JS    │    │ • Node.js       │
│ • Theme Data    │    │ • Real-time UI   │    │ • WebSocket     │
│ • User Auth     │    │ • Message Timer  │    │ • Room Mgmt     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Prerequisites

- Telegram Bot Token from [@BotFather](https://t.me/botfather)
- **For Vercel Deployment** (Recommended):
  - Vercel account (free)
  - GitHub/GitLab repository
  - Backend platform account (Render/Heroku/Railway)
- **For VPS Deployment**:
  - Node.js 16+ 
  - Public server with Node.js support

### 2. Choose Deployment Method

**🚀 Recommended: Vercel + Backend Platform** (Easiest)
- Frontend: Vercel (free, global CDN, auto-deployments)
- Backend: Render/Heroku/Railway (WebSocket support)
- Guide: [`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md)

**🐳 Alternative: Docker/VPS** (Full control)
- Complete stack on your own server
- Guide: Docker commands below

### 3. Quick Setup (Vercel Method)

```bash
# Clone the repository
git clone <repository-url>
cd stealth-chat-mini-app

# Install Vercel CLI (optional, for command line deployment)
npm install -g vercel

# Follow VERCEL_DEPLOYMENT.md for detailed steps
```

### 4. Setup Telegram Bot

1. **Create Bot**: Message [@BotFather](https://t.me/botfather) with `/newbot`
2. **Save Bot Token**: Keep this secure for environment variables
3. **Configure Mini App**: Set URL after frontend deployment

### 5. Run Development (Local Testing)

```bash
# Install dependencies for local development
npm install

# Copy environment template
cp .env.example .env

# Configure bot token in .env
BOT_TOKEN=your_telegram_bot_token_here

# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Deployment

### 🚀 Recommended: Vercel + Backend Platform

**Frontend**: Deploy static Mini App to Vercel (free, fast, global CDN)  
**Backend**: Deploy Node.js server to Render/Heroku/Railway (WebSocket support required)

**📖 See detailed guide**: [`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md)  
**📋 Use checklist**: [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md)

### Option 1: VPS Deployment

```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start bot-server.js --name stealth-chat

# Configure nginx reverse proxy
# /etc/nginx/sites-available/stealth-chat
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### Option 2: Docker Deployment

```bash
# Build and run with Docker
docker build -t stealth-chat .
docker run -p 3000:3000 -p 3001:3001 --env-file .env stealth-chat
```

### Option 3: Cloud Platform

- **Heroku**: `git push heroku main`
- **Railway**: Connect repository and deploy
- **DigitalOcean App Platform**: Deploy directly from GitHub

## Bot Setup Commands

The bot supports these commands:

```
/start - Launch StealthLink Mini App
/start <room_code> - Join specific room
```

### Bot Configuration in @BotFather:

```
/setdescription
StealthLink - Secure temporary chat with disappearing messages

/setabouttext
Private, temporary chat sessions that automatically delete messages after 15 seconds.

/setinline
Search for secret rooms and join private chats
```

## Mini App Features

### 🔐 Session Management
- **Create Room**: Generate unique 6-character room codes
- **Join Room**: Enter room code to join existing session
- **Auto Cleanup**: Rooms deleted after 1 hour of inactivity

### 💬 Chat Features
- **Real-time Messages**: Instant message delivery via WebSocket
- **Typing Indicators**: Live typing status for both users
- **Online Status**: Connection status indicators
- **Message Limits**: 1000 characters per message

### ⏰ Disappearing Messages
- **15-Second Timer**: Visual countdown progress bar
- **Smooth Deletion**: Blur + fade animation
- **Auto Cleanup**: No message history retention
- **Haptic Feedback**: Tactile confirmation on deletion

### 🎨 UI/UX
- **Telegram Theme**: Dynamic theme adaptation
- **OLED Optimization**: Pure black backgrounds
- **Safe Areas**: iPhone notch and home indicator support
- **Smooth Animations**: 60fps transitions
- **Accessibility**: Proper contrast ratios and touch targets

## Technical Specifications

### Frontend
- **Framework**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 with CSS Variables
- **Typography**: Inter + JetBrains Mono
- **Icons**: SVG icons for crisp rendering
- **Bundle Size**: ~50KB total (HTML + CSS + JS)

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **WebSocket**: ws library for real-time communication
- **Bot Framework**: grammY (grammy)
- **CORS**: Configured for Telegram domains

### Security Features
- **User Validation**: Telegram user data verification
- **Rate Limiting**: Message frequency protection
- **Input Sanitization**: XSS protection
- **Session Isolation**: Room-based message routing
- **No Persistence**: Zero message storage on server

## API Reference

### REST Endpoints

```
POST /api/rooms/create     - Create new chat room
POST /api/rooms/join       - Join existing room
GET  /api/rooms/:code/msgs - Get room messages
POST /api/messages/send    - Send message to room
GET  /health               - Server health check
```

### WebSocket Events

```
join_room     - Join chat room
leave_room    - Leave chat room
new_message   - Broadcast new message
typing_start  - User started typing
typing_stop   - User stopped typing
user_status   - Online/away status
```

### Message Format

```json
{
  "id": "unique_message_id",
  "text": "message_content",
  "senderId": 123456789,
  "roomCode": "AB-123CD",
  "timestamp": 1640995200000,
  "expiresAt": 1640995215000
}
```

## Development

### Project Structure

```
stealth-chat-mini-app/
├── index.html              # Main HTML file
├── styles.css              # CSS styling
├── app.js                  # Frontend JavaScript
├── bot-server.js           # Backend server
├── package.json            # Dependencies
├── package-frontend.json   # Frontend-only package.json (for Vercel)
├── .env.example            # Environment template
├── vercel.json             # Vercel deployment configuration
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose setup
├── deploy.sh               # Automated deployment script
├── README.md              # Main documentation
├── VERCEL_DEPLOYMENT.md   # Vercel-specific deployment guide
├── DEPLOYMENT_CHECKLIST.md # Deployment checklist
├── BOT_SETUP.md           # Telegram bot setup guide
├── PROJECT_SUMMARY.md     # Complete project overview
└── .gitignore             # Git ignore rules
```

### Development Commands

```bash
npm run dev      # Start development server
npm start        # Start production server
npm test         # Run tests (if configured)
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Telegram bot token | Yes |
| `PORT` | HTTP server port | No (default: 3000) |
| `WS_PORT` | WebSocket port | No (default: 3001) |
| `NODE_ENV` | Environment mode | No (default: development) |

## Troubleshooting

### Common Issues

**1. Bot not responding**
- Verify `BOT_TOKEN` is correct
- Check bot is started with `bot.start()`
- Ensure bot has proper permissions

**2. Mini App not loading**
- Verify Mini App URL in bot configuration
- Check HTTPS certificate (required for production)
- Test URL accessibility

**3. WebSocket connection failed**
- Verify WebSocket server is running
- Check firewall rules for WebSocket port
- Ensure CORS is properly configured

**4. Messages not disappearing**
- Check browser JavaScript console for errors
- Verify timer logic in frontend
- Ensure server message cleanup is working

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=stealth-chat:*
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open GitHub issue
- Contact: [Your Contact Info]

## Security Notice

⚠️ **Important**: This app handles sensitive communications. Always:
- Use HTTPS in production
- Regularly update dependencies
- Monitor for security vulnerabilities
- Follow Telegram's Mini App guidelines

---

**Built with ❤️ for secure, private communications**