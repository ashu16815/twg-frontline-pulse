import { callAzureJSON } from './azure';

export function weekKey(d: Date) {
  const t = new Date(d.getTime());
  t.setHours(0, 0, 0, 0);
  const onejan = new Date(t.getFullYear(), 0, 1);
  const week = Math.ceil((((t.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${t.getFullYear()}-W${week}`;
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
  return callAzureJSON([system, user]);
}

export async function summariseWeekly(region: string, isoWeek: string, rows: any[]) {
  const system = {
    role: 'system',
    content: `Create an executive WEEKLY narrative. Return JSON: {summary:string, topThemes:string[]}. Max 200 words. Include theme counts, 2 store examples, and 5 actions with owner placeholders.`
  };
  const user = {
    role: 'user',
    content: JSON.stringify({ region, isoWeek, rows })
  };
  return callAzureJSON([system, user]);
}

export async function generateExecutiveReport(isoWeek: string, allRows: any[], allSummaries: any[]) {
  const system = {
    role: 'system',
    content: `You are a retail executive analyst creating a comprehensive weekly report. Analyze the data and return JSON with these keys:
    {
      "highlights": ["key insight 1", "key insight 2", "key insight 3"],
      "themes": [{"name": "theme name", "count": number, "regions": ["region1", "region2"], "sentiment": "pos|neg|neu", "impact": "high|medium|low"}],
      "sentimentAnalysis": {
        "overall": "pos|neg|neu",
        "score": -1.0 to 1.0,
        "byRegion": {"North": "pos|neg|neu", "Central": "pos|neg|neu", "South": "pos|neg|neu"},
        "trends": ["trending positive", "concerning negative"]
      },
      "risks": ["risk 1", "risk 2", "risk 3"],
      "opportunities": ["opportunity 1", "opportunity 2"],
      "actions": [{"owner": "role", "action": "specific action", "due": "timeline", "priority": "high|medium|low"}],
      "narrative": "executive summary paragraph",
      "metrics": {
        "totalSubmissions": number,
        "avgMoodScore": number,
        "topCategory": "category name",
        "criticalIssues": number
      }
    }
    
    Focus on actionable insights, sentiment trends, and business impact.`
  };
  const user = {
    role: 'user',
    content: JSON.stringify({ 
      isoWeek, 
      rows: allRows, 
      summaries: allSummaries,
      totalSubmissions: allRows.length,
      regions: Array.from(new Set(allRows.map(r => r.region))),
      categories: Array.from(new Set(allRows.flatMap(r => [r.issue1_cat, r.issue2_cat, r.issue3_cat]))),
      moods: allRows.map(r => r.overall_mood).filter(Boolean)
    })
  };
  return callAzureJSON([system, user]);
}

export async function askCEO(question: string, isoWeek: string, rows: any[], summaries: any[]) {
  const system = {
    role: 'system',
    content: `Answer CEO questions strictly from data. Be concise (<=120 words). If unknown, say so. Return JSON: {answer:string}.`
  };
  const user = {
    role: 'user',
    content: JSON.stringify({ isoWeek, rows: summaries.length ? summaries : [], details: rows, question })
  };
  return callAzureJSON([system, user]);
}