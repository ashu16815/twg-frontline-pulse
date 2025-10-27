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

export async function askCEOWithRAG(question: string, rows: any[]) {
  const system = {
    role: 'system',
    content: `You are a retail operations analyst for The Warehouse Group. Answer CEO questions using the provided feedback data from the last 7 days.

Return ONLY valid JSON: {answer:string}

Guidelines:
- Be specific and data-driven
- Include store names, regions, and dollar amounts when available
- Reference specific feedback entries when relevant
- Keep answers concise (120 words max)
- If specific information isn't in the data, say so clearly
- Focus on actionable insights and patterns`
  };
  
  const user = {
    role: 'user',
    content: `Question: ${question}\n\nFeedback Data (Last 7 Days):\n${JSON.stringify(rows, null, 2)}`
  };
  
  return callAzureJSON([system, user], { timeout: 20000, maxRetries: 1 });
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