# Webhook Secret vs Tool ID - Understanding the Difference

## You Got a Tool ID, Not a Webhook Secret

The ID you received (`tool_4901kdstc1a6ff7r1t21qnr0sqvp`) is a **Tool ID**, not a webhook secret.

## Two Types of Webhooks

### 1. Post-Call Webhooks (Automatic)
- **What it is:** ElevenLabs automatically sends data to your endpoint after a call ends
- **When it fires:** Automatically after every call
- **What you need:** A **Webhook Secret** (starts with `whsec_`)
- **Where to find it:** 
  - Go to https://elevenlabs.io/app/agents/settings
  - Navigate to "Webhooks" section
  - When you create a webhook, ElevenLabs provides a secret
  - It looks like: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. Webhook Tools (Agent-Callable)
- **What it is:** A tool the agent can call during a conversation
- **When it fires:** When the agent decides to call it
- **What you get:** A **Tool ID** (starts with `tool_`)
- **Your ID:** `tool_4901kdstc1a6ff7r1t21qnr0sqvp`

## For ResumeBuddy - You Need BOTH

### Option A: Use Post-Call Webhooks (Recommended)
1. Go to https://elevenlabs.io/app/agents/settings
2. Find your ResumeBuddy agent
3. Go to "Webhooks" section
4. Create a new webhook:
   - URL: `http://localhost:3000/api/elevenlabs-webhook` (or your ngrok URL)
   - Type: "Post-call Transcription"
   - ElevenLabs will provide a **webhook secret** (starts with `whsec_`)
5. Copy that secret to `.env.local`:
   ```
   ELEVENLABS_CONVAI_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### Option B: Use Webhook Tool (Your Current Setup)
If you're using the webhook tool (`tool_4901kdstc1a6ff7r1t21qnr0sqvp`):
- The tool ID is used to configure the agent
- The webhook secret is **optional** for webhook tools
- You can leave `ELEVENLABS_CONVAI_WEBHOOK_SECRET` empty in `.env.local`
- The webhook will work but without HMAC signature validation (less secure)

## Current Setup

Based on your tool ID, you're likely using a **webhook tool**. The code has been updated to work without a webhook secret, but for production, you should:

1. **Get the actual webhook secret** from ElevenLabs dashboard
2. **OR** use post-call webhooks instead (automatic, more reliable)

## Quick Fix

For now, you can leave the webhook secret empty in `.env.local`:

```env
ELEVENLABS_CONVAI_WEBHOOK_SECRET=
```

The webhook will still work, but without signature validation. This is fine for development but not recommended for production.

## Finding Your Webhook Secret

1. Log into ElevenLabs: https://elevenlabs.io/app/agents/settings
2. Go to your agent settings
3. Look for "Webhooks" or "Webhook Configuration"
4. If you see a webhook you created, click on it
5. You should see a "Secret" or "Webhook Secret" field
6. Copy that value (it starts with `whsec_`)

If you don't see a webhook secret, you might need to:
- Create a new webhook (not a webhook tool)
- Or check if your plan includes webhook secrets

