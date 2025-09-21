# Voice Transcription Setup Guide

## Current Status
Voice transcription is currently **not configured** because the Azure OpenAI transcription deployment is missing.

## Error Message
When users try to use voice input, they see:
> "Transcription not available - Azure OpenAI transcription deployment not configured"

## To Enable Voice Transcription

### Option 1: Set up Azure OpenAI Transcription Deployment

1. **Go to Azure OpenAI Studio**
   - Navigate to your Azure OpenAI resource
   - Go to "Deployments" section

2. **Create a Transcription Deployment**
   - Click "Create new deployment"
   - Choose model: `whisper-1` or `gpt-4o-transcribe`
   - Name: `gpt-4o-transcribe` (or any name you prefer)
   - Click "Create"

3. **Update Environment Variables**
   - In Vercel dashboard, add:
     ```
     AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE=gpt-4o-transcribe
     ```
   - Redeploy the application

### Option 2: Use Alternative Transcription Service

If you prefer not to use Azure OpenAI for transcription, you can:

1. **Use Web Speech API** (browser built-in)
2. **Use Google Cloud Speech-to-Text**
3. **Use AWS Transcribe**

## Current Workaround

Users can still use the application by:
1. **Typing their feedback** directly in the text fields
2. **Filling out the form manually** - all functionality works except voice input

## Testing Voice Input

Once configured, test with:
1. Go to `/weekly/submit`
2. Click "Start recording"
3. Speak: "Apparel down 10% due to late delivery; Home down 7% due to stockroom congestion; Toys down 5% due to supplier delay"
4. Click "Stop"
5. The text should appear in the form fields

## Troubleshooting

- **"Transcription failed"** = Azure OpenAI deployment not found
- **"Transcription service unavailable"** = Network or configuration issue
- **No audio recorded** = Browser permissions not granted

## Next Steps

1. Set up the Azure OpenAI transcription deployment
2. Update Vercel environment variables
3. Test voice input functionality
4. Remove this setup guide once working
