# Telegram Bot Token Setup for StealthLink

## 🚨 CRITICAL: Set BOT_TOKEN in Render

Your StealthLink backend is running but needs the BOT_TOKEN environment variable set in Render.

### **Step 1: Get Your Bot Token**
1. **Open Telegram** and message [@BotFather](https://t.me/botfather)
2. **Send**: `/newbot`
3. **Choose name**: "StealthLink Secret Chat"
4. **Choose username**: "stealthlink_secret_bot" (or any unique name ending with "bot")
5. **Save the token**: Copy the token (format: `1234567890:ABCdef...`)

### **Step 2: Set Environment Variable in Render**
1. **Go to Render Dashboard**: [dashboard.render.com](https://dashboard.render.com)
2. **Find your service**: `stealthlink-mini-app`
3. **Click on the service name** to open details
4. **Click "Environment"** tab
5. **Click "Add Environment Variable"**:
   - **Name**: `BOT_TOKEN`
   - **Value**: Your bot token from @BotFather
   - **Type**: Secret (recommended)
6. **Save the variable**

### **Step 3: Redeploy**
After setting the BOT_TOKEN:
1. **Click "Manual Deploy"**
2. **Select latest commit**: `5295df0`
3. **Click "Deploy"**

### **Step 4: Verify Deployment**
Once redeployed, test:
- Visit: `https://stealthlink-mini-app.onrender.com/health`
- Should return: `{"status":"ok"}`

---

## 📝 **Bot Creation Commands for @BotFather**

```
/newbot
StealthLink Secret Chat
stealthlink_secret_bot
```

### **Bot Settings (After Creation)**
```
/setdescription
🔒 StealthLink - Secret Temporary Chat

Create private chat rooms with unique codes. Messages automatically disappear after 15 seconds for maximum privacy.

Features:
• 2-person secret chat rooms
• 15-second auto-deleting messages
• Real-time typing indicators
• Telegram authentication
• Mobile-optimized interface

Use /start to launch the Mini App!
```

```
/setabouttext
Secure temporary chat with disappearing messages. Perfect for sensitive conversations.
```

```
/setcommands
start - Launch StealthLink Mini App
help - Get help and support
about - About StealthLink
```

---

## ⚠️ **Important Notes**

1. **Never share your bot token** - Keep it secure
2. **The token format is**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
3. **After getting the token**, immediately set it in Render environment variables
4. **Redeploy the service** after setting the token

---

**🎯 Next Steps:**
1. Create your bot with @BotFather
2. Get the bot token
3. Set BOT_TOKEN in Render environment
4. Redeploy the service
5. Test the health endpoint
6. Deploy frontend to Vercel
7. Configure @BotFather with Vercel URL