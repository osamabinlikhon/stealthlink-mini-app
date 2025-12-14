class StealthChatApp {
    constructor() {
        this.webApp = window.Telegram?.WebApp;
        this.user = null;
        this.currentRoom = null;
        this.socket = null;
        this.typingTimer = null;
        this.messageTimers = new Map();
        this.isTyping = false;
        
        this.init();
    }

    async init() {
        try {
            // Initialize Telegram WebApp
            if (this.webApp) {
                this.webApp.ready();
                this.webApp.expand();
                this.webApp.setHeaderColor('#000000');
                this.webApp.setBackgroundColor('#000000');
                
                // Enable closing confirmation
                this.webApp.enableClosingConfirmation();
            }

            // Initialize UI elements
            this.initializeElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize user authentication
            await this.initializeUser();
            
            // Show loading screen briefly for UX
            setTimeout(() => {
                this.hideLoadingScreen();
                this.showSessionGate();
            }, 1000);
            
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Initialization Error', 'Failed to initialize the app. Please try again.');
        }
    }

    initializeElements() {
        this.elements = {
            loadingScreen: document.getElementById('loadingScreen'),
            sessionGate: document.getElementById('sessionGate'),
            chatInterface: document.getElementById('chatInterface'),
            errorModal: document.getElementById('errorModal'),
            
            // Session Gate
            createRoomBtn: document.getElementById('createRoomBtn'),
            roomCodeInput: document.getElementById('roomCodeInput'),
            joinRoomBtn: document.getElementById('joinRoomBtn'),
            
            // Chat Interface
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            displayRoomCode: document.getElementById('displayRoomCode'),
            leaveRoomBtn: document.getElementById('leaveRoomBtn'),
            messagesContainer: document.getElementById('messagesContainer'),
            typingIndicator: document.getElementById('typingIndicator'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            
            // Error Modal
            errorCloseBtn: document.getElementById('errorCloseBtn')
        };
    }

    setupEventListeners() {
        // Session Gate Events
        this.elements.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.elements.joinRoomBtn.addEventListener('click', () => this.joinRoom());
        this.elements.roomCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        });
        this.elements.roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinRoom();
        });

        // Chat Interface Events
        this.elements.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        this.elements.messageInput.addEventListener('input', () => this.handleTyping());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());

        // Error Modal Events
        this.elements.errorCloseBtn.addEventListener('click', () => this.hideError());

        // Telegram WebApp Events
        if (this.webApp) {
            this.webApp.onEvent('themeChanged', () => this.updateTheme());
            this.webApp.onEvent('viewportChanged', () => this.handleViewportChange());
        }

        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.socket) {
                this.socket.send(JSON.stringify({ type: 'user_status', status: 'away' }));
            } else if (!document.hidden && this.socket) {
                this.socket.send(JSON.stringify({ type: 'user_status', status: 'online' }));
            }
        });
    }

    async initializeUser() {
        try {
            if (this.webApp && this.webApp.initDataUnsafe?.user) {
                this.user = {
                    id: this.webApp.initDataUnsafe.user.id,
                    firstName: this.webApp.initDataUnsafe.user.first_name,
                    lastName: this.webApp.initDataUnsafe.user.last_name,
                    username: this.webApp.initDataUnsafe.user.username,
                    languageCode: this.webApp.initDataUnsafe.user.language_code
                };
            } else {
                // Fallback for testing
                this.user = {
                    id: Date.now(),
                    firstName: 'Anonymous',
                    username: `user_${Date.now().toString().slice(-6)}`
                };
            }
        } catch (error) {
            console.error('User initialization failed:', error);
            throw error;
        }
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `${result.slice(0, 2)}-${result.slice(2)}`;
    }

    async createRoom() {
        try {
            const roomCode = this.generateRoomCode();
            const response = await this.apiCall('/api/rooms/create', {
                method: 'POST',
                body: JSON.stringify({
                    roomCode,
                    creatorId: this.user.id
                })
            });

            if (response.success) {
                this.joinChatRoom(roomCode);
            } else {
                throw new Error(response.message || 'Failed to create room');
            }
        } catch (error) {
            console.error('Create room failed:', error);
            this.showError('Connection Error', 'Failed to create room. Please try again.');
        }
    }

    async joinRoom() {
        const roomCode = this.elements.roomCodeInput.value.trim().toUpperCase();
        
        if (!roomCode || roomCode.length !== 8) {
            this.showError('Invalid Room Code', 'Please enter a valid 6-character room code.');
            return;
        }

        try {
            const response = await this.apiCall('/api/rooms/join', {
                method: 'POST',
                body: JSON.stringify({
                    roomCode,
                    userId: this.user.id
                })
            });

            if (response.success) {
                this.joinChatRoom(roomCode);
            } else {
                throw new Error(response.message || 'Failed to join room');
            }
        } catch (error) {
            console.error('Join room failed:', error);
            this.showError('Room Not Found', 'The room code you entered does not exist or is full.');
        }
    }

    async joinChatRoom(roomCode) {
        this.currentRoom = roomCode;
        
        try {
            // Initialize WebSocket connection
            await this.initializeWebSocket(roomCode);
            
            // Update UI
            this.hideSessionGate();
            this.showChatInterface();
            this.updateRoomDisplay(roomCode);
            this.updateConnectionStatus('connected');
            
            // Clear previous messages
            this.elements.messagesContainer.innerHTML = '';
            
        } catch (error) {
            console.error('Join chat room failed:', error);
            this.showError('Connection Failed', 'Unable to connect to the chat room.');
        }
    }

    async initializeWebSocket(roomCode) {
        return new Promise((resolve, reject) => {
            // For development - use polling instead of WebSocket
            // In production, replace with WebSocket: ws://your-server/ws
            
            const pollInterval = setInterval(() => {
                this.pollForMessages();
            }, 1000);

            this.socket = {
                send: (data) => {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(message);
                },
                close: () => {
                    clearInterval(pollInterval);
                }
            };

            // Send join message
            this.socket.send(JSON.stringify({
                type: 'join_room',
                roomCode,
                userId: this.user.id,
                userInfo: this.user
            }));

            resolve();
        });
    }

    async pollForMessages() {
        if (!this.currentRoom) return;

        try {
            const response = await this.apiCall(`/api/rooms/${this.currentRoom}/messages?userId=${this.user.id}`);
            
            if (response.messages) {
                response.messages.forEach(message => {
                    if (!this.messageTimers.has(message.id)) {
                        this.displayMessage(message);
                        this.scheduleMessageDestruction(message);
                    }
                });
            }

            if (response.typingUsers) {
                this.updateTypingIndicator(response.typingUsers);
            }

        } catch (error) {
            console.error('Polling failed:', error);
        }
    }

    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'user_joined':
                this.updateConnectionStatus('connected');
                this.showNotification(`${message.userInfo.firstName} joined`);
                break;
            
            case 'user_left':
                this.showNotification(`${message.userInfo.firstName} left`);
                break;
            
            case 'new_message':
                if (!this.messageTimers.has(message.message.id)) {
                    this.displayMessage(message.message);
                    this.scheduleMessageDestruction(message.message);
                }
                break;
            
            case 'typing_start':
                this.showTypingIndicator(message.userId);
                break;
            
            case 'typing_stop':
                this.hideTypingIndicator(message.userId);
                break;
            
            case 'user_status':
                this.updateUserStatus(message.userId, message.status);
                break;
        }
    }

    displayMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.senderId === this.user.id ? 'sent' : 'received'}`;
        messageEl.dataset.messageId = message.id;
        messageEl.dataset.timestamp = message.timestamp;

        const isOwnMessage = message.senderId === this.user.id;
        const time = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageEl.innerHTML = `
            <div class="message-bubble">
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-time">${time}</div>
                <div class="ephemeral-timer">
                    <div class="timer-progress" data-message-id="${message.id}"></div>
                </div>
            </div>
        `;

        this.elements.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();

        // Start countdown animation
        this.startMessageCountdown(message.id);
    }

    startMessageCountdown(messageId) {
        const timerProgress = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!timerProgress) return;

        const duration = 15000; // 15 seconds
        const startTime = Date.now();

        const updateTimer = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            const progress = (remaining / duration) * 100;

            timerProgress.style.width = `${progress}%`;

            if (remaining <= 3000) {
                timerProgress.classList.add('expiring');
            }

            if (remaining <= 0) {
                this.destroyMessage(messageId);
                return;
            }

            requestAnimationFrame(updateTimer);
        };

        updateTimer();
    }

    destroyMessage(messageId) {
        const messageEl = document.querySelector(`[data-message-id="${messageId}"]`)?.closest('.message');
        if (!messageEl) return;

        // Clear timer
        if (this.messageTimers.has(messageId)) {
            clearTimeout(this.messageTimers.get(messageId));
            this.messageTimers.delete(messageId);
        }

        // Animate destruction
        messageEl.classList.add('destroying');

        setTimeout(() => {
            messageEl.remove();
        }, 600);

        // Haptic feedback
        if (this.webApp?.HapticFeedback) {
            this.webApp.HapticFeedback.impactOccurred('rigid');
        }
    }

    scheduleMessageDestruction(message) {
        // Clear any existing timer for this message
        if (this.messageTimers.has(message.id)) {
            clearTimeout(this.messageTimers.get(message.id));
        }

        // Set new timer
        const timer = setTimeout(() => {
            this.destroyMessage(message.id);
        }, 15000);

        this.messageTimers.set(message.id, timer);
    }

    async sendMessage() {
        const text = this.elements.messageInput.value.trim();
        if (!text || !this.currentRoom) return;

        try {
            // Disable send button temporarily
            this.elements.sendBtn.disabled = true;

            const message = {
                id: Date.now().toString(),
                text,
                senderId: this.user.id,
                roomCode: this.currentRoom,
                timestamp: Date.now()
            };

            // Send to server
            const response = await this.apiCall('/api/messages/send', {
                method: 'POST',
                body: JSON.stringify(message)
            });

            if (response.success) {
                // Clear input
                this.elements.messageInput.value = '';
                this.updateSendButton();

                // Stop typing indicator
                this.stopTyping();

                // Haptic feedback
                if (this.webApp?.HapticFeedback) {
                    this.webApp.HapticFeedback.impactOccurred('light');
                }
            } else {
                throw new Error(response.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Send message failed:', error);
            this.showError('Send Failed', 'Unable to send message. Please try again.');
        } finally {
            this.elements.sendBtn.disabled = false;
        }
    }

    handleTyping() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        this.updateSendButton();

        if (hasText && !this.isTyping) {
            this.startTyping();
        } else if (!hasText && this.isTyping) {
            this.stopTyping();
        }
    }

    startTyping() {
        this.isTyping = true;
        
        // Send typing start to server
        if (this.socket) {
            this.socket.send(JSON.stringify({
                type: 'typing_start',
                roomCode: this.currentRoom,
                userId: this.user.id
            }));
        }

        // Clear existing timer
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }

        // Set timer to stop typing
        this.typingTimer = setTimeout(() => {
            this.stopTyping();
        }, 3000);
    }

    stopTyping() {
        this.isTyping = false;

        // Send typing stop to server
        if (this.socket) {
            this.socket.send(JSON.stringify({
                type: 'typing_stop',
                roomCode: this.currentRoom,
                userId: this.user.id
            }));
        }

        // Clear timer
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
    }

    updateTypingIndicator(typingUsers) {
        const otherTypingUsers = typingUsers.filter(id => id !== this.user.id);
        
        if (otherTypingUsers.length > 0) {
            this.elements.typingIndicator.classList.add('visible');
        } else {
            this.elements.typingIndicator.classList.remove('visible');
        }
    }

    showTypingIndicator(userId) {
        // Implementation for showing typing indicator
        this.elements.typingIndicator.classList.add('visible');
    }

    hideTypingIndicator(userId) {
        // Implementation for hiding typing indicator
        this.elements.typingIndicator.classList.remove('visible');
    }

    updateSendButton() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        this.elements.sendBtn.disabled = !hasText;
    }

    updateConnectionStatus(status) {
        const statusDot = this.elements.statusDot;
        const statusText = this.elements.statusText;

        statusDot.className = 'status-dot';
        
        switch (status) {
            case 'connected':
                statusDot.classList.add('connected');
                statusText.textContent = 'Connected';
                break;
            case 'connecting':
                statusDot.classList.add('disconnected');
                statusText.textContent = 'Connecting...';
                break;
            case 'disconnected':
                statusDot.classList.add('disconnected');
                statusText.textContent = 'Disconnected';
                break;
        }
    }

    updateRoomDisplay(roomCode) {
        this.elements.displayRoomCode.textContent = roomCode;
    }

    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    leaveRoom() {
        // Send leave message
        if (this.socket) {
            this.socket.send(JSON.stringify({
                type: 'leave_room',
                roomCode: this.currentRoom,
                userId: this.user.id
            }));
            
            this.socket.close();
        }

        // Clear timers
        this.messageTimers.forEach(timer => clearTimeout(timer));
        this.messageTimers.clear();

        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }

        // Reset state
        this.currentRoom = null;
        this.socket = null;

        // Show session gate
        this.showSessionGate();
        this.hideChatInterface();
    }

    showSessionGate() {
        this.elements.sessionGate.style.display = 'flex';
    }

    hideSessionGate() {
        this.elements.sessionGate.style.display = 'none';
    }

    showChatInterface() {
        this.elements.chatInterface.style.display = 'flex';
        this.elements.messageInput.focus();
    }

    hideChatInterface() {
        this.elements.chatInterface.style.display = 'none';
    }

    hideLoadingScreen() {
        this.elements.loadingScreen.style.display = 'none';
    }

    showError(title, message) {
        document.getElementById('errorTitle').textContent = title;
        document.getElementById('errorMessage').textContent = message;
        this.elements.errorModal.style.display = 'flex';
    }

    hideError() {
        this.elements.errorModal.style.display = 'none';
    }

    showNotification(message) {
        // Simple notification - could be enhanced with toast notifications
        if (this.webApp?.showAlert) {
            this.webApp.showAlert(message);
        } else {
            console.log('Notification:', message);
        }
    }

    updateTheme() {
        // Handle theme changes from Telegram
        if (this.webApp) {
            document.documentElement.style.setProperty('--color-bg', '#000000');
            document.documentElement.style.setProperty('--color-surface', '#121212');
            // Update other theme variables as needed
        }
    }

    handleViewportChange() {
        // Handle viewport changes
        this.scrollToBottom();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async apiCall(endpoint, options = {}) {
        const baseUrl = 'https://your-bot-api.com'; // Replace with your bot API URL
        
        try {
            const response = await fetch(baseUrl + endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StealthChatApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    // Clean up any active connections
    if (window.stealthChat) {
        window.stealthChat.leaveRoom();
    }
});