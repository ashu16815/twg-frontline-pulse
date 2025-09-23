import { callAzureJSON } from './azure';

export function weekKey(d: Date) {
  const t = new Date(d.getTime());
  t.setHours(0, 0, 0, 0);
  const onejan = new Date(t.getFullYear(), 0, 1);
  const week = Math.ceil((((t.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${t.getFullYear()}-W${week}`;
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
  return callAzureJSON([system, user]);
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
  return callAzureJSON([system, user]);
}

export async function generateExecutiveReport(isoWeek: string, allRows: any[], allSummaries: any[]) {
  const system = {
    role: 'system',
    content: `Produce an exec report grounded only in provided data. Return JSON: {narrative:string, highlights:string[], themes:{name:string,count:number,impact:number}[], risks:string[], actions:{owner:string,action:string,due:string}[]}. Aggregate theme counts and total $ impact across regions.`
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
    content: `Answer CEO questions with crisp facts <=120 words, from supplied weekly data only. Return JSON: {answer:string}. Include numbers ($, counts) if present.`
  };
  const user = {
    role: 'user',
    content: JSON.stringify({ isoWeek, rows, summaries, question })
  };
  return callAzureJSON([system, user]);
}