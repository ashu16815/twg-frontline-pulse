export async function callAzureJSON(messages: any[]) {
  const ep = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const key = process.env.AZURE_OPENAI_API_KEY?.trim();
  const dep = process.env.AZURE_OPENAI_DEPLOYMENT_GPT5?.trim();
  const v = process.env.AZURE_OPENAI_API_VERSION?.trim() || '2024-10-01-preview';
  
  if (!ep || !key || !dep) {
    console.error('❌ Missing Azure OpenAI configuration');
    throw new Error('Missing Azure OpenAI configuration: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, and AZURE_OPENAI_DEPLOYMENT_GPT5 required');
  }
  
  const url = `${ep}openai/deployments/${dep}/chat/completions?api-version=${v}`;
  
  console.log('🤖 Calling Azure OpenAI:', {
    endpoint: ep,
    deployment: dep,
    messageCount: messages.length
  });
  
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': key
    },
    body: JSON.stringify({
      messages,
      response_format: { type: 'json_object' },
      max_completion_tokens: 2000
    })
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    console.error('❌ Azure OpenAI API error:', errorText);
    throw new Error(`Azure OpenAI API error: ${r.status} - ${errorText}`);
  }
  
  const j = await r.json();
  console.log('📥 Azure OpenAI response:', {
    finishReason: j.choices?.[0]?.finish_reason,
    hasContent: !!j.choices?.[0]?.message?.content
  });
  
  const text = j.choices?.[0]?.message?.content || '';
  
  if (!text) {
    console.error('⚠️  Empty response from Azure OpenAI');
    return {};
  }
  
  try {
    const parsed = JSON.parse(text);
    console.log('✅ Parsed JSON response:', Object.keys(parsed));
    return parsed;
  } catch (e) {
    console.error('❌ Failed to parse AI response as JSON:', text.substring(0, 200));
    return {};
  }
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
