export async function callJSON(messages: any[]) {
  try {
    const { getAzureOpenAI, getChatModel } = await import('./azure');
    const openai = getAzureOpenAI();
    const model = getChatModel();
    
    const response = await openai.chat.completions.create({
      model,
      messages,
      response_format: { type: 'json_object' }
    });

    const text = response.choices?.[0]?.message?.content || '';
    return JSON.parse(text || '{}');
  } catch (error) {
    throw new Error(`Azure OpenAI call failed: ${error.message}`);
  }
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
  try {
    const system = {
      role: 'system',
      content: `You are a retail ops analyst. Return JSON: {issues:[{rank,score(-1..1),mood:'neg|neu|pos',themes:string[]}], overallScore, overallMood:'neg|neu|pos', themes:string[]}. Keep theme tags stable (e.g., 'Apparel Stockouts','Late Delivery','Planogram Compliance','Replen Backlog','Staffing Shortfall').`
    };
    
    const user = {
      role: 'user',
      content: JSON.stringify(payload)
    };

    return await callJSON([system, user]);
  } catch (error) {
    console.log('Azure OpenAI not available, using mock AI analysis');
    const { mockAnalyzeIssues } = await import('./mock-ai');
    return mockAnalyzeIssues(payload);
  }
}

export function weekKey(d: Date) {
  const t = new Date(d.getTime());
  t.setHours(0, 0, 0, 0);
  const onejan = new Date(t.getFullYear(), 0, 1);
  const week = Math.ceil((((t.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${t.getFullYear()}-W${week}`;
}

export async function summariseWeekly(region: string, isoWeek: string, rows: any[]) {
  try {
    const system = {
      role: 'system',
      content: `Create an executive WEEKLY narrative. Return JSON: {summary:string, topThemes:string[]}. Max 200 words. Include theme counts, 2 store examples, and 5 actions with owner placeholders. Tone: factual, specific.`
    };
    
    const user = {
      role: 'user',
      content: JSON.stringify({ region, isoWeek, rows })
    };

    return await callJSON([system, user]);
  } catch (error) {
    console.log('Azure OpenAI not available, using mock AI summary');
    const { mockSummariseWeekly } = await import('./mock-ai');
    return mockSummariseWeekly(region, isoWeek, rows);
  }
}

export async function askCEO(question: string, isoWeek: string, rows: any[], summaries: any[]) {
  try {
    const system = {
      role: 'system',
      content: `You are an executive analyst. Answer CEO questions strictly from the provided weekly data. Be concise (<=120 words). If unknown, say so. Return JSON: {answer:string}.`
    };
    
    const user = {
      role: 'user',
      content: JSON.stringify({ isoWeek, rows, summaries, question })
    };

    return await callJSON([system, user]);
  } catch (error) {
    console.log('Azure OpenAI not available, using mock AI Q&A');
    const { mockAskCEO } = await import('./mock-ai');
    return mockAskCEO(question, isoWeek, rows, summaries);
  }
}
