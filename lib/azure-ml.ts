import 'server-only';

export async function callAzureML(payload: any) {
  const uri = process.env.AZURE_ML_SCORING_URI;
  const key = process.env.AZURE_ML_KEY;
  
  if (!uri || !key) {
    return { ok: false, note: 'AZURE_ML_* not configured' };
  }
  
  try {
    const r = await fetch(uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(payload),
    });
    
    if (!r.ok) {
      throw new Error(await r.text());
    }
    
    return { ok: true, data: await r.json() };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
