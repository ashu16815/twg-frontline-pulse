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
    content: `You produce an exec report based ONLY on provided data. Return JSON with keys: {highlights:string[],themes:{name:string,count:number,regions:string[]}[],risks:string[],actions:{owner:string,action:string,due:string}[],narrative:string}. Keep it concise and board-ready.`
  };
  const user = {
    role: 'user',
    content: JSON.stringify({ isoWeek, rows: allRows, summaries: allSummaries })
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