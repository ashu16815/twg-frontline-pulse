import { getAzureOpenAI, getChatModel } from "./azure";

type IssueIn = { rank:number; category:string; text:string; impact?:string };

async function chatJSON(messages: {role:"system"|"developer"|"user"; content:string}[]) {
  const client = getAzureOpenAI();
  const model = getChatModel();

  const res = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" } as any, // supported on Azure recent builds
    messages
  });

  const text = res.choices?.[0]?.message?.content || "{}";
  return JSON.parse(text);
}

/** 1) Score + themes for a single store submission */
export async function analyzeIssuesChat(input: {
  region: string;
  isoWeek: string;
  storeId: string;
  storeName: string;
  issues: IssueIn[];
}) {
  const system = {
    role: "system" as const,
    content:
`You are a retail operations analyst.
Return STRICT JSON:
{
  "issues": [{"rank":1,"score":-1..1,"mood":"neg|neu|pos","themes":["..."]}, ...],
  "overallScore": -1..1,
  "overallMood": "neg|neu|pos",
  "themes": ["Apparel Stockouts","Late Delivery","Planogram Compliance","Replen Backlog","Staffing Shortfall", "..."]
}
Scoring: use the issue text and impact hints.
Keep theme tags stable across weeks.`
  };

  const user = {
    role: "user" as const,
    content: JSON.stringify(input)
  };

  return chatJSON([system, user]);
}

/** 2) Weekly exec summary per region */
export async function summariseWeeklyChat(params: {
  region: string;
  isoWeek: string;
  rows: any[]; // store_feedback rows for the region+week
}) {
  const system = {
    role: "system" as const,
    content:
`You write concise WEEKLY executive summaries.
Return STRICT JSON: { "summary": string, "topThemes": string[] }
Guidelines:
- 150–200 words, factual, specific.
- Include theme counts and 2 store examples (city or code).
- End with 3 crisp actions (owner placeholder allowed).`
  };

  // Trim payload to stay under token limits
  const rows = (params.rows || []).slice(0, 120).map(r => ({
    store: `${r.store_id} ${r.store_name}`,
    issues: [
      `${r.issue1_cat}: ${r.issue1_text}`,
      `${r.issue2_cat}: ${r.issue2_text}`,
      `${r.issue3_cat}: ${r.issue3_text}`
    ],
    mood: r.overall_mood,
    themes: r.themes
  }));

  const user = {
    role: "user" as const,
    content: JSON.stringify({ region: params.region, isoWeek: params.isoWeek, rows })
  };

  return chatJSON([system, user]);
}

/** 3) CEO Q&A grounded on THIS WEEK'S data only */
export async function askCEOChat(params: {
  question: string;
  isoWeek: string;
  rows: any[];
  summaries: any[];
}) {
  const system = {
    role: "system" as const,
    content:
`You are an executive analyst.
Answer the CEO strictly from the provided weekly data.
If unknown, say "Not in this week's data."
Return STRICT JSON: { "answer": string }`
  };

  // Compact the grounding context
  const rows = (params.rows || []).slice(0, 160).map(r => ({
    region: r.region,
    store: `${r.store_id} ${r.store_name}`,
    i1: `${r.issue1_cat}: ${r.issue1_text}`,
    i2: `${r.issue2_cat}: ${r.issue2_text}`,
    i3: `${r.issue3_cat}: ${r.issue3_text}`,
    mood: r.overall_mood,
    themes: r.themes
  }));
  const summaries = (params.summaries || []).slice(0, 30);

  const user = {
    role: "user" as const,
    content: JSON.stringify({
      isoWeek: params.isoWeek,
      question: params.question,
      summaries,
      rows
    })
  };

  return chatJSON([system, user]);
}
