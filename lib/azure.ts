export async function callAzureJSON(messages: any[], options: { timeout?: number; maxRetries?: number } = {}) {
  const ep = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const key = process.env.AZURE_OPENAI_API_KEY?.trim();
  const dep = process.env.AZURE_OPENAI_DEPLOYMENT_GPT5?.trim();
  const v = process.env.AZURE_OPENAI_API_VERSION?.trim() || '2024-10-01-preview';
  const timeout = options.timeout || parseInt(process.env.AZURE_OPENAI_TIMEOUT || '25000'); // 25 seconds default
  const maxRetries = options.maxRetries || parseInt(process.env.AZURE_OPENAI_MAX_RETRIES || '2');
  
  if (!ep || !key || !dep) {
    console.error('❌ Missing Azure OpenAI configuration');
    throw new Error('Missing Azure OpenAI configuration: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_GPT5 required');
  }
  
  const url = `${ep}openai/deployments/${dep}/chat/completions?api-version=${v}`;
  
  console.log('🤖 Calling Azure OpenAI:', {
    endpoint: ep,
    deployment: dep,
    messageCount: messages.length,
    timeout: timeout
  });
  
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': key
        },
        body: JSON.stringify({
          messages,
          response_format: { type: 'json_object' },
          max_completion_tokens: 2000,
          temperature: 0.1 // Lower temperature for more consistent responses
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!r.ok) {
        const errorText = await r.text();
        console.error(`❌ Azure OpenAI API error (attempt ${attempt}):`, errorText);
        lastError = new Error(`Azure OpenAI API error: ${r.status} - ${errorText}`);
        
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        throw lastError;
      }
      
      const j = await r.json();
      console.log('📥 Azure OpenAI response:', {
        finishReason: j.choices?.[0]?.finish_reason,
        hasContent: !!j.choices?.[0]?.message?.content,
        attempt
      });
      
      const text = j.choices?.[0]?.message?.content || '';
      
      if (!text) {
        console.error(`⚠️  Empty response from Azure OpenAI (attempt ${attempt})`);
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        throw new Error('Empty response from Azure OpenAI after all retries');
      }
      
      try {
        const parsed = JSON.parse(text);
        console.log('✅ Parsed JSON response:', Object.keys(parsed));
        return parsed;
      } catch (e) {
        console.error(`❌ Failed to parse AI response as JSON (attempt ${attempt}):`, text.substring(0, 200));
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        throw new Error(`Failed to parse AI response as JSON after all retries: ${text.substring(0, 200)}`);
      }
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error(`⏰ Request timed out after ${timeout}ms (attempt ${attempt})`);
        lastError = new Error(`Request timed out after ${timeout}ms`);
      } else {
        console.error(`❌ Request failed (attempt ${attempt}):`, error.message);
        lastError = error;
      }
      
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        continue;
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

export async function transcribeAudioWebm(buf: Buffer, mime: string) {
  const ep = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const key = process.env.AZURE_OPENAI_API_KEY?.trim();
  const dep = process.env.AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE?.trim();
  const v = process.env.AZURE_OPENAI_API_VERSION?.trim() || '2024-10-01-preview';
  
  // Check if transcription is available
  if (!ep || !key || !dep) {
    throw new Error('Transcription not available - Azure OpenAI transcription deployment not configured: AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE required');
  }
  
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: mime }), 'audio.webm');
  fd.append('response_format', 'json');
  
  const url = `${ep}openai/deployments/${dep}/audio/transcriptions?api-version=${v}`;
  
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': key
    },
    body: fd
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    console.error('Transcription API error:', errorText);
    throw new Error(`Transcription failed: ${r.status} - ${errorText}`);
  }
  
  const j = await r.json();
  return j.text as string;
}
