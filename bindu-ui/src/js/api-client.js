/**
 * Bindu Agent API Client
 * Handles all communication with the Bindu agent server via JSON-RPC
 */
class BinduApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.authToken = null;
        this.paymentToken = null;
    }

    setAuthToken(token) {
        this.authToken = token;
    }

    setPaymentToken(token) {
        this.paymentToken = token;
    }

    async jsonrpc(method, params = {}) {
        const url = `${this.baseUrl}/`;
        const headers = {
            'Content-Type': 'application/json',
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (this.paymentToken) {
            headers['X-Payment-Token'] = this.paymentToken;
        }

        const body = {
            jsonrpc: '2.0',
            method,
            params,
            id: crypto.randomUUID(),
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new ApiError(response.status, response.statusText);
            }

            const result = await response.json();
            
            if (result.error) {
                // Handle 402 Payment Required errors
                if (result.error.code === -402) {
                    throw new JsonRpcError(result.error.code, result.error.message, {
                        ...result.error.data,
                        isPaymentRequired: true
                    });
                }
                throw new JsonRpcError(result.error.code, result.error.message, result.error.data);
            }

            return result.result;
        } catch (error) {
            if (error instanceof ApiError || error instanceof JsonRpcError) {
                throw error;
            }
            throw new Error(`Network error: ${error.message}`);
        }
    }

    // Agent Card
    async getAgentCard() {
        try {
            const response = await fetch(`${this.baseUrl}/.well-known/agent.json`);
            if (!response.ok) {
                throw new ApiError(response.status, response.statusText);
            }
            return response.json();
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            // Handle CORS and network errors
            if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
                throw new Error(`Unable to connect to agent at ${this.baseUrl}. Please ensure the agent is running and CORS is configured correctly.`);
            }
            throw new Error(`Network error: ${error.message}`);
        }
    }

    // Message operations
    async sendMessage(message, conversationId) {
        return this.jsonrpc('message/send', {
            message: {
                role: 'user',
                parts: [{ kind: 'text', text: message }],
                kind: 'message',
                messageId: crypto.randomUUID(),
                contextId: conversationId || crypto.randomUUID(),
                taskId: crypto.randomUUID(),
                referenceTaskIds: [],
            },
            configuration: {
                acceptedOutputModes: ['application/json'],
            },
        });
    }

    async continueTask(taskId, message, conversationId) {
        return this.jsonrpc('message/send', {
            message: {
                role: 'user',
                parts: [{ kind: 'text', text: message }],
                kind: 'message',
                messageId: crypto.randomUUID(),
                contextId: conversationId || crypto.randomUUID(),
                taskId: taskId,
                referenceTaskIds: [],
            },
            configuration: {
                acceptedOutputModes: ['application/json'],
            },
        });
    }

    // Conversation operations
    async getConversations() {
        return this.jsonrpc('contexts/list', { length: 50 });
    }

    async getConversationTasks(conversationId) {
        // For simple agents, return empty array
        return [];
    }

    async clearContext(contextId) {
        return this.jsonrpc('contexts/clear', { contextId });
    }

    // Skills operations
    async getSkills() {
        try {
            const response = await fetch(`${this.baseUrl}/agent/skills`);
            if (!response.ok) {
                throw new ApiError(response.status, response.statusText);
            }
            return await response.json();
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error(`Network error: ${error.message}`);
        }
    }

    async getSkill(skillId) {
        try {
            const response = await fetch(`${this.baseUrl}/agent/skills/${skillId}`);
            if (!response.ok) {
                throw new ApiError(response.status, response.statusText);
            }
            return await response.json();
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error(`Network error: ${error.message}`);
        }
    }

    async getSkillDocumentation(skillId) {
        try {
            const response = await fetch(`${this.baseUrl}/agent/skills/${skillId}/documentation`);
            if (!response.ok) {
                throw new ApiError(response.status, response.statusText);
            }
            return await response.text();
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new Error(`Network error: ${error.message}`);
        }
    }

    // Feedback operations
    async submitFeedback(taskId, feedback, rating = null, metadata = {}) {
        return this.jsonrpc('tasks/feedback', {
            taskId,
            feedback,
            rating,
            metadata: { source: 'web-ui', ...metadata }
        });
    }

    // Task operations
    async getTask(taskId) {
        return this.jsonrpc('tasks/get', { taskId });
    }

    async cancelTask(taskId) {
        return this.jsonrpc('tasks/cancel', { taskId });
    }

    async listTasks(limit = 100, offset = 0) {
        return this.jsonrpc('tasks/list', { limit, offset });
    }

    async submitTaskFeedback(taskId, feedback, rating, metadata = {}) {
        return this.jsonrpc('tasks/feedback', {
            taskId,
            feedback,
            rating,
            metadata,
        });
    }

    // Context operations
    async listContexts(length = 50) {
        return this.jsonrpc('contexts/list', { length });
    }

    async clearContext(contextId) {
        return this.jsonrpc('contexts/clear', { contextId });
    }

    // DID operations
    async resolveDID(did) {
        return this.jsonrpc('did/resolve', { did });
    }

    // Health check
    async healthCheck() {
        const response = await fetch(`${this.baseUrl}/health`);
        if (!response.ok) {
            throw new ApiError(response.status, response.statusText);
        }
        return response.json();
    }

    // Skills
    async getSkills() {
        const response = await fetch(`${this.baseUrl}/agent/skills`);
        if (!response.ok) {
            throw new ApiError(response.status, response.statusText);
        }
        return response.json();
    }

    async getSkill(skillId) {
        const response = await fetch(`${this.baseUrl}/agent/skills/${skillId}`);
        if (!response.ok) {
            throw new ApiError(response.status, response.statusText);
        }
        return response.json();
    }

    async getSkillDocumentation(skillId) {
        const response = await fetch(`${this.baseUrl}/agent/skills/${skillId}/documentation`);
        if (!response.ok) {
            throw new ApiError(response.status, response.statusText);
        }
        return response.text();
    }
}

