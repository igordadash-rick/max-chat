# MAX Chat Plugin for OpenClaw — RELEASE 2026-05-01

## 📋 Overview

**Plugin Name:** MAX Messenger Channel Plugin  
**Version:** 0.1.0  
**Status:** ✅ PRODUCTION READY  
**Channel Type:** max  

This plugin connects OpenClaw to MAX Messenger platform via webhook (primary) or polling (fallback).

---

## 🔧 Deployment Rules

### 1. Prerequisites

- OpenClaw gateway running
- Node.js compatible runtime
- Network access to `platform-api.max.ru`
- Webhook endpoint accessible from internet (for webhook mode)

### 2. Configuration File

Edit `/home/user/.openclaw/openclaw.json`:

```json
{
  "channels": {
    "max": {
      "enabled": true,
      "allowFrom": [
        "000000",   // User01
        "000000",   // User02
        "000000"    // User03
      ],
      "accounts": {
        "default": {
          "token": "YOUR_BOT_TOKEN_HERE",
          "webhookUrl": "https://max.your-domain.ru/max-webhook", // Your external URL to Webhook
          "webhookPort": 9443,	// Your internal port on OpenClaw
          "webhookPath": "/max-webhook",
          "webhookSecret": "openclaw_max_secret"
        }
      }
    }
  }
}
```

### 3. After Config Changes

Always restart gateway after modifying config:
```bash
openclaw gateway restart
```

### 4. Verify Plugin Loaded

```bash
curl http://localhost:9443/health | python3 -m json.tool
# or check logs:
journalctl --user -u openclaw-gateway -n 50 | grep MAX
```

---

## ⚙️ Configuration Explained

### Token
**Where to get:** MAX Bot settings in MAX Messenger app  
**Format:** String like `f9LHodD0cOLPOW3W1ihiOTSk...`  
**Required:** Yes

### webhookUrl
**Format:** `https://your-domain.com/max-webhook`  
**Purpose:** MAX platform sends messages to this URL  
**Required:** For webhook mode (recommended)

### webhookPort
**Default:** 9443  
**Purpose:** Local port where plugin's HTTP server listens  
**Note:** Must be accessible internally, not exposed directly to internet

### webhookPath
**Default:** `/max-webhook`  
**Purpose:** Path component of webhook URL  
**Full webhook URL:** `https://domain.com:9443/max-webhook` (port in URL)

### webhookSecret
**Purpose:** Validates incoming webhook requests from MAX  
**Note:** MAX sends this in headers, plugin verifies it

### allowFrom
**Purpose:** Whitelist of user_ids allowed to use the bot  
**Format:** Array of strings (MAX user_id as string, not phone!)  
**How to find user_id:** Check logs for blocked messages  
**Special value:** `["*"]` = allow everyone (NOT recommended in production)

---

## 🛡️ Security — allowFrom

### What is allowFrom?
User ID based filtering. Only users whose `user_id` is in the allowFrom list can communicate with the bot.

### Why user_id and not phone?
MAX API does NOT provide phone numbers in message payloads. Sender object contains only:
- `user_id` — internal platform ID (use this for filtering)
- `first_name`, `last_name`, `username` — names (no phone)

### How to add new user
1. Look at logs: `journalctl --user -u openclaw-gateway -n 500 | grep blocked`
2. Find their user_id in blocked message
3. Add to allowFrom array in config
4. Restart gateway

### Current allowFrom
        "000000",   // User01
        "000000",   // User02
        "000000"    // User03

---

## 🔄 Update Flow

### Incoming Message (MAX → OpenClaw)
```
MAX Platform → webhook POST → plugin:9443/max-webhook
  → gateway.js handles POST
  → inbound.js parses message (extracts user_id, text, chat_id)
  → allowFrom check (if blocked, log and reject)
  → dispatchInboundReplyWithBase() → OpenClaw AI
  → AI response → deliver() → MAX API → User
```

### Key Files

| File | Purpose |
|------|---------|
| `gateway.js` | HTTP server for webhook, polling loop, mode selection |
| `inbound.js` | Message parsing, allowFrom check, dispatch to OpenClaw |
| `client.js` | MAX API calls (getUpdates, sendMessage, setWebhook) |
| `accounts.js` | Account resolution from config |
| `runtime.js` | Stores/retrieves channel runtime (getMaxChannelRuntime) |

---

## 🔍 Debugging

### Watch All MAX Logs
```bash
journalctl --user -u openclaw-gateway -f | grep MAX
```

### Check Blocked Users
```bash
journalctl --user -u openclaw-gateway -n 500 | grep blocked
```

### Check Webhook Status
```bash
journalctl --user -u openclaw-gateway -n 50 | grep webhook
```

### Check Polling Status (fallback mode)
```bash
journalctl --user -u openclaw-gateway -n 50 | grep polling
```

### Expected Log Sequence (Success)
```
[MAX] startMaxGatewayAccount: configured=true, webhookUrl=https://max.your-domain.ru/max-webhook
[MAX] using WEBHOOK mode
[MAX] runWebhookMode: port=9443, path=/max-webhook
[max-webhook] listening on port 9443/max-webhook
[MAX] setWebhook result: success=true
[MAX] webhook received: type=message_created, chatId=XXXXX
[MAX] allowFrom check: senderId=XXXXX, account.allowFrom=[...], allowed=true
[MAX] handleMaxInbound called: type=message_created chatId=XXXXX text=...
[MAX] getMaxChannelRuntime() succeeded ✅
[MAX] dispatching to OpenClaw: agentId=main sessionKey=max:direct:XXXXX
[MAX] deliver: sending to XXXXX: AI response text
[MAX] deliver: sent successfully
```

### Expected Log Sequence (Blocked)
```
[MAX] webhook received: type=message_created, chatId=XXXXX
[MAX] allowFrom check: senderId=XXXXX, account.allowFrom=[...], allowed=false
[MAX] BLOCKED: senderId=XXXXX not in allowFrom
```

---

## ⚠️ Known Issues

### EACCES mkdir '/sessions'
**Cause:** SDK tries to create sessions directory at filesystem root  
**Impact:** None — sessions still work via alternative path  
**Fix:** Cosmetic only, ignore


---

## 🔢 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-30 | initial | Polling mode works, messages not delivered |
| 2026-04-30 | v2 | Fixed dispatchInboundReplyWithBase API |
| 2026-04-30 | v3 | Fixed getMaxChannelRuntime() |
| 2026-04-30 | v4 | Fixed deliver NaN issue |
| 2026-04-30 | v5 | Webhook mode enabled |
| 2026-04-30 | webhook-working | Real-time webhook confirmed working |
| 2026-05-01 | release | allowFrom filtering + documentation |

---

## 🚀 Quick Start (New Installation)

1. Copy `dist/` folder to `/home/user/.openclaw/extensions/max/`
2. Edit `openclaw.json` — add max channel config with token and allowFrom
3. Ensure webhook URL is accessible from internet
4. Run `openclaw gateway restart`
5. Check logs: `journalctl --user -u openclaw-gateway -n 50 | grep MAX`
6. Send test message from whitelisted user_id

---

## 📞 Support

**If bot not responding:**
1. Check webhook is registered: logs show `setWebhook result: success=true`
2. Check user is in allowFrom
3. Check gateway running: `openclaw gateway status`
4. Check logs for errors

**If messages blocked:**
1. Check logs: `grep blocked`
2. Find user_id of blocked user
3. Add to allowFrom
4. Restart gateway
