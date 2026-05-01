/**
 * MAX Channel Plugin for OpenClaw
 */
import { createChatChannelPlugin, createChannelPluginBase, } from "openclaw/plugin-sdk/core";
import { createMaxClient } from "./client.js";
/**
 * Resolve account from OpenClaw config
 */
function resolveAccount(cfg, accountId) {
    const section = cfg.channels?.["max"];
    const token = section?.token;
    if (!token) {
        throw new Error("MAX: token is required. Configure in openclaw.json");
    }
    return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmPolicy ?? "allowlist",
        client: createMaxClient(token),
    };
}
/**
 * Inspect account status
 */
async function inspectAccount(cfg, accountId) {
    const section = cfg.channels?.["max"];
    const token = section?.token;
    if (!token) {
        return {
            enabled: false,
            configured: false,
            tokenStatus: "missing",
        };
    }
    // Verify token works by getting bot info
    try {
        const client = createMaxClient(token);
        await client.getMe();
        return {
            enabled: true,
            configured: true,
            tokenStatus: "available",
        };
    }
    catch (error) {
        return {
            enabled: false,
            configured: true,
            tokenStatus: "invalid",
        };
    }
}
/**
 * Handle inbound messages from MAX
 */
async function handleInbound(api, update, account) {
    const { client } = account;
    // Parse the update
    if (update.update_type === "message" && update.message) {
        const message = update.message;
        const chatId = update.chat_id;
        const userId = update.user_id;
        const text = message.text;
        const messageId = message.message_id;
        if (!text)
            return;
        // Get user info
        let userInfo = { user_id: userId, name: "User" };
        try {
            userInfo = await client.getUser(userId);
        }
        catch (e) {
            console.warn("Could not get user info:", e);
        }
        // Forward to OpenClaw
        await api.handleInboundMessage({
            channel: "max",
            chatId: String(chatId),
            senderId: String(userId),
            senderName: userInfo.name,
            text,
            threadId: messageId ? String(messageId) : undefined,
            raw: update,
        });
    }
    // Handle bot started (deep link)
    if (update.update_type === "bot_started" && update.payload) {
        const chatId = update.chat_id;
        const userId = update.user_id;
        const payload = update.payload;
        await api.handleInboundMessage({
            channel: "max",
            chatId: String(chatId),
            senderId: String(userId),
            text: `/start ${payload}`,
            raw: update,
        });
    }
}
/**
 * Create the MAX channel plugin
 */
export const maxChatPlugin = createChatChannelPlugin({
    base: createChannelPluginBase({
        id: "max",
        setup: {
            resolveAccount,
            inspectAccount,
        },
    }),
    // DM security: who can message the bot
    security: {
        dm: {
            channelKey: "max",
            resolvePolicy: (account) => account.dmPolicy,
            resolveAllowFrom: (account) => account.allowFrom,
            defaultPolicy: "allowlist",
        },
    },
    // Pairing: approval flow for new DM contacts
    pairing: {
        text: {
            idLabel: "MAX username",
            message: "Send this code to verify your identity:",
            notify: async ({ target, code }, account) => {
                await account.client.sendMessage(Number(target), `Pairing code: ${code}`);
            },
        },
    },
    // Threading: how replies are delivered
    threading: {
        topLevelReplyToMode: "reply",
    },
    // Outbound: send messages to MAX
    outbound: {
        attachedResults: {
            sendText: async (params, account) => {
                const { to, text, threadId } = params;
                let result;
                if (threadId) {
                    // Reply to message
                    result = await account.client.sendReply(Number(to), text, Number(threadId));
                }
                else {
                    // New message
                    result = await account.client.sendMessage(Number(to), text);
                }
                return { messageId: String(result.message_id) };
            },
        },
    },
    // Full initialization - register webhook
    async onEnable(api, account) {
        const webhookUrl = `${api.getWebhookBaseUrl()}/max/webhook`;
        try {
            const webhook = await account.client.getWebhook();
            if (!webhook.url) {
                // Set new webhook
                await account.client.setWebhook(webhookUrl);
                console.log("[max] Webhook set to:", webhookUrl);
            }
            else if (webhook.url !== webhookUrl) {
                // Update webhook if different
                await account.client.deleteWebhook();
                await account.client.setWebhook(webhookUrl);
                console.log("[max] Webhook updated to:", webhookUrl);
            }
        }
        catch (error) {
            console.error("[max] Failed to set webhook:", error);
        }
    },
    // Handle inbound webhook requests
    async handleWebhook(api, req, account) {
        try {
            const update = req.body;
            if (!update) {
                return { statusCode: 400, body: "No body" };
            }
            await handleInbound(api, update, account);
            return { statusCode: 200, body: "ok" };
        }
        catch (error) {
            console.error("[max] Webhook error:", error);
            return { statusCode: 500, body: "Error" };
        }
    },
});