// Export the API client class
window.BinduApiClient = BinduApiClient;

// Error classes
class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

class JsonRpcError extends Error {
    constructor(error) {
        super(error.message);
        this.name = 'JsonRpcError';
        this.code = error.code;
        this.data = error.data;
    }
}

// Export error classes
window.ApiError = ApiError;
window.JsonRpcError = JsonRpcError;

// Task polling utility
class TaskPoller {
    constructor(apiClient, pollInterval = 1000, maxAttempts = 300) {
        this.apiClient = apiClient;
        this.pollInterval = pollInterval;
        this.maxAttempts = maxAttempts;
        this.activePolls = new Map();
    }

    async pollTask(taskId, onUpdate, onComplete, onError) {
        if (this.activePolls.has(taskId)) {
            return;
        }

        let attempts = 0;
        const poll = async () => {
            try {
                attempts++;
                const task = await this.apiClient.getTask(taskId);
                
                onUpdate(task);

                const state = task.status.state;
                if (['completed', 'failed', 'canceled', 'input-required'].includes(state)) {
                    this.activePolls.delete(taskId);
                    onComplete(task);
                    return;
                }

                if (attempts >= this.maxAttempts) {
                    this.activePolls.delete(taskId);
                    onError(new Error('Polling timeout'));
                    return;
                }

                setTimeout(poll, this.pollInterval);
            } catch (error) {
                this.activePolls.delete(taskId);
                onError(error);
            }
        };

        this.activePolls.set(taskId, true);
        poll();
    }

    stopPolling(taskId) {
        this.activePolls.delete(taskId);
    }

    stopAllPolling() {
        this.activePolls.clear();
    }
}

// Export for use in other modules
window.BinduApiClient = BinduApiClient;
window.ApiError = ApiError;
window.JsonRpcError = JsonRpcError;
window.TaskPoller = TaskPoller;
