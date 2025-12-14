# Vercel Deployment Guide for StealthLink Mini App

This guide provides step-by-step instructions for deploying the StealthLink Mini App using Vercel for the frontend and alternative platforms for the backend.

## Overview

**Frontend Deployment**: Vercel (Perfect for static Mini App UI)  
**Backend Deployment**: Render, Heroku, or VPS (Required for WebSocket support)

## Prerequisites

- ✅ StealthLink project files (already created)
- ✅ Vercel account (free tier available)
- ✅ GitHub/GitLab repository
- ✅ Telegram Bot Token from @BotFather

## Step 1: Prepare Frontend for Vercel

The StealthLink frontend is already optimized for Vercel deployment:

### Required Files
```
stealth-chat-mini-app/
├── index.html          ✅ Ready for Vercel
├── styles.css          ✅ Optimized CSS
├── app.js             ✅ Frontend JavaScript
└── package.json       ✅ Dependencies (if any)
```

### Vercel Configuration

Create `vercel.json` in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.html",
      "use": "@vercel/static"
    },
    {
      "src": "styles.css", 
      "use": "@vercel/static"
    },
    {
      "src": "app.js",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options", 
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Step 2: Deploy Frontend to Vercel

### Method A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to project directory
cd stealth-chat-mini-app

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name: stealth-chat-mini-app
# - In which directory? ./
# - Override settings? No
```

### Method B: Vercel Dashboard

1. **Login to Vercel**: Go to [vercel.com](https://vercel.com) and sign in
2. **Add New Project**: Click "New Project"
3. **Import Git Repository**: Connect your Git provider and select the repository
4. **Configure Project**:
   - Framework Preset: Other
   - Root Directory: `./` (or your subdirectory)
   - Build Command: (leave empty for static site)
   - Output Directory: (leave empty)
5. **Deploy**: Click "Deploy"

### Step 3: Update Frontend Configuration

After deployment, Vercel will provide a URL like: `https://stealth-chat-mini-app-xxxx.vercel.app`

Update the `app.js` file to use your backend URL:

```javascript
// In app.js, find the apiCall method and update the baseUrl:
async apiCall(endpoint, options = {}) {
    const baseUrl = 'https://your-backend-domain.com'; // Replace with your backend URL
    // ... rest of the method
}
```

## Step 4: Deploy Backend Server

Since Vercel doesn't support persistent WebSocket connections, deploy the backend to:

### Option A: Render (Recommended)

1. **Create Render Account**: Go to [render.com](https://render.com)
2. **New Web Service**: Click "New" → "Web Service"
3. **Connect Repository**: Select your Git repository
4. **Configure Service**:
   - Name: `stealth-chat-backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node bot-server.js`
   - Environment Variables: Add `BOT_TOKEN=your_bot_token`
5. **Deploy**: Click "Create Web Service"

**Result**: You'll get a URL like `https://stealth-chat-backend.onrender.com`

### Option B: Heroku

```bash
# Install Heroku CLI and login
heroku login

# Create new app
heroku create stealth-chat-backend

# Set environment variables
heroku config:set BOT_TOKEN=your_bot_token
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Option C: Railway

1. **Connect Repository**: Go to [railway.app](https://railway.app)
2. **New Project**: "Deploy from GitHub repo"
3. **Configure**: Select your repository
4. **Environment**: Set `BOT_TOKEN` in environment variables
5. **Deploy**: Railway will automatically deploy

## Step 5: Update Environment Configuration

Update your `.env` file with the deployed URLs:

```env
# Frontend URL (from Vercel)
MINI_APP_URL=https://stealth-chat-mini-app-xxxx.vercel.app

# Backend URLs (from your chosen platform)
API_BASE_URL=https://stealth-chat-backend.onrender.com
WS_URL=wss://stealth-chat-backend.onrender.com/ws

# Bot Token
BOT_TOKEN=your_telegram_bot_token
```

## Step 6: Configure Telegram Bot

1. **Open @BotFather** on Telegram
2. **Select your bot**: `/mybots` → Select your StealthLink bot
3. **Configure Mini App**: 
   - Bot Settings → Configure Mini App → Enable Mini App
   - Set URL to your Vercel deployment: `https://stealth-chat-mini-app-xxxx.vercel.app`
4. **Set Menu Button** (Optional):
   - Use `/setmenubutton` command
   - Text: "StealthLink Chat"
   - URL: Your Vercel URL

## Step 7: Test Deployment

### Frontend Test
1. Visit your Vercel URL: `https://stealth-chat-mini-app-xxxx.vercel.app`
2. Verify the Mini App loads correctly
3. Check theme adaptation works
4. Test room creation/joining interface

### Backend Test
1. Visit your backend health check: `https://stealth-chat-backend.onrender.com/health`
2. Verify it returns `{"status":"ok"}`
3. Test WebSocket connection in browser dev tools

### Telegram Integration Test
1. Message your bot on Telegram
2. Use `/start` command
3. Verify Mini App launches correctly
4. Test full chat functionality

## Step 8: Custom Domain (Optional)

### Frontend Domain
1. **Vercel Dashboard**: Go to your project
2. **Settings**: Click "Settings" tab
3. **Domains**: Add your custom domain
4. **DNS**: Configure DNS records as instructed

### Backend Domain
1. **Platform Settings**: Configure custom domain in your backend platform
2. **SSL**: Most platforms provide automatic SSL certificates
3. **Update URLs**: Update all environment variables with new domain

## Cost Breakdown

- **Vercel**: Free tier (100GB bandwidth, unlimited deployments)
- **Render**: Free tier (with limitations) or $7/month for reliable service
- **Heroku**: $7/month for basic dyno
- **Railway**: $5/month for hobby plan

**Total Estimated Cost**: $5-14/month for production deployment

## Troubleshooting

### Common Issues

**1. CORS Errors**
```javascript
// Update bot-server.js CORS configuration:
const cors = require('cors');
app.use(cors({
    origin: ['https://your-vercel-domain.vercel.app'],
    credentials: true
}));
```

**2. WebSocket Connection Failed**
- Verify backend is running and accessible
- Check WebSocket URL format (wss:// for HTTPS)
- Ensure backend platform supports WebSockets

**3. Mini App Not Loading in Telegram**
- Verify bot token is correct
- Check Mini App URL in @BotFather configuration
- Ensure Vercel deployment is successful

### Debug Commands

```bash
# Check Vercel deployment
vercel logs

# Check backend logs
# (Platform-specific: Heroku logs, Render logs, etc.)

# Test health endpoint
curl https://your-backend-url.com/health

# Test WebSocket connection
wscat -c wss://your-backend-url.com/ws
```

## Performance Optimization

### Frontend (Vercel)
- ✅ Automatic CDN distribution
- ✅ Global edge locations
- ✅ Automatic compression
- ✅ HTTP/2 support

### Backend (Platform Specific)
- ✅ Auto-scaling (Render, Railway)
- ✅ Health check endpoints
- ✅ Automatic restarts
- ✅ SSL termination

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS Only**: All connections should use HTTPS/WSS
3. **CORS**: Restrict origins to your domains
4. **Rate Limiting**: Implement in backend code
5. **Input Validation**: Sanitize all user inputs

## Monitoring & Maintenance

### Vercel Analytics
- Built-in performance monitoring
- Real User Monitoring (RUM)
- Error tracking and reporting

### Backend Monitoring
- Platform-specific monitoring (Render, Heroku)
- Custom health check endpoints
- Log aggregation and analysis

### Regular Maintenance
- Update dependencies monthly
- Monitor bot usage through @BotFather
- Review security logs weekly
- Test Mini App functionality regularly

---

## Quick Reference Commands

```bash
# Deploy frontend to Vercel
vercel --prod

# Check Vercel deployment
vercel ls

# View Vercel logs
vercel logs

# Deploy backend to Render (if using Render CLI)
render deploy

# Check backend health
curl https://your-backend-url.com/health

# Test bot locally
curl -X POST https://api.telegram.org/bot{BOT_TOKEN}/sendMessage \
  -d chat_id=YOUR_CHAT_ID \
  -d text="Test message"
```

**🎉 Your StealthLink Mini App is now live on Vercel with a robust backend!**