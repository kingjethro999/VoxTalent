# Voice Interview Setup Guide

## Important: Use the Correct Page

The new voice-first interview flow is available at:
- **`/voice-interview`** - This is the NEW page with the ElevenLabs widget integration

The old page at `/ai` still uses the legacy audio processing API and will show errors.

## Environment Variables Setup

1. Create a `.env.local` file in the root directory:

```bash
# ElevenLabs API Key (required for widget to work)
ELEVENLABS_API_KEY=your_api_key_here

# Agent IDs (optional - defaults are already set in code)
NEXT_PUBLIC_RESUMEBUDDY_AGENT_ID=agent_3101kdqdvxzse409wmgmbrk97fg6
# Note: InterPrep no longer uses an agent - it uses Gemini + ElevenLabs TTS directly
```

2. Get your ElevenLabs API key:
   - Go to https://elevenlabs.io/app/settings/api-keys
   - Create a new API key if needed
   - Copy it to your `.env.local` file

3. Restart your development server:
   ```bash
   pnpm dev
   ```

## How It Works

1. **Start Flow**: Click "Start Crafting" from the home page → Routes to `/voice-interview`
2. **Voice Interview**: ElevenLabs widget loads (may take a few seconds)
3. **Click "Get Started"**: Widget initializes and agent starts speaking
4. **Conversation**: Agent conducts natural interview, transcripts are collected
5. **End Detection**: System detects when conversation is complete
6. **Processing**: Transcript sent to Gemini API for structured data extraction
7. **Template Selection**: Routes to `/cv-select` to choose a template
8. **Preview**: Routes to `/view/[template]` to see the resume
9. **Download**: User downloads the final PDF

## Troubleshooting

### Widget Not Loading

If the widget doesn't initialize:
1. Check browser console for errors
2. Verify your API key is set correctly
3. Make sure you're on `/voice-interview` (not `/ai`)
4. Check that the ElevenLabs widget script is loading (look for `[ElevenLabs Widget]` logs in console)

### "API key not configured" Error

This means:
1. Your `.env.local` file is missing or incorrect
2. You haven't restarted the dev server after adding the key
3. The API key doesn't have the right permissions

### Widget Script Not Found

The widget tries multiple script URLs. If all fail:
1. Check your internet connection
2. Verify ElevenLabs service is accessible
3. Check browser console for specific error messages

## Development Notes

- The widget uses a fallback initialization if the standard API isn't available
- All transcript events are logged to console with `[ElevenLabs Widget]` prefix
- Error states are handled with the ErrorState component
- The widget UI is masked with CSS to hide default buttons/branding

