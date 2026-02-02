/**
 * Main Application Entry Point
 * Initializes the Bindu UI application
 */

// Import modules
import './api-client.js';
import './state-manager.js';
import './ui-components.js';

// Main application class
class BinduUI {
    constructor() {
        this.apiClient = null;
        this.taskPoller = null;
        this.currentConversationId = null;
        this.isTyping = false;
        this.processingConversations = new Set(); // Track processing per conversation
        this.eventListenersSetup = false; // Prevent duplicate event listeners
        this.isSending = false; // Global send lock
        this.lastSendTime = 0; // Debounce prevention
        this.eventInProgress = false; // Immediate event lock
        this.conversationTaskIds = new Map(); // Store task IDs per conversation
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Starting Bindu UI initialization...');
            
            // Check if required dependencies are available
            if (!window.stateManager) {
                throw new Error('StateManager not loaded');
            }
            if (!window.BinduApiClient) {
                throw new Error('BinduApiClient not loaded');
            }
            if (!window.Utils) {
                throw new Error('Utils not loaded');
            }
            
            console.log('✅ Dependencies loaded successfully');
            
            // Initialize API client
            this.initializeApiClient();
            console.log('✅ API client initialized');
            
            // Initialize task poller
            this.taskPoller = new TaskPoller(this.apiClient);
            console.log('✅ Task poller initialized');
            
            // Setup UI event listeners
            this.setupEventListeners();
            console.log('✅ Event listeners setup');
            
            // Setup keyboard shortcuts
            KeyboardShortcuts.init();
            console.log('✅ Keyboard shortcuts initialized');
            
            // Load initial data
            await this.loadInitialData();
            console.log('✅ Initial data loaded');
            
            // Setup state subscriptions
            this.setupStateSubscriptions();
            console.log('✅ State subscriptions setup');
            
            // Auto-resize message input
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                AutoResizeTextarea.init(messageInput);
                console.log('✅ Auto-resize textarea initialized');
            } else {
                console.warn('⚠️ Message input not found');
            }
            
            // Initialize animations
            this.addSmoothAnimations();
            console.log('✅ Animations initialized');
            
            // Load skills
            await this.loadSkills();
            console.log('✅ Skills loaded');
            
            // Hide any visible modals on initialization
            this.hideAllModals();
            console.log('✅ Modals hidden');
            
