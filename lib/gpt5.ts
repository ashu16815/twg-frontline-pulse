export async function callJSON(messages: any[]) {
  const ep = process.env.AZURE_OPENAI_ENDPOINT;
  const key = process.env.AZURE_OPENAI_API_KEY;
  const dep = process.env.AZURE_OPENAI_DEPLOYMENT_GPT5;
  const v = process.env.AZURE_OPENAI_API_VERSION || '2024-10-01-preview';

  if (!ep || !key || !dep) throw new Error('Missing Azure OpenAI env');

  const r = await fetch(`${ep}/openai/deployments/${dep}/responses?api-version=${v}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': key
    },
    body: JSON.stringify({
      input: messages,
      response_format: { type: 'json_object' }
    })
  });

  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  const text = j.output?.[0]?.content?.[0]?.text || j.output_text || '';
  return JSON.parse(text || '{}');
}

export async function analyzeIssues(payload: {
  region: string;
  isoWeek: string;
  issues: {
    rank: number;
    category: string;
    text: string;
    impact?: string;
  }[];
}) {
  const system = {
    role: 'system',
    content: `You are a retail ops analyst. Return JSON: {issues:[{rank,score(-1..1),mood:'neg|neu|pos',themes:string[]}], overallScore, overallMood:'neg|neu|pos', themes:string[]}. Keep theme tags stable (e.g., 'Apparel Stockouts','Late Delivery','Planogram Compliance','Replen Backlog','Staffing Shortfall').`
  };
  
  const user = {
    role: 'user',
    content: JSON.stringify(payload)
  };

  return callJSON([system, user]);
}

export function weekKey(d: Date) {
  const t = new Date(d.getTime());
  t.setHours(0, 0, 0, 0);
  const onejan = new Date(t.getFullYear(), 0, 1);
  const week = Math.ceil((((t.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${t.getFullYear()}-W${week}`;
}

export async function summariseWeekly(region: string, isoWeek: string, rows: any[]) {
  const system = {
    role: 'system',
    content: `Create an executive WEEKLY narrative. Return JSON: {summary:string, topThemes:string[]}. Max 200 words. Include theme counts, 2 store examples, and 5 actions with owner placeholders. Tone: factual, specific.`
  };
  
  const user = {
    role: 'user',
    content: JSON.stringify({ region, isoWeek, rows })
  };

  return callJSON([system, user]);
}

export async function askCEO(question: string, isoWeek: string, rows: any[], summaries: any[]) {
  const system = {
    role: 'system',
    content: `You are an executive analyst. Answer CEO questions strictly from the provided weekly data. Be concise (<=120 words). If unknown, say so. Return JSON: {answer:string}.`
  };
  
  const user = {
    role: 'user',
    content: JSON.stringify({ isoWeek, rows, summaries, question })
  };

  return callJSON([system, user]);
}
