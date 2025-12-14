const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const crypto = require('crypto');
const { Bot } = require('grammy');

class StealthChatBot {
    constructor() {
        this.app = express();
        // Ensure port is a valid number, fallback to 3000 for HTTP and 3001 for WebSocket
        this.httpPort = parseInt(process.env.PORT || '3000', 10);
        this.wsPort = parseInt(process.env.WS_PORT || (this.httpPort + 1).toString(), 10);
        this.botToken = process.env.BOT_TOKEN;
        this.rooms = new Map();
        this.connections = new Map();
        this.messages = new Map();
        
        this.setupExpress();
        this.setupWebSocket();
        this.setupBot();
    }

    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // API Routes
        this.app.post('/api/rooms/create', (req, res) => this.createRoom(req, res));
        this.app.post('/api/rooms/join', (req, res) => this.joinRoom(req, res));
        this.app.get('/api/rooms/:roomCode/messages', (req, res) => this.getMessages(req, res));
        this.app.post('/api/messages/send', (req, res) => this.sendMessage(req, res));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
        });
    }

    setupWebSocket() {
        try {
            this.wss = new WebSocket.Server({ port: this.wsPort });
            
            this.wss.on('connection', (ws, req) => {
                console.log('New WebSocket connection');
                
                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleWebSocketMessage(ws, message);
                    } catch (error) {
                        console.error('WebSocket message error:', error);
                    }
                });

                ws.on('close', () => {
                    console.log('WebSocket connection closed');
                    this.handleDisconnect(ws);
                });

                ws.on('error', (error) => {
                    console.error('WebSocket error:', error);
                });
            });

            console.log(`✅ WebSocket server configured on port ${this.wsPort}`);
        } catch (error) {
            console.error('❌ WebSocket server setup failed:', error);
            console.log('⚠️ Continuing without WebSocket support');
        }
    }

    setupBot() {
        if (!this.botToken) {
            console.error('BOT_TOKEN environment variable is required');
            process.exit(1);
        }

        this.bot = new Bot(this.botToken);
        
        // Handle /start command
        this.bot.command('start', async (ctx) => {
            const startApp = ctx.match?.query?.startapp;
            
            if (startApp) {
                // Launch Mini App with room code
                await ctx.reply('🚀 Opening StealthLink...', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: 'Open Secret Chat', web_app: { url: `https://t.me/your_bot_username?startapp=${startApp}` } }
                        ]]
                    }
                });
            } else {
                // Show main menu
                await ctx.reply('🔒 *StealthLink* - Secure Temporary Chat\n\n' +
                    'Create a secret room and share the code with someone to start chatting.\n\n' +
                    'Messages disappear after 15 seconds for maximum privacy.', {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🚀 Create Secret Room', web_app: { url: 'https://t.me/your_bot_username?startapp' } }
                        ]]
                    },
                    parse_mode: 'Markdown'
                });
            }
        });

        // Handle Mini App data
        this.bot.on('message', async (ctx) => {
            if (ctx.message.web_app_data) {
                try {
                    const data = JSON.parse(ctx.message.web_app_data);
                    await this.handleMiniAppData(ctx, data);
                } catch (error) {
                    console.error('Mini App data error:', error);
                }
            }
        });

        // Start bot
        this.bot.start();
        console.log('Bot started successfully');
    }

    async handleMiniAppData(ctx, data) {
        switch (data.type) {
            case 'room_created':
                await ctx.reply(`🔐 *Room Created*\n\n` +
                    `Room Code: \`${data.roomCode}\`\n` +
                    `Share this code with someone to start chatting.\n\n` +
                    `⚠️ This room will be deleted in 1 hour of inactivity.`, {
                    parse_mode: 'Markdown'
                });
                break;
            
            case 'user_joined':
                await ctx.reply(`👤 *User Joined*\n\n` +
                    `${data.userName} joined the secret room.`, {
                    parse_mode: 'Markdown'
                });
                break;
            
            case 'message_sent':
                // Optional: Send notification to other users
                break;
        }
    }

    createRoom(req, res) {
        try {
            const { roomCode, creatorId } = req.body;
            
            if (!roomCode || !creatorId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Room code and creator ID are required' 
                });
            }

            if (this.rooms.has(roomCode)) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'Room already exists' 
                });
            }

            // Create room
            const room = {
                code: roomCode,
                creatorId,
                users: new Set(),
                createdAt: Date.now(),
                lastActivity: Date.now(),
                status: 'active'
            };

            this.rooms.set(roomCode, room);
            this.messages.set(roomCode, []);

            console.log(`Room created: ${roomCode} by user ${creatorId}`);

            res.json({ 
                success: true, 
                room: { 
                    code: roomCode,
                    createdAt: room.createdAt 
                } 
            });

            // Schedule room cleanup
            setTimeout(() => this.cleanupRoom(roomCode), 3600000); // 1 hour

        } catch (error) {
            console.error('Create room error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }

    joinRoom(req, res) {
        try {
            const { roomCode, userId } = req.body;
            
            if (!roomCode || !userId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Room code and user ID are required' 
                });
            }

            const room = this.rooms.get(roomCode);
            if (!room) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Room not found' 
                });
            }

            if (room.status !== 'active') {
                return res.status(410).json({ 
                    success: false, 
                    message: 'Room is no longer active' 
                });
            }

            if (room.users.size >= 2) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'Room is full' 
                });
            }

            // Add user to room
            room.users.add(userId);
            room.lastActivity = Date.now();

            console.log(`User ${userId} joined room ${roomCode}`);

            res.json({ 
                success: true, 
                room: { 
                    code: roomCode,
                    userCount: room.users.size,
                    createdAt: room.createdAt 
                } 
            });

            // Notify other users in the room
            this.broadcastToRoom(roomCode, {
                type: 'user_joined',
                userId,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('Join room error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }

    getMessages(req, res) {
        try {
            const { roomCode } = req.params;
            const { userId } = req.query;
            
            if (!roomCode || !userId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Room code and user ID are required' 
                });
            }

            const room = this.rooms.get(roomCode);
            if (!room || !room.users.has(parseInt(userId))) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }

            const roomMessages = this.messages.get(roomCode) || [];
            const fiveSecondsAgo = Date.now() - 5000;
            
            // Filter out expired messages
            const activeMessages = roomMessages.filter(msg => 
                msg.timestamp > fiveSecondsAgo
            );

            // Get typing users (users who sent typing indicator in last 3 seconds)
            const typingUsers = this.getTypingUsers(roomCode);

            res.json({
                success: true,
                messages: activeMessages,
                typingUsers,
                userCount: room.users.size
            });

        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }

    sendMessage(req, res) {
        try {
            const { id, text, senderId, roomCode, timestamp } = req.body;
            
            if (!id || !text || !senderId || !roomCode || !timestamp) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing required message fields' 
                });
            }

            const room = this.rooms.get(roomCode);
            if (!room || !room.users.has(senderId)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied' 
                });
            }

            const message = {
                id,
                text: text.substring(0, 1000), // Limit message length
                senderId,
                roomCode,
                timestamp,
                expiresAt: timestamp + 15000 // 15 seconds
            };

            // Store message
            if (!this.messages.has(roomCode)) {
                this.messages.set(roomCode, []);
            }
            this.messages.get(roomCode).push(message);

            // Update room activity
            room.lastActivity = Date.now();

            // Clean up old messages
            this.cleanupMessages(roomCode);

            console.log(`Message sent in room ${roomCode} by user ${senderId}`);

            res.json({ success: true, messageId: id });

            // Broadcast to other users in the room
            this.broadcastToRoom(roomCode, {
                type: 'new_message',
                message
            }, senderId);

        } catch (error) {
            console.error('Send message error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }

    handleWebSocketMessage(ws, message) {
        try {
            switch (message.type) {
                case 'join_room':
                    this.handleJoinRoom(ws, message);
                    break;
                
                case 'leave_room':
                    this.handleLeaveRoom(ws, message);
                    break;
                
                case 'typing_start':
                    this.handleTypingStart(ws, message);
                    break;
                
                case 'typing_stop':
                    this.handleTypingStop(ws, message);
                    break;
                
                case 'user_status':
                    this.handleUserStatus(ws, message);
                    break;
            }
        } catch (error) {
            console.error('WebSocket message handler error:', error);
        }
    }

    handleJoinRoom(ws, message) {
        const { roomCode, userId, userInfo } = message;
        
        if (!this.connections.has(roomCode)) {
            this.connections.set(roomCode, new Map());
        }
        
        this.connections.get(roomCode).set(userId, ws);
        
        console.log(`WebSocket: User ${userId} joined room ${roomCode}`);
        
        // Send current room state
        ws.send(JSON.stringify({
            type: 'room_joined',
            roomCode,
            userCount: this.rooms.get(roomCode)?.users.size || 0
        }));
    }

    handleLeaveRoom(ws, message) {
        const { roomCode, userId } = message;
        
        if (this.connections.has(roomCode)) {
            this.connections.get(roomCode).delete(userId);
            
            if (this.connections.get(roomCode).size === 0) {
                this.connections.delete(roomCode);
            }
        }
        
        console.log(`WebSocket: User ${userId} left room ${roomCode}`);
        
        // Notify other users
        this.broadcastToRoom(roomCode, {
            type: 'user_left',
            userId
        }, userId);
    }

    handleTypingStart(ws, message) {
        const { roomCode, userId } = message;
        
        this.broadcastToRoom(roomCode, {
            type: 'typing_start',
            userId
        }, userId);
        
        // Auto-stop typing after 3 seconds
        setTimeout(() => {
            this.broadcastToRoom(roomCode, {
                type: 'typing_stop',
                userId
            }, userId);
        }, 3000);
    }

    handleTypingStop(ws, message) {
        const { roomCode, userId } = message;
        
        this.broadcastToRoom(roomCode, {
            type: 'typing_stop',
            userId
        }, userId);
    }

    handleUserStatus(ws, message) {
        const { roomCode, userId, status } = message;
        
        this.broadcastToRoom(roomCode, {
            type: 'user_status',
            userId,
            status
        }, userId);
    }

    handleDisconnect(ws) {
        // Find which room and user this connection belonged to
        for (const [roomCode, connections] of this.connections.entries()) {
            for (const [userId, connection] of connections.entries()) {
                if (connection === ws) {
                    connections.delete(userId);
                    console.log(`WebSocket: User ${userId} disconnected from room ${roomCode}`);
                    
                    // Notify other users
                    this.broadcastToRoom(roomCode, {
                        type: 'user_left',
                        userId
                    }, userId);
                    
                    if (connections.size === 0) {
                        this.connections.delete(roomCode);
                    }
                    return;
                }
            }
        }
    }

    broadcastToRoom(roomCode, message, excludeUserId = null) {
        const connections = this.connections.get(roomCode);
        if (!connections) return;
        
        const messageStr = JSON.stringify(message);
        
        for (const [userId, ws] of connections.entries()) {
            if (userId !== excludeUserId && ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        }
    }

    getTypingUsers(roomCode) {
        const connections = this.connections.get(roomCode);
        if (!connections) return [];
        
        // For simplicity, return all connected users as "typing"
        // In a real implementation, you'd track typing state
        return Array.from(connections.keys());
    }

    cleanupMessages(roomCode) {
        const roomMessages = this.messages.get(roomCode);
        if (!roomMessages) return;
        
        const now = Date.now();
        const fiveSecondsAgo = now - 5000;
        
        // Keep messages from last 5 seconds
        const activeMessages = roomMessages.filter(msg => msg.timestamp > fiveSecondsAgo);
        
        if (activeMessages.length !== roomMessages.length) {
            this.messages.set(roomCode, activeMessages);
        }
    }

    cleanupRoom(roomCode) {
        const room = this.rooms.get(roomCode);
        if (!room) return;
        
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        
        if (room.lastActivity < oneHourAgo) {
            console.log(`Cleaning up inactive room: ${roomCode}`);
            
            // Close all connections
            const connections = this.connections.get(roomCode);
            if (connections) {
                for (const ws of connections.values()) {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.close();
                    }
                }
            }
            
            // Remove room and messages
            this.rooms.delete(roomCode);
            this.messages.delete(roomCode);
            this.connections.delete(roomCode);
        }
    }

    start() {
        // Validate required environment variables
        if (!this.botToken) {
            console.error('BOT_TOKEN environment variable is required');
            process.exit(1);
        }

        // Use PORT environment variable for HTTP server (Render requirement)
        const httpPort = parseInt(process.env.PORT || '3000', 10);
        
        // WebSocket port - ensure it's a valid number
        const wsPort = parseInt(process.env.WS_PORT || (httpPort + 1).toString(), 10);
        
        // Start HTTP server
        const server = this.app.listen(httpPort, () => {
            console.log(`✅ StealthChat API server running on port ${httpPort}`);
            console.log(`✅ WebSocket server running on port ${wsPort}`);
            console.log(`✅ Health check: http://localhost:${httpPort}/health`);
            console.log(`✅ Bot token configured: ${this.botToken.substring(0, 10)}...`);
        });

        server.on('error', (error) => {
            console.error('❌ Server startup error:', error);
            process.exit(1);
        });
    }
}

// Start the server
if (require.main === module) {
    const bot = new StealthChatBot();
    bot.start();
}

module.exports = StealthChatBot;