            console.log('🎉 Bindu UI initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Bindu UI:', error);
            Toast.error('Failed to initialize application');
        }
    }

    initializeApiClient() {
        const settings = stateManager.get('settings');
        this.apiClient = new BinduApiClient(settings.agentUrl);
        this.apiClient.setAuthToken(settings.authToken);
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettingsModal();
        });

        // New chat
        document.getElementById('new-chat-btn').addEventListener('click', () => {
            this.createNewConversation();
        });

        // Message input
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');

        messageInput.addEventListener('input', () => {
            this.updateCharCount();
            this.updateSendButton();
        });

        sendBtn.addEventListener('click', (e) => {
            console.log('Send button clicked - event:', e.type, e.target);
            // Immediate event lock to prevent any duplicate processing
            if (this.eventInProgress) {
                console.log('Event already in progress, ignoring');
                return;
            }
            this.eventInProgress = true;
            this.sendMessage();
        });

        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                console.log('Enter key pressed - event:', e.type, e.key);
                e.preventDefault();
                // Immediate event lock to prevent any duplicate processing
                if (this.eventInProgress) {
                    console.log('Event already in progress, ignoring');
                    return;
                }
                this.eventInProgress = true;
                this.sendMessage();
            }
        });

        // Example prompts - REMOVED to prevent duplicate listeners
        // Prompt card listeners are now set up in renderMessages function

        // Settings modal
        document.getElementById('close-settings').addEventListener('click', () => {
            Modal.hide('settings-modal');
        });

        document.getElementById('cancel-settings').addEventListener('click', () => {
            Modal.hide('settings-modal');
        });

        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Modal.hide(modal.id);
                }
            });
        });
    }

    setupStateSubscriptions() {
        // Listen for conversation changes
        stateManager.subscribe('conversations', () => {
            this.renderConversationsList();
        });

        stateManager.subscribe('activeConversationId', (conversationId) => {
            this.switchToConversation(conversationId);
        });

        stateManager.subscribe('messages', () => {
            this.renderMessages();
        });

        stateManager.subscribe('loading', (loading) => {
            if (loading) {
                LoadingOverlay.show('Connecting to agent...');
            } else {
                LoadingOverlay.hide();
            }
        });

        stateManager.subscribe('error', (error) => {
            if (error) {
                Toast.error(error.message || 'An error occurred');
            }
        });

        stateManager.subscribe('skills', () => {
            this.renderSkills();
        });
    }

    async loadInitialData() {
        try {
            stateManager.setLoading(true);
            
            // Try to load agent card
            let agentCard = null;
            try {
                agentCard = await this.apiClient.getAgentCard();
                stateManager.set('agentCard', agentCard);
                this.updateAgentInfo(agentCard); // Update UI with agent info
            } catch (error) {
                console.warn('Agent not available, using demo mode:', error.message);
                // Create demo agent card with skills
                agentCard = {
                    id: 'demo-agent',
                    name: 'Demo Agent',
                    description: 'A demo agent for testing purposes',
                    version: '1.0.0',
                    skills: [
                        {
                            id: 'demo-skill-1',
                            name: 'Research',
                            description: 'Conduct research and gather information',
                            tags: ['research', 'information']
                        },
                        {
                            id: 'demo-skill-2',
                            name: 'Analysis',
                            description: 'Analyze data and provide insights',
                            tags: ['analysis', 'data']
                        },
                        {
                            id: 'demo-skill-3',
                            name: 'Writing',
                            description: 'Generate written content and reports',
                            tags: ['writing', 'content']
                        }
                    ]
                };
                stateManager.set('agentCard', agentCard);
                this.updateAgentInfo(agentCard); // Update UI with agent info
            }
            
            // Load conversations
            let conversations = [];
            try {
                conversations = await this.apiClient.getConversations();
                stateManager.set('conversations', conversations);
            } catch (error) {
                console.warn('Failed to load conversations:', error.message);
                // Create default conversation
                const defaultConversation = stateManager.createConversation();
                conversations = [defaultConversation];
                stateManager.set('conversations', conversations);
            }
            
            // Auto-select or create conversation
            const activeConversationId = stateManager.get('activeConversationId');
            console.log('Active conversation ID from state:', activeConversationId);
            console.log('Available conversations:', conversations);
            
            if (activeConversationId && conversations.find(c => c.id === activeConversationId)) {
                // Load history for the active conversation
                console.log('Using existing active conversation:', activeConversationId);
                await this.loadConversationHistory(activeConversationId);
                stateManager.setActiveConversation(activeConversationId);
                this.currentConversationId = activeConversationId;
            } else if (conversations.length > 0) {
                // Load history for the first conversation
                console.log('Using first available conversation:', conversations[0].id);
                await this.loadConversationHistory(conversations[0].id);
                stateManager.setActiveConversation(conversations[0].id);
                this.currentConversationId = conversations[0].id;
            } else {
                // Create new conversation - ALWAYS ensure we have one
                console.log('No conversations found, creating new one');
                const newConversation = stateManager.createConversation();
                stateManager.setActiveConversation(newConversation.id);
                this.currentConversationId = newConversation.id;
                console.log('Created initial conversation:', newConversation.id);
            }
            
            // Final check - ensure we always have a current conversation
            if (!this.currentConversationId) {
                console.log('Still no conversation, forcing creation');
                const fallbackConversation = stateManager.createConversation();
                stateManager.setActiveConversation(fallbackConversation.id);
                this.currentConversationId = fallbackConversation.id;
                console.log('Created fallback conversation:', fallbackConversation.id);
            }
            
            // Update UI after conversation is set
            this.renderConversationsList();
            this.renderMessages();
            this.updateSendButton();
            
            console.log('Final currentConversationId:', this.currentConversationId);
            
            stateManager.setLoading(false);
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            stateManager.setLoading(false);
            Toast.error('Failed to load initial data');
        }
    }

    async loadSkills() {
        try {
            const skills = await this.apiClient.getSkills();
            // Ensure skills is always an array
            const skillsArray = Array.isArray(skills) ? skills : [];
            stateManager.set('skills', skillsArray);
        } catch (error) {
            console.warn('Failed to load skills:', error.message);
            // Use demo skills from agent card
            const agentCard = stateManager.get('agentCard');
            const demoSkills = agentCard?.skills || [];
            // Ensure demo skills is also an array
            const skillsArray = Array.isArray(demoSkills) ? demoSkills : [];
            stateManager.set('skills', skillsArray);
        }
    }

    async loadConversationHistory(conversationId) {
        try {
            // Load task history for this conversation
            const tasks = await this.apiClient.getConversationTasks(conversationId);
            
            // Convert tasks to messages and add to state
            const messages = [];
            tasks.forEach(task => {
                // Add user message from task input
                if (task.input && task.input.message) {
                    messages.push({
                        messageId: task.id + '-user',
                        role: 'user',
                        parts: task.input.message.parts || [{ kind: 'text', text: task.input.message }],
                        timestamp: task.created_at,
                        status: 'sent'
                    });
                }
                
                // Add agent messages from task artifacts
                if (task.artifacts && task.artifacts.length > 0) {
                    task.artifacts.forEach(artifact => {
                        if (artifact.parts && artifact.parts.length > 0) {
                            artifact.parts.forEach(part => {
                                if (part.kind === 'text') {
                                    messages.push({
                                        messageId: task.id + '-agent-' + Math.random(),
                                        role: 'agent',
                                        parts: [part],
                                        timestamp: task.updated_at || task.created_at,
                                        status: 'sent'
                                    });
                                }
                            });
                        }
                    });
                }
                
                // Check if task is in input-required state
                if (task.status && task.status.state === 'input-required') {
                    // Store task ID for continuity
                    this.conversationTaskIds.set(conversationId, task.id);
                    
                    // Add input-required message
                    if (task.history && task.history.length > 0) {
                        const lastMessage = task.history[task.history.length - 1];
                        if (lastMessage && lastMessage.parts) {
                            const inputRequest = lastMessage.parts.find(part => part.kind === 'text');
                            if (inputRequest) {
                                messages.push({
                                    messageId: task.id + '-input-required',
                                    role: 'agent',
                                    parts: [{
                                        kind: 'text',
                                        text: `⚠️ **Input Required**: ${inputRequest.text}\n\nPlease provide the required information and try again.`
                                    }],
                                    timestamp: task.status.timestamp,
                                    status: 'sent'
                                });
                            }
                        }
                    }
                }
            });
            
            // Sort messages by timestamp
            messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            
            // Add messages to state
            stateManager.setMessages(conversationId, messages);
            
        } catch (error) {
            console.warn('Failed to load conversation history:', error.message);
            // Don't throw error, just continue without history
        }
    }

    updateAgentInfo(agentCard) {
        const agentName = document.getElementById('agent-name');
        const agentStatus = document.getElementById('agent-status');
        
        if (agentName) {
            agentName.textContent = agentCard ? (agentCard.name || 'Unknown Agent') : 'Agent Offline';
        }
        
        if (agentStatus) {
            agentStatus.className = agentCard ? 'status-dot online' : 'status-dot offline';
        }
    }

    renderConversationsList() {
        const conversationsList = document.getElementById('conversations-list');
        const conversations = stateManager.get('conversations');
        const activeId = stateManager.get('activeConversationId');
        
        if (conversations.length === 0) {
            conversationsList.innerHTML = '<div class="no-conversations">No conversations yet</div>';
            return;
        }
        
        conversationsList.innerHTML = '';
        conversations.forEach(conversation => {
            const item = ConversationItem.create(conversation, conversation.id === activeId);
            item.addEventListener('click', () => {
                stateManager.setActiveConversation(conversation.id);
            });
            
            // Add delete conversation event listener
            item.addEventListener('deleteConversation', (e) => {
                this.deleteConversation(e.detail.conversationId);
            });
            
            conversationsList.appendChild(item);
        });
    }

    async switchToConversation(conversationId) {
        this.currentConversationId = conversationId; // Set current conversation ID first
        
        // Update active state in sidebar
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', item.dataset.conversationId === conversationId);
        });
        
        // Load conversation history if not already loaded
        const currentMessages = stateManager.getMessages(conversationId);
        if (currentMessages.length === 0) {
            await this.loadConversationHistory(conversationId);
        }
        
        this.renderMessages();
        console.log('Switched to conversation:', conversationId);
    }

    setupPromptCardListeners() {
        const promptCards = document.querySelectorAll('.prompt-card');
        promptCards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const prompt = card.dataset.prompt;
                if (prompt) {
                    const messageInput = document.getElementById('message-input');
                    if (messageInput) {
                        messageInput.value = prompt;
                        messageInput.focus();
                        this.updateCharCount();
                        this.updateSendButton();
                        
                        // Auto-send the prompt
                        this.sendMessage();
                    }
                }
            });
        });
    }

    renderSkills() {
        const skillsContainer = document.getElementById('skills-content');
        const skills = stateManager.get('skills');
        
        if (!skillsContainer) return;
        
        // Ensure skills is an array
        const skillsArray = Array.isArray(skills) ? skills : [];
        
        if (skillsArray.length === 0) {
            skillsContainer.innerHTML = '<div class="no-skills">No skills available</div>';
            return;
        }
        
        skillsContainer.innerHTML = `
            <div class="skills-grid">
                ${skillsArray.map(skill => `
                    <div class="skill-card" data-skill-id="${skill.id || 'unknown'}">
                        <div class="skill-header">
                            <h3>${skill.name || 'Unknown Skill'}</h3>
                            <span class="skill-id">${skill.id || 'unknown'}</span>
                        </div>
                        <p class="skill-description">${skill.description || 'No description available'}</p>
                        <div class="skill-tags">
                            ${skill.tags && Array.isArray(skill.tags) ? skill.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('') : ''}
                        </div>
                        <button class="skill-details-btn" onclick="window.binduUI.showSkillDetails('${skill.id || 'unknown'}')">
                            View Details
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async showSkillDetails(skillId) {
        try {
            const skill = await this.apiClient.getSkill(skillId);
            const documentation = await this.apiClient.getSkillDocumentation(skillId);
            
            Modal.show('skill-modal', `
                <div class="skill-modal-content">
                    <div class="skill-modal-header">
                        <h2>${skill.name}</h2>
                        <span class="skill-id">${skill.id}</span>
                    </div>
                    <div class="skill-modal-description">
                        <p>${skill.description || 'No description available'}</p>
                    </div>
                    ${skill.tags ? `
                        <div class="skill-tags">
                            <strong>Tags:</strong>
                            ${skill.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="skill-documentation">
                        <h3>Documentation</h3>
                        <pre><code>${documentation}</code></pre>
                    </div>
                </div>
            `);
        } catch (error) {
            console.error('Failed to load skill details:', error);
            Toast.error('Failed to load skill details');
        }
    }

    renderMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        const messages = stateManager.getMessages(this.currentConversationId);
        const isTyping = stateManager.isTyping(this.currentConversationId);
        
        // Clear existing messages
        messagesContainer.innerHTML = '';
        
        if (!this.currentConversationId) {
            // Show welcome message
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <h2>Welcome to Bindu Agent Chat</h2>
                    <p>Start a conversation with your AI agent. Select an existing conversation from the sidebar or create a new one.</p>
                    <div class="example-prompts">
                        <h3>Try these examples:</h3>
                        <div class="prompt-card" data-prompt="Hello! Can you introduce yourself?">
                            <h4>👋 Introduction</h4>
                            <p>Hello! Can you introduce yourself?</p>
                        </div>
                        <div class="prompt-card" data-prompt="What can you help me with?">
                            <h4>🔍 Capabilities</h4>
                            <p>What can you help me with?</p>
                        </div>
                        <div class="prompt-card" data-prompt="Show me your skills and abilities">
                            <h4>⚡ Skills</h4>
                            <p>Show me your skills and abilities</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Add prompt card event listeners
            this.setupPromptCardListeners();
        } else if (messages.length === 0) {
            // Show welcome message with prompts for active but empty conversation
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <h2>Welcome to Bindu Agent Chat</h2>
                    <p>Start a conversation with your AI agent. Try these example prompts:</p>
                    <div class="example-prompts">
                        <h3>Try these examples:</h3>
                        <div class="prompt-card" data-prompt="Hello! Can you introduce yourself?">
                            <h4>👋 Introduction</h4>
                            <p>Hello! Can you introduce yourself?</p>
                        </div>
                        <div class="prompt-card" data-prompt="What can you help me with?">
                            <h4>🔍 Capabilities</h4>
                            <p>What can you help me with?</p>
                        </div>
                        <div class="prompt-card" data-prompt="Show me your skills and abilities">
                            <h4>⚡ Skills</h4>
                            <p>Show me your skills and abilities</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Add prompt card event listeners
            this.setupPromptCardListeners();
        }
        
        // Re-attach prompt card listeners for both welcome scenarios
        if (!this.currentConversationId || messages.length === 0) {
            // Remove existing listeners to prevent duplicates
            messagesContainer.querySelectorAll('.prompt-card').forEach(card => {
                const newCard = card.cloneNode(true);
                card.parentNode.replaceChild(newCard, card);
            });
            
            // Add fresh listeners
            messagesContainer.querySelectorAll('.prompt-card').forEach(card => {
                card.addEventListener('click', () => {
                    const prompt = card.dataset.prompt;
                    document.getElementById('message-input').value = prompt;
                    this.updateCharCount();
                    this.updateSendButton();
                    document.getElementById('message-input').focus();
                });
            });
            
            return;
        }
        
        // Render messages
        messages.forEach(message => {
            const messageEl = MessageComponent.create(message);
            messagesContainer.appendChild(messageEl);
        });
        
        // Add typing indicator if needed
        if (isTyping) {
            const typingIndicator = TypingIndicator.create();
            messagesContainer.appendChild(typingIndicator);
        }
        
        // Auto-scroll to bottom
        this.scrollToBottom();
    }

    async sendMessage() {
        console.log('=== sendMessage called ===');
        console.trace('Call stack for sendMessage:');
        
        // Debounce - prevent rapid calls within 500ms
        const now = Date.now();
        if (now - this.lastSendTime < 500) {
            console.log('Rapid call detected, ignoring');
            return;
        }
        this.lastSendTime = now;
        
        // Global lock to prevent any duplicate calls
        if (this.isSending) {
            console.log('Already sending, ignoring duplicate call');
            return;
        }
        
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const message = messageInput.value.trim();
        
        if (!message || !this.currentConversationId || this.processingConversations.has(this.currentConversationId)) {
            console.log('Early return - no message, no conversation, or already processing');
            
            // If no conversation exists, create one automatically
            if (!this.currentConversationId) {
                console.log('No conversation found, creating new one');
                this.createNewConversation();
                Toast.info('Created new conversation for you');
            }
            return;
        }
        
        // Additional duplicate prevention - check recent messages
        const messages = stateManager.getMessages(this.currentConversationId);
        const recentUserMessages = messages.filter(m => 
            m.role === 'user' && 
            m.parts && 
            m.parts.length > 0 && 
            m.parts[0].text === message
        );
        
        if (recentUserMessages.length > 0) {
            const lastSameMessage = recentUserMessages[recentUserMessages.length - 1];
            const timeDiff = Date.now() - new Date(lastSameMessage.timestamp).getTime();
            if (timeDiff < 5000) { // 5 seconds
                console.log('Duplicate message detected within 5 seconds, ignoring');
                return;
            }
        }
        
        // Set global sending lock
        this.isSending = true;
        console.log('Global sending lock set');
        
        // Set processing state for this conversation
        this.processingConversations.add(this.currentConversationId);
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<div class="loading-spinner-small"></div>';
        
        // Create user message
        const userMessage = {
            messageId: Utils.generateId(),
            role: 'user',
            parts: [{
                kind: 'text',
                text: message
            }],
            timestamp: new Date().toISOString(),
            status: 'sending',
        };
        
        // Add message to state
        stateManager.addMessage(this.currentConversationId, userMessage);
        
        // Clear input
        messageInput.value = '';
        this.updateCharCount();
        this.updateSendButton();
        
        // Check if we're in demo mode
        const agentCard = stateManager.get('agentCard');
        if (!agentCard || agentCard.id === 'demo-agent') {
            // Demo mode - simulate agent response
            userMessage.status = 'sent';
            // Don't add message here - it's already added above
            
            // Show typing indicator
            stateManager.setTyping(this.currentConversationId, true);
            
            // Simulate delay and then respond
            setTimeout(() => {
                stateManager.setTyping(this.currentConversationId, false);
                
                const agentMessage = {
                    messageId: Utils.generateId(),
                    role: 'agent',
                    parts: [{
                        kind: 'text',
                        text: `This is a demo response to: "${message}". The UI is working correctly, but no real agent is connected. To use a real agent, start your Bindu agent server and update the agent URL in settings.`
                    }],
                    timestamp: new Date().toISOString(),
                    status: 'sent',
                };
                stateManager.addMessage(this.currentConversationId, agentMessage);
                
                // Update conversation title
                const conversations = stateManager.get('conversations');
                const conversation = conversations.find(c => c.id === this.currentConversationId);
                if (conversation && conversation.messageCount === 0) {
                    stateManager.updateConversationTitle(
                        this.currentConversationId,
                        message.slice(0, 50) + (message.length > 50 ? '...' : '')
                    );
                }
                conversation.messageCount++;
                stateManager.addConversation(conversation);
            }, 1500);
            
            return;
        }
        
        // Real agent mode
        try {
            // Check if we have an existing task ID for this conversation (input-required state)
            const existingTaskId = this.conversationTaskIds.get(this.currentConversationId);
            
            let response;
            if (existingTaskId) {
                // Continue existing task
                response = await this.apiClient.continueTask(existingTaskId, message, this.currentConversationId);
            } else {
                // Create new task
                response = await this.apiClient.sendMessage(message, this.currentConversationId);
                // Store the task ID for this conversation
                this.conversationTaskIds.set(this.currentConversationId, response.id);
            }
            
            // Update message status
            userMessage.status = 'sent';
            // Don't add message here - it's already added above
            
            // Show typing indicator
            stateManager.setTyping(this.currentConversationId, true);
            
            // Start polling for task completion
            const timeoutId = setTimeout(() => {
                // Reset processing state if task takes too long
                this.processingConversations.delete(this.currentConversationId);
                this.updateSendButton();
                stateManager.setTyping(this.currentConversationId, false);
                Toast.error('Message timed out. Please try again.');
            }, 30000); // 30 second timeout
            
            this.taskPoller.pollTask(
                response.id,
                (task) => {
                    // Task updated - minimal logging
                    stateManager.addTask(task);
                },
                (task) => {
                    clearTimeout(timeoutId); // Clear timeout when task completes
                    console.log('Task completed:', task.status.state);
                    
                    // Task completed
                    stateManager.setTyping(this.currentConversationId, false);
                    
                    if (task.status.state === 'input-required') {
                        // Agent needs input from user
                        const lastMessage = task.history[task.history.length - 1];
                        if (lastMessage && lastMessage.parts) {
                            const inputRequest = lastMessage.parts.find(part => part.kind === 'text');
                            if (inputRequest) {
                                const agentMessage = {
                                    messageId: Utils.generateId(),
                                    role: 'agent',
                                    parts: [{
                                        kind: 'text',
                                        text: `⚠️ **Input Required**: ${inputRequest.text}\n\nPlease provide the required information and try again.`
                                    }],
                                    timestamp: task.status.timestamp,
                                    status: 'sent',
                                };
                                stateManager.addMessage(this.currentConversationId, agentMessage);
                            }
                        }
                        
                        // Reset processing state for input-required tasks
                        console.log('Input-required task completed, resetting processing state for:', this.currentConversationId);
                        this.processingConversations.delete(this.currentConversationId);
                        this.isSending = false; // Reset global lock
                        this.eventInProgress = false; // Reset event lock
                        // Keep task ID for input-required state (don't clear it)
                        this.updateSendButton();
                        return;
                    }
                    
                    // Debug: Log artifacts to see what we're getting
                    console.log('Task artifacts:', task.artifacts);
                    
                    if (task.artifacts && task.artifacts.length > 0) {
                        task.artifacts.forEach(artifact => {
                            if (artifact.parts && artifact.parts.length > 0) {
                                artifact.parts.forEach(part => {
                                    if (part.kind === 'text') {
                                        const agentMessage = {
                                            messageId: Utils.generateId(),
                                            role: 'agent',
                                            parts: [part],
                                            timestamp: task.status.timestamp,
                                            status: 'sent',
                                        };
                                        stateManager.addMessage(this.currentConversationId, agentMessage);
                                    }
                                });
                            }
                        });
                    }
                    
                    // Update conversation title with first message
                    const conversations = stateManager.get('conversations');
                    const conversation = conversations.find(c => c.id === this.currentConversationId);
                    if (conversation && conversation.messageCount === 0) {
                        stateManager.updateConversationTitle(
                            this.currentConversationId,
                            message.slice(0, 50) + (message.length > 50 ? '...' : '')
                        );
                    }
                    
                    // Update message count
                    conversation.messageCount++;
                    stateManager.addConversation(conversation);
                    
                    // Reset processing state for completed tasks
                    console.log('Completed task finished, resetting processing state for:', this.currentConversationId);
                    this.processingConversations.delete(this.currentConversationId);
                    this.isSending = false; // Reset global lock
                    this.eventInProgress = false; // Reset event lock
                    // Clear task ID for completed tasks
                    this.conversationTaskIds.delete(this.currentConversationId);
                    this.updateSendButton();
                    
                    // Show feedback option for completed tasks
                    this.showFeedbackOption(response.id);
                },
                (error) => {
                    clearTimeout(timeoutId); // Clear timeout on error
                    // Task failed
                    this.processingConversations.delete(this.currentConversationId);
                    this.isSending = false; // Reset global lock
                    this.eventInProgress = false; // Reset event lock
                    this.updateSendButton();
                    stateManager.setTyping(this.currentConversationId, false);
                    Toast.error(`Failed to send message: ${error.message}`);
                }
            );
            
        } catch (error) {
            console.error('Failed to send message:', error);
            
            // Handle 402 Payment Required errors
            if (error.code === -402 && error.data?.isPaymentRequired) {
                await this.handlePaymentFlow(error.data, message);
                return;
            }
            
            userMessage.status = 'error';
            // Don't add message here - it's already added above
            
            // Reset processing state for this conversation
            this.processingConversations.delete(this.currentConversationId);
            this.isSending = false; // Reset global lock
            this.eventInProgress = false; // Reset event lock
            this.updateSendButton();
            
            Toast.error(`Failed to send message: ${error.message}`);
        }
    }

    createNewConversation() {
        const conversation = stateManager.createConversation();
        stateManager.setActiveConversation(conversation.id);
        this.currentConversationId = conversation.id; // Set current conversation ID
        console.log('Created new conversation:', conversation.id);
    }

    async handlePaymentFlow(paymentData, originalMessage) {
        try {
            // Open payment popup
            const popup = window.open(paymentData.paymentUrl, 'payment', 'width=400,height=600');
            
            if (!popup) {
                Toast.error('Please allow popups for payment processing');
                return;
            }
            
            // Poll for payment completion
            const pollInterval = setInterval(async () => {
                if (popup.closed) {
                    clearInterval(pollInterval);
                    // Retry the original message after payment
                    await this.retryMessageAfterPayment(originalMessage);
                    return;
                }
                
                try {
                    // Check payment status (implement based on your payment provider)
                    const status = await this.checkPaymentStatus(paymentData.paymentId);
                    if (status.completed) {
                        clearInterval(pollInterval);
                        popup.close();
                        await this.retryMessageAfterPayment(originalMessage);
                    }
                } catch (error) {
                    console.error('Payment status check failed:', error);
                }
            }, 2000);
            
            // Auto-close popup after timeout
            setTimeout(() => {
                clearInterval(pollInterval);
                if (popup && !popup.closed) {
                    popup.close();
                }
            }, 300000); // 5 minutes timeout
            
        } catch (error) {
            console.error('Payment flow failed:', error);
            Toast.error('Payment processing failed');
            
            // Reset processing state
            this.processingConversations.delete(this.currentConversationId);
            this.isSending = false;
            this.eventInProgress = false;
            this.updateSendButton();
        }
    }

    async checkPaymentStatus(paymentId) {
        // Implement based on your payment provider
        // This is a placeholder implementation
        try {
            const response = await fetch(`/api/payment-status/${paymentId}`);
            return await response.json();
        } catch (error) {
            return { completed: false };
        }
    }

    async retryMessageAfterPayment(originalMessage) {
        // Reset input and retry sending
        const messageInput = document.getElementById('message-input');
        messageInput.value = originalMessage;
        messageInput.dispatchEvent(new Event('input'));
        
        // Reset processing state and retry
        this.processingConversations.delete(this.currentConversationId);
        this.isSending = false;
        this.eventInProgress = false;
        this.updateSendButton();
        
        // Auto-retry after a short delay
        setTimeout(() => {
            this.sendMessage();
        }, 500);
    }

    updateCharCount() {
        const messageInput = document.getElementById('message-input');
        const charCount = document.getElementById('char-count');
        const count = messageInput.value.length;
        charCount.textContent = `${count} / 4000`;
    }

    updateSendButton() {
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const hasText = messageInput.value.trim().length > 0;
        
        // Debug logging
        console.log('updateSendButton:', {
            hasText,
            currentConversationId: this.currentConversationId,
            isProcessing: this.processingConversations.has(this.currentConversationId),
            sendBtnDisabled: sendBtn.disabled
        });
        
        // Reset button content if not processing
        if (!this.processingConversations.has(this.currentConversationId)) {
            sendBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            `;
        }
        
        sendBtn.disabled = !hasText || !this.currentConversationId || this.processingConversations.has(this.currentConversationId);
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (stateManager.get('settings').autoScroll) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    showSettingsModal() {
        const settings = stateManager.get('settings');
        
        // Populate form
        document.getElementById('agent-url').value = settings.agentUrl;
        document.getElementById('auth-token').value = settings.authToken || '';
        document.getElementById('auto-scroll').checked = settings.autoScroll;
        
        Modal.show('settings-modal');
    }

    async saveSettings() {
        const agentUrl = document.getElementById('agent-url').value;
        const authToken = document.getElementById('auth-token').value;
        const autoScroll = document.getElementById('auto-scroll').checked;
        
        // Update settings
        stateManager.updateSettings({
            agentUrl,
            authToken,
            autoScroll,
        });
        
        // Reinitialize API client
        this.initializeApiClient();
        
        // Reload data
        await this.loadInitialData();
        
        Modal.hide('settings-modal');
        Toast.success('Settings saved successfully');
    }
    
    deleteConversation(conversationId) {
        // Remove conversation from state
        stateManager.deleteConversation(conversationId);
        
        // Clear task ID for deleted conversation
        this.conversationTaskIds.delete(conversationId);
        
        // If deleted conversation was active, switch to another or create new one
        if (this.currentConversationId === conversationId) {
            const conversations = stateManager.get('conversations');
            if (conversations.length > 0) {
                this.switchToConversation(conversations[0].id);
            } else {
                this.createNewConversation();
            }
        }
        
        Toast.success('Conversation deleted');
    }

    showFeedbackOption(taskId) {
        // Add feedback button to the last agent message
        const messages = stateManager.getMessages(this.currentConversationId);
        const lastAgentMessage = messages.filter(m => m.role === 'agent').pop();
        
        if (lastAgentMessage) {
            const feedbackBtn = document.createElement('div');
            feedbackBtn.className = 'feedback-prompt';
            feedbackBtn.innerHTML = `
                <p>Was this response helpful?</p>
                <div class="feedback-buttons">
                    <button class="feedback-btn thumbs-up" onclick="window.binduUI.submitFeedback('${taskId}', 'helpful', 5)">👍</button>
                    <button class="feedback-btn thumbs-down" onclick="window.binduUI.submitFeedback('${taskId}', 'not helpful', 1)">👎</button>
                    <button class="feedback-btn detailed" onclick="window.binduUI.showDetailedFeedback('${taskId}')">💬</button>
                </div>
            `;
            
            const messageElement = document.querySelector(`[data-message-id="${lastAgentMessage.messageId}"]`);
            if (messageElement) {
                messageElement.appendChild(feedbackBtn);
            }
        }
    }

    async submitFeedback(taskId, feedback, rating) {
        try {
            await this.apiClient.submitFeedback(taskId, feedback, rating);
            Toast.success('Thank you for your feedback!');
            
            // Remove feedback prompt
            const feedbackPrompt = document.querySelector('.feedback-prompt');
            if (feedbackPrompt) {
                feedbackPrompt.remove();
            }
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            Toast.error('Failed to submit feedback');
        }
    }

    showDetailedFeedback(taskId) {
        Modal.show('feedback-modal', `
            <div class="feedback-form">
                <h3>Provide Detailed Feedback</h3>
                <div class="rating-section">
                    <label>Rating:</label>
                    <div class="rating-stars">
                        ${[1,2,3,4,5].map(stars => `
                            <button class="star-btn" onclick="window.binduUI.setRating(${stars})" data-rating="${stars}">
                                ${'⭐'.repeat(stars)}
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="feedback-section">
                    <label for="feedback-text">Your feedback:</label>
                    <textarea id="feedback-text" placeholder="Tell us more about your experience..." rows="4"></textarea>
                </div>
                <div class="feedback-actions">
                    <button onclick="Modal.hide('feedback-modal')">Cancel</button>
                    <button class="primary-btn" onclick="window.binduUI.submitDetailedFeedback('${taskId}')">Submit Feedback</button>
                </div>
            </div>
        `);
    }

    setRating(rating) {
        this.currentRating = rating;
        document.querySelectorAll('.star-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.rating) <= rating);
        });
    }

    async submitDetailedFeedback(taskId) {
        const feedbackText = document.getElementById('feedback-text').value;
        const rating = this.currentRating || 3;
        
        try {
            await this.apiClient.submitFeedback(taskId, feedbackText, rating);
            Toast.success('Thank you for your detailed feedback!');
            Modal.hide('feedback-modal');
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            Toast.error('Failed to submit feedback');
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        stateManager.set('currentTheme', newTheme);
        
        // Add transition effect
        document.body.style.transition = 'background-color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    showLoadingSkeleton(container) {
        container.innerHTML = `
            <div class="skeleton-loader">
                <div class="skeleton-message"></div>
                <div class="skeleton-message"></div>
                <div class="skeleton-message skeleton-short"></div>
            </div>
        `;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });
        
        // Load content for specific tabs
        if (tabName === 'info') {
            this.loadAgentInfo();
        } else if (tabName === 'skills') {
            this.renderSkills();
        }
    }

    async loadAgentInfo() {
        const agentDetails = document.getElementById('agent-details');
        const agentCard = stateManager.get('agentCard');
        
        if (agentCard) {
            agentDetails.innerHTML = `
                <div class="agent-card-display">
                    <div class="agent-header">
                        <h2>${agentCard.name || 'Unknown Agent'}</h2>
                        <span class="version">v${agentCard.version || '1.0.0'}</span>
                    </div>
                    <div class="agent-description">
                        <p>${agentCard.description || 'No description available'}</p>
                    </div>
                    <div class="agent-meta">
                        <div class="meta-item">
                            <strong>URL:</strong> 
                            <code>${agentCard.url || 'Not configured'}</code>
                        </div>
                        <div class="meta-item">
                            <strong>Protocol:</strong> 
                            <code>${agentCard.protocol_version || '2026.1.12'}</code>
                        </div>
                        <div class="meta-item">
                            <strong>Capabilities:</strong>
                            <ul>
                                ${agentCard.capabilities ? Object.keys(agentCard.capabilities).map(cap => 
                                    `<li>${cap}</li>`).join('') : '<li>None specified</li>'}
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        } else {
            agentDetails.innerHTML = '<div class="loading">Loading agent information...</div>';
        }
    }

    addSmoothAnimations() {
        // Add smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';
        
        // Add entrance animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes slideIn {
                from { transform: translateX(-20px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .fade-in {
                animation: fadeIn 0.3s ease-out;
            }
            
            .slide-in {
                animation: slideIn 0.3s ease-out;
            }
            
            .skeleton-loader {
                padding: 1rem;
            }
            
            .skeleton-message {
                height: 60px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: pulse 1.5s infinite;
                border-radius: 8px;
                margin-bottom: 1rem;
            }
            
            .skeleton-short {
                height: 30px;
                width: 60%;
            }
            
            .skill-card {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            
            .skill-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .feedback-btn {
                transition: all 0.2s ease;
            }
            
            .feedback-btn:hover {
                transform: scale(1.1);
            }
            
            .star-btn {
                transition: all 0.2s ease;
                font-size: 1.5rem;
                background: none;
                border: none;
                cursor: pointer;
                opacity: 0.3;
            }
            
            .star-btn.active {
                opacity: 1;
                transform: scale(1.2);
            }
            
            .star-btn:hover {
                opacity: 0.7;
                transform: scale(1.1);
            }
            
            [data-theme="dark"] .skeleton-message {
                background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
            }
        `;
        document.head.appendChild(style);
    }

    hideAllModals() {
        // Hide all modals on page load
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.add('hidden');
        });
        
        // Clear any modal content that might have been populated
        const modalBodies = document.querySelectorAll('.modal-body');
        modalBodies.forEach(body => {
            if (body.id !== 'settings-modal-body') { // Keep settings content
                body.innerHTML = '';
            }
        });
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.binduUI = new BinduUI();
});
