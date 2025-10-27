import { callAzureJSON } from './azure';
import { getFinancialYearWeek } from './timezone';

export function weekKey(d: Date) {
  return getFinancialYearWeek(d);
}

export async function analyzePerformance(payload: {
  isoWeek: string;
  region: string;
  hitTarget: boolean;
  variancePct?: number;
  varianceDollars?: number;
  reasons: {
    rank: number;
    dept: string;
    subcat: string;
    driver: string;
    text: string;
    dollarImpact: number;
  }[];
  priorities: {
    rank: number;
    text: string;
    horizon: string;
  }[];
}) {
  const system = {
    role: 'system',
    content: `You are a retail ops & finance analyst. Return strict JSON: {overall:{hitTarget:boolean,variancePct:number,varianceDollars:number}, reasons:[{rank,dept,subcat,driver,text,dollarImpact,score(-1..1),mood:'neg|neu|pos'}], themes:string[], priorities:[{rank,text,horizon}], overallMood:'neg|neu|pos'}. Normalise 'driver' to a stable set (Availability, Late Delivery, Roster/Sickness, Space/Planogram, Fitting Rooms, Promo On-Shelf, Replen Backlog, POS Stability, Bulky Stock).`
  };
  const user = {
    role: 'user',
    content: JSON.stringify(payload)
  };
  return callAzureJSON([system, user], { timeout: 15000, maxRetries: 1 });
}

export async function summariseWeeklyFinance(isoWeek: string, region: string, rows: any[]) {
  const system = {
    role: 'system',
    content: `Create a WEEKLY regional finance-aware summary. Return JSON: {summary:string, topThemes:string[], totalImpact:number, topDrivers:[{driver:string,dollars:number,count:number}]}. Sum dollarImpact across stores by driver.`
  };
  const user = {
    role: 'user',
    content: JSON.stringify({ isoWeek, region, rows })
  };
  return callAzureJSON([system, user], { timeout: 15000, maxRetries: 1 });
}

export async function generateExecutiveReport(isoWeek: string, allRows: any[], allSummaries: any[]) {
  const system = {
    role: 'system',
    content: `You are a Retail Operations Executive producing an actionable weekly report for the leadership team.

Analyze the store feedback data and create a comprehensive executive summary.

Return ONLY valid JSON with this EXACT structure:
{
  "narrative": "2-3 paragraph executive summary covering: overall performance, key wins, major challenges, and strategic implications",
  "highlights": ["3-5 bullet points of major wins and positive performance drivers"],
  "whatWorking": ["3-5 specific things that are working well across stores with evidence"],
  "whatNotWorking": ["3-5 specific problems/challenges across stores with evidence"],
  "themes": [
    {"name": "Theme name", "count": number of stores mentioning, "impact": total dollar impact, "type": "positive" or "negative"}
  ],
  "risks": ["3-5 specific risks to business performance with potential impact"],
  "actions": [
    {"owner": "Ops Team/Store Ops/Supply Chain/etc", "action": "Specific actionable task", "due": "This Week/Next Week/Next Month", "priority": "High/Medium/Low"}
  ],
  "metrics": {
    "totalStores": number,
    "positiveImpact": total positive dollar impact,
    "negativeImpact": total negative dollar impact,
    "netImpact": net impact,
    "topRegion": "best performing region",
    "concernRegion": "region needing attention"
  }
}

Guidelines:
- Be specific and data-driven
- Include dollar amounts where available
- Prioritize actionable insights
- Identify patterns across stores/regions
- Suggest concrete next steps with owners
- Highlight both successes AND problems
- Use professional executive language`
  };
  
  const user = {
    role: 'user',
    content: JSON.stringify({ 
      isoWeek, 
      rows: allRows, 
      summaries: allSummaries,
      instruction: `Analyze ${allRows.length} store feedback submissions for week ${isoWeek}. Create an executive report that the ops team can use to take immediate action.`
    })
  };
  
  return callAzureJSON([system, user], { timeout: 15000, maxRetries: 1 });
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
    content: `You are a retail ops analyst. Return JSON: {issues:[{rank,score(-1..1),mood:'neg|neu|pos',themes:string[]}], overallScore, overallMood:'neg|neu|pos', themes:string[]}. Use stable tags like 'Apparel Stockouts','Late Delivery','Planogram Compliance','Replen Backlog','Staffing Shortfall'.`
  };
  const user = {
    role: 'user',
    content: JSON.stringify(payload)
  };
  return callAzureJSON([system, user], { timeout: 15000, maxRetries: 1 });
}

