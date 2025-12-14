# Telegram Bot Setup Guide

This guide will walk you through setting up your StealthLink Mini App bot with Telegram's @BotFather.

## Prerequisites

- Telegram account
- Access to @BotFather on Telegram
- Deployed Mini App URL (HTTPS required for production)

## Step 1: Create Your Bot

1. **Start @BotFather**: Message [@BotFather](https://t.me/botfather) on Telegram

2. **Create new bot**: Send the command `/newbot`

3. **Choose a name**: Enter a name for your bot (e.g., "StealthLink Chat")

4. **Choose a username**: Enter a unique username ending with "bot" (e.g., "stealthlink_chatbot")

5. **Save the token**: @BotFather will provide you with a bot token. Save this securely - you'll need it for the `BOT_TOKEN` environment variable.

## Step 2: Configure Bot Settings

### Set Description and About Text

```
/setdescription
StealthLink - Secure temporary chat with disappearing messages

Create private chat rooms that automatically delete all messages after 15 seconds. 
Perfect for sensitive conversations that need to remain confidential.

🔒 No message history
⏰ Auto-deleting messages  
👥 Two-person sessions
📱 Seamless Telegram integration
```

```
/setabouttext
Secure temporary chat with disappearing messages. Create private rooms and chat with automatic message deletion after 15 seconds.
```

### Set Bot Picture

```
/setuserpic
```

Upload a logo image for your bot (recommended: 512x512px PNG)

### Configure Commands

```
/setcommands
start - Launch StealthLink Mini App
help - Get help and support information
about - About StealthLink
```

### Set Privacy Mode

```
/setprivacy
Disable
```

This allows your bot to receive all messages, which is necessary for the Mini App functionality.

## Step 3: Configure Mini App URL

### Option A: Set as Main Mini App (Recommended)

```
/setinline
StealthLink
```

Then configure as main Mini App:

```
/setmenubutton
StealthLink Chat
https://your-domain.com
```

### Option B: Set Web App URL

If you want to launch the Mini App from specific commands:

1. Go to Bot Settings → Configure Mini App → Enable Mini App
2. Set the URL to your deployed Mini App: `https://your-domain.com`
3. Configure loading screen with your bot's icon and colors

## Step 4: Set Up Bot Token

Add your bot token to the environment variables:

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your bot token
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**⚠️ Important**: Never share your bot token publicly or commit it to version control.

## Step 5: Configure Mini App Launch

### Direct Link Launch

Your bot will support these launch methods:

1. **Main Menu Launch**: Users can launch from bot's menu button
2. **Direct Command**: `/start` opens the Mini App
3. **Room-specific Launch**: `/start ROOMCODE` opens Mini App with specific room

### URL Formats

- Base launch: `https://t.me/your_bot_username`
- Room-specific: `https://t.me/your_bot_username?startapp=ROOMCODE`
- Compact mode: `https://t.me/your_bot_username?startapp&mode=compact`

## Step 6: Test Your Bot

1. **Start your server**: `npm start`

2. **Test the bot**: Message your bot on Telegram

3. **Launch Mini App**: Use the `/start` command

4. **Verify functionality**:
   - Mini App loads correctly
   - Theme matches Telegram
   - Create/join room works
   - Messages send and delete after 15 seconds

## Bot Commands Reference

| Command | Description | Response |
|---------|-------------|----------|
| `/start` | Launch Mini App | Opens StealthLink interface |
| `/start ABC123` | Join specific room | Opens Mini App with room code |
| `/help` | Show help | Bot information and usage |
| `/about` | About the bot | Bot description and features |

## Advanced Configuration

### Set Bot Location (Optional)

```
/setlocation
latitude: 40.7128
longitude: -74.0060
```

### Configure Inline Mode

```
/setinline
Search for secret chat rooms and join private conversations
```

### Set Game Shortcuts (If applicable)

```
/setgameshortcut
StealthLink
```

## Bot Analytics and Monitoring

### Check Bot Statistics

1. Go to [@BotFather](https://t.me/botfather)
2. Select your bot
3. View analytics: `/mybots` → Your Bot → Analytics

### Monitor Usage

Your bot provides analytics for:
- Message count
- User interactions
- Mini App launches
- Daily active users

## Security Best Practices

### 1. Token Security
- ✅ Store bot token in environment variables
- ✅ Use strong, unique tokens
- ✅ Rotate tokens regularly
- ❌ Never commit tokens to version control
- ❌ Never share tokens publicly

### 2. User Privacy
- ✅ Implement rate limiting
- ✅ Validate user input
- ✅ Use HTTPS for all communications
- ❌ Store user messages permanently
- ❌ Log sensitive user data

### 3. Server Security
- ✅ Use HTTPS certificates
- ✅ Implement CORS restrictions
- ✅ Monitor for unusual activity
- ✅ Keep dependencies updated
- ❌ Run as root user
- ❌ Expose sensitive ports

## Troubleshooting

### Common Issues

**1. "Bot was blocked by the user"**
- User hasn't started the bot yet
- Solution: User needs to send `/start` first

**2. "Chat not found"**
- Bot was deleted or token is invalid
- Solution: Verify bot token and bot status

**3. Mini App not loading**
- URL is not HTTPS (required for production)
- Solution: Deploy with SSL certificate

**4. Webhook errors**
- Webhook URL not configured properly
- Solution: Use long polling (default) or set webhooks correctly

### Debug Mode

Enable debug logging in your environment:

```env
DEBUG_MODE=true
NODE_ENV=development
```

Check logs for detailed error messages.

## Production Deployment Checklist

- [ ] Bot token configured
- [ ] Mini App URL deployed with HTTPS
- [ ] All environment variables set
- [ ] Server running and accessible
- [ ] Health check endpoint working
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Security scanning completed

## Support and Maintenance

### Regular Maintenance
- Monitor bot usage and performance
- Update dependencies monthly
- Review security logs weekly
- Test Mini App functionality regularly
- Monitor Telegram API changes

### Getting Help
- Telegram Bot API documentation: https://core.telegram.org/bots/api
- Mini Apps documentation: https://core.telegram.org/bots/webapps
- BotFather support: [@BotFather](https://t.me/botfather)

---

**🎉 Congratulations!** Your StealthLink bot is now ready to provide secure, temporary chat sessions to Telegram users.