export async function callAzureJSON(messages: any[]) {
  const ep = process.env.AZURE_OPENAI_BASE_URL?.trim();
  const key = process.env.AZURE_OPENAI_API_KEY?.trim();
  const dep = process.env.AZURE_OPENAI_DEPLOYMENT?.trim();
  const v = process.env.AZURE_OPENAI_API_VERSION?.trim() || '2024-12-01-preview';
  
  if (!ep || !key || !dep) throw new Error('Missing Azure OpenAI env');
  
  const r = await fetch(`${ep}/openai/deployments/${dep}/chat/completions?api-version=${v}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': key
    },
    body: JSON.stringify({
      messages,
      response_format: { type: 'json_object' }
    })
  });
  
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  const text = j.choices?.[0]?.message?.content || '';
  return text ? JSON.parse(text) : {};
}

export async function transcribeAudioWebm(buf: Buffer, mime: string) {
  const ep = process.env.AZURE_OPENAI_BASE_URL?.trim();
  const key = process.env.AZURE_OPENAI_API_KEY?.trim();
  const dep = process.env.AZURE_OPENAI_DEPLOYMENT_TRANSCRIBE?.trim();
  const v = process.env.AZURE_OPENAI_API_VERSION?.trim() || '2024-12-01-preview';
  
  // Check if transcription is available
  if (!ep || !key || !dep) {
    throw new Error('Transcription not available - Azure OpenAI transcription deployment not configured');
  }
  
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: mime }), 'audio.webm');
  fd.append('response_format', 'json');
  
  const r = await fetch(`${ep}/openai/deployments/${dep}/audio/transcriptions?api-version=${v}`, {
    method: 'POST',
    headers: {
      'api-key': key
    },
    body: fd
  });
  
  if (!r.ok) {
    const errorText = await r.text();
    console.error('Transcription API error:', errorText);
    throw new Error(`Transcription failed: ${errorText}`);
  }
  
  const j = await r.json();
  return j.text as string;
}
