/**
 * MAX Bot API Client
 * API: https://platform-api.max.ru/
 */
const BASE_URL = "https://platform-api.max.ru";
export class MaxClient {
    token;
    constructor(token) {
        this.token = token;
    }
    async request(method, endpoint, body) {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: this.token,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`MAX API error: ${response.status} - ${error}`);
        }
        return response.json();
    }
    /**
     * Get bot info
     */
    async getMe() {
        return this.request("GET", "/me");
    }
    /**
     * Send message to chat
     */
    async sendMessage(chatId, text) {
        return this.request("POST", "/messages.send", {
            chat_id: chatId,
            text,
        });
    }
    /**
     * Send reply to message
     */
    async sendReply(chatId, text, replyToMessageId) {
        return this.request("POST", "/messages.send", {
            chat_id: chatId,
            text,
            reply_to_message_id: replyToMessageId,
        });
    }
    /**
     * Get updates (Long Polling)
     */
    async getUpdates(limit = 100, timeout = 30) {
        return this.request("GET", `/updates?limit=${limit}&timeout=${timeout}`);
    }
    /**
     * Set webhook for receiving updates
     */
    async setWebhook(url) {
        return this.request("POST", "/subscriptions", {
            url,
            update_types: ["message", "bot_started"],
        });
    }
    /**
     * Get current webhook status
     */
    async getWebhook() {
        return this.request("GET", "/subscriptions");
    }
    /**
     * Delete webhook
     */
    async deleteWebhook() {
        return this.request("DELETE", "/subscriptions");
    }
    /**
     * Get chat info
     */
    async getChat(chatId) {
        return this.request("GET", `/chats/${chatId}`);
    }
    /**
     * Get user info
     */
    async getUser(userId) {
        return this.request("GET", `/users/${userId}`);
    }
}
export function createMaxClient(token) {
    return new MaxClient(token);
}
