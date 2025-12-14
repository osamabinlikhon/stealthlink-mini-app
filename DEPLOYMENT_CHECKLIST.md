# 🚀 StealthLink Vercel Deployment Checklist

Use this checklist to ensure successful deployment of your StealthLink Mini App.

## ✅ Pre-Deployment Checklist

### 1. Project Preparation
- [ ] Downloaded/copied all StealthLink project files
- [ ] Verified `index.html`, `styles.css`, and `app.js` are present
- [ ] Created Vercel account at [vercel.com](https://vercel.com)
- [ ] Connected GitHub/GitLab account to Vercel

### 2. Bot Setup
- [ ] Created Telegram bot with [@BotFather](https://t.me/botfather)
- [ ] Received bot token (format: `1234567890:ABCdef...`)
- [ ] Set bot description and commands
- [ ] Saved bot token securely

### 3. Backend Platform Selection
Choose one backend platform:
- [ ] **Render** (Recommended) - Created account and verified WebSocket support
- [ ] **Heroku** - Created account and installed Heroku CLI
- [ ] **Railway** - Created account and connected GitHub
- [ ] **VPS** - Prepared server with Node.js support

## ✅ Frontend Deployment (Vercel)

### 4. Vercel Configuration
- [ ] Created `vercel.json` file in project root
- [ ] Verified security headers are configured
- [ ] Ensured all static files are in project root

### 5. Deploy to Vercel
Choose deployment method:

**Option A: Vercel CLI**
- [ ] Installed Vercel CLI: `npm install -g vercel`
- [ ] Logged in: `vercel login`
- [ ] Deployed: `vercel --prod`
- [ ] Noted deployment URL (e.g., `https://stealth-chat-xxx.vercel.app`)

**Option B: Vercel Dashboard**
- [ ] Clicked "New Project" in Vercel dashboard
- [ ] Imported Git repository
- [ ] Selected framework: "Other"
- [ ] Set root directory to `./`
- [ ] Clicked "Deploy"
- [ ] Noted deployment URL

### 6. Frontend Testing
- [ ] Visited Vercel URL in browser
- [ ] Verified Mini App loads without errors
- [ ] Checked responsive design on mobile
- [ ] Tested theme adaptation (light/dark mode)

## ✅ Backend Deployment

### 7. Backend Platform Deployment

**For Render:**
- [ ] Created new Web Service
- [ ] Connected repository
- [ ] Set environment variables:
  - `BOT_TOKEN=your_bot_token`
  - `NODE_ENV=production`
- [ ] Configured build command: `npm install`
- [ ] Configured start command: `node bot-server.js`
- [ ] Deployed and noted backend URL

**For Heroku:**
- [ ] Created new app: `heroku create stealth-chat-backend`
- [ ] Set environment variables:
  - `heroku config:set BOT_TOKEN=your_bot_token`
  - `heroku config:set NODE_ENV=production`
- [ ] Deployed: `git push heroku main`
- [ ] Noted backend URL

**For Railway:**
- [ ] Created new project from GitHub
- [ ] Added environment variable: `BOT_TOKEN=your_bot_token`
- [ ] Deployed automatically
- [ ] Noted backend URL

### 8. Backend Testing
- [ ] Visited health endpoint: `https://your-backend-url.com/health`
- [ ] Verified response: `{"status":"ok"}`
- [ ] Tested WebSocket connection capability
- [ ] Checked backend logs for errors

## ✅ Configuration & Integration

### 9. Environment Configuration
- [ ] Updated `.env` file with all deployed URLs:
  ```
  BOT_TOKEN=your_bot_token
  MINI_APP_URL=https://stealth-chat-xxx.vercel.app
  API_BASE_URL=https://your-backend-url.com
  WS_URL=wss://your-backend-url.com/ws
  ```

### 10. Frontend URL Configuration
- [ ] Updated `app.js` with correct backend URL:
  ```javascript
  const baseUrl = 'https://your-backend-url.com';
  ```
- [ ] Pushed changes to Git repository
- [ ] Verified Vercel auto-redeployment

### 11. Telegram Bot Configuration
- [ ] Opened @BotFather on Telegram
- [ ] Selected your StealthLink bot
- [ ] Configured Mini App URL: `https://stealth-chat-xxx.vercel.app`
- [ ] Set menu button (optional): "StealthLink Chat"
- [ ] Verified bot settings

## ✅ Final Testing

### 12. End-to-End Testing
- [ ] Messaged bot on Telegram with `/start`
- [ ] Verified Mini App launches correctly
- [ ] Tested room creation functionality
- [ ] Tested room joining with code
- [ ] Sent messages and verified 15-second deletion
- [ ] Confirmed typing indicators work
- [ ] Tested on both iOS and Android devices
- [ ] Verified dark/light theme switching

### 13. Performance Testing
- [ ] Mini App loads in under 3 seconds
- [ ] Messages send and receive instantly
- [ ] No JavaScript errors in browser console
- [ ] Smooth animations and transitions
- [ ] Battery-efficient on mobile devices

### 14. Security Verification
- [ ] All connections use HTTPS/WSS
- [ ] No sensitive data in frontend code
- [ ] Environment variables properly secured
- [ ] CORS configured correctly
- [ ] Input validation working

## ✅ Post-Deployment

### 15. Monitoring Setup
- [ ] Set up Vercel Analytics (optional)
- [ ] Configured backend platform monitoring
- [ ] Set up error logging if needed
- [ ] Documented all URLs and credentials

### 16. Documentation
- [ ] Updated team documentation with deployment URLs
- [ ] Created backup of environment configuration
- [ ] Documented any custom settings
- [ ] Shared bot username with users

## 🚨 Troubleshooting Quick Fixes

### Frontend Issues
**Mini App not loading:**
- [ ] Check Vercel deployment status
- [ ] Verify all files are in correct locations
- [ ] Check browser console for errors

**Theme not working:**
- [ ] Verify Telegram WebApp SDK is loading
- [ ] Check CORS settings for Telegram domains
- [ ] Test with different Telegram themes

### Backend Issues
**Health check failing:**
- [ ] Verify bot token is correct
- [ ] Check backend platform logs
- [ ] Ensure required dependencies are installed

**WebSocket connection failed:**
- [ ] Verify backend supports WebSockets
- [ ] Check URL format (wss:// for HTTPS)
- [ ] Test WebSocket endpoint manually

### Integration Issues
**Bot not responding:**
- [ ] Verify bot token in @BotFather
- [ ] Check bot privacy settings
- [ ] Test bot with simple `/start` command

**Mini App not launching:**
- [ ] Verify Mini App URL in @BotFather
- [ ] Check URL accessibility (must be HTTPS)
- [ ] Test URL in regular browser

## 📞 Emergency Contacts

If issues persist:
1. **Vercel Support**: [vercel.com/support](https://vercel.com/support)
2. **Backend Platform Support**: Check your platform's documentation
3. **Telegram Support**: [@BotFather](https://t.me/botfather)

## 🎉 Success Metrics

Your deployment is successful when:
- ✅ Mini App launches from Telegram `/start` command
- ✅ Users can create and join chat rooms
- ✅ Messages send/receive in real-time
- ✅ Messages disappear after exactly 15 seconds
- ✅ Typing indicators work correctly
- ✅ App works on both iOS and Android
- ✅ No errors in browser console
- ✅ All features match the original requirements

---

**Checklist completed?** Your StealthLink Mini App is now live and ready for users! 🚀