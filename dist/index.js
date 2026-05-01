/**
 * MAX Channel Plugin Entry Point
 */
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
import { maxChatPlugin } from "./src/channel.js";
export default defineChannelPluginEntry({
    id: "max",
    name: "MAX",
    description: "MAX messenger channel plugin for OpenClaw",
    plugin: maxChatPlugin,
    registerFull(api) {
        // Register webhook route
        api.registerHttpRoute({
            path: "/max/webhook",
            auth: "plugin", // plugin-managed auth
            handler: async (req, res) => {
                // Get account for this channel
                const account = await api.resolveAccount("max");
                if (!account) {
                    res.statusCode = 503;
                    res.end("Not configured");
                    return true;
                }
                return maxChatPlugin.handleWebhook(api, req, account);
            },
        });
        // Register CLI commands for MAX management
        api.registerCli(({ program }) => {
            program
                .command("max")
                .description("MAX messenger management")
                .option("--test", "Test MAX connection")
                .action(async (opts) => {
                if (opts.test) {
                    const account = await api.resolveAccount("max");
                    if (!account) {
                        console.log("MAX not configured");
                        return;
                    }
                    const me = await account.client.getMe();
                    console.log("MAX bot:", me);
                }
            });
        }, { commands: ["max"] });
    },
});