export async function askCEO(question: string, isoWeek: string, rows: any[], summaries: any[]) {
  const system = {
    role: 'system',
    content: `Answer CEO questions with crisp facts <=120 words, from supplied weekly data only. Return JSON: {answer:string}. Include numbers ($, counts) if present.`
  };
  const user = {
    role: 'user',
    content: JSON.stringify({ isoWeek, rows, summaries, question })
  };
  return callAzureJSON([system, user], { timeout: 15000, maxRetries: 1 });
}

export async function askCEOWithRAG(question: string, rows: any[], conversationHistory: any[] = [], tone: 'concise' | 'narrative' = 'concise') {
  // System prompt for Retail Expert (Big 4 caliber)
  const system = {
    role: 'system',
    content: `You are a Senior Retail Operations Expert (Big 4 caliber) advising a large multi-store retailer (The Warehouse Group).
    
    Principles: be concise, decision-oriented, and action-focused. Prefer bullet points over paragraphs.
    Never invent data; if uncertain, say what you would check. Use consistent retail vocabulary (availability, conversion, UPT, ATV, sell-through, stock-on-hand, pallets out, roster gaps).
    Always format outputs as instructed by the selected tone schema.`
  };
  
  // Build conversation context
  const conversationContext = conversationHistory.length > 0 
    ? `\n\nPrevious conversation:\n${conversationHistory.map(m => `${m.role === 'user' ? 'CEO' : 'You'}: ${m.content}`).join('\n')}\n\n`
    : '';
  
  // Define output schema based on tone
  const schema = tone === 'narrative' 
    ? `Return a short executive paragraph (≤120 words), then a brief action list:

**Summary**
<single paragraph, ≤120 words>

**Next steps**
- <action 1, ≤16 words>
- <action 2, ≤16 words>
- <action 3, ≤16 words>`
    : `Return ONLY valid Markdown in this exact structure:

**Answer**
- <bullet 1, ≤18 words>
- <bullet 2, ≤18 words>
- <bullet 3, ≤18 words>
- <bullet 4, ≤18 words>
- <bullet 5, ≤18 words>
- <bullet 6, ≤18 words>

**So what**
- <one line, ≤20 words summarising the implication or next step>`;
  
  const user = {
    role: 'user',
    content: `${conversationContext}Current question: ${question}

Feedback Data (Last 7 Days):\n${JSON.stringify(rows, null, 2)}

Formatting contract:
${schema}`
  };
  
  return callAzureJSON([system, user], { 
    timeout: 20000, 
    maxRetries: 1,
    maxTokens: tone === 'narrative' ? 400 : 220
  });
}

export async function analyzeFrontlineFeedback(payload: {
  region: string;
  isoWeek: string;
  positive: { text: string; impact: number } | null;
  negatives: { text: string; impact: number }[];
  nextActions: string;
  freeformComments: string;
  estimatedDollarImpact: number;
}) {
  const system = {
    role: 'system',
    content: `You are a retail operations analyst analyzing frontline store feedback. Return JSON: {overallScore:number(-1..1), overallMood:'neg|neu|pos', themes:string[]}. Focus on themes like 'Staffing', 'Inventory', 'Customer Experience', 'Operations', 'Competition', 'Local Market', 'Technology', 'Training'. Consider both positive and negative feedback for balanced analysis.`
  };
  const user = {
    role: 'user',
    content: JSON.stringify(payload)
  };
  return callAzureJSON([system, user], { timeout: 15000, maxRetries: 1 });
}