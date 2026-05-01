/**
 * MAX Channel Plugin - Setup Entry
 * Lightweight loading for onboarding
 */
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";
import { maxChatPlugin } from "./src/channel.js";
export default defineSetupPluginEntry(maxChatPlugin);
