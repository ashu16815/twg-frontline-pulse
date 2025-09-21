// Mock AI responses for when Azure OpenAI is not available
export function mockAnalyzeIssues(payload: {
  region: string;
  isoWeek: string;
  issues: {
    rank: number;
    category: string;
    text: string;
    impact?: string;
  }[];
}) {
  // Mock analysis based on keywords in the issues
  const issues = payload.issues.map((issue, index) => {
    const text = issue.text.toLowerCase();
    let score = 0;
    let mood = 'neu';
    
    // Simple keyword-based analysis
    if (text.includes('down') || text.includes('late') || text.includes('missing') || text.includes('failed')) {
      score = -0.7;
      mood = 'neg';
    } else if (text.includes('up') || text.includes('strong') || text.includes('good') || text.includes('improved')) {
      score = 0.7;
      mood = 'pos';
    } else if (text.includes('congestion') || text.includes('delay') || text.includes('shortage')) {
      score = -0.4;
      mood = 'neg';
    }
    
    return {
      rank: issue.rank,
      score,
      mood,
      themes: extractThemes(issue.text)
    };
  });
  
  const overallScore = issues.reduce((sum, issue) => sum + issue.score, 0) / issues.length;
  const overallMood = overallScore > 0.3 ? 'pos' : overallScore < -0.3 ? 'neg' : 'neu';
  const allThemes = Array.from(new Set(issues.flatMap(issue => issue.themes)));
  
  return {
    issues,
    overallScore,
    overallMood,
    themes: allThemes
  };
}

export function mockSummariseWeekly(region: string, isoWeek: string, rows: any[]) {
  const themes = Array.from(new Set(rows.flatMap((r: any) => r.themes || [])));
  const storeCount = rows.length;
  
  let summary = `Week ${isoWeek} - ${region} Region: `;
  
  if (themes.includes('Late Delivery')) {
    summary += 'Late deliveries impacting multiple stores. ';
  }
  if (themes.includes('Stockroom Ops')) {
    summary += 'Stockroom congestion affecting floor availability. ';
  }
  if (themes.includes('Staffing Shortfall')) {
    summary += 'Staffing gaps noted during peak periods. ';
  }
  if (themes.includes('POS Stability')) {
    summary += 'POS system issues reported. ';
  }
  
  summary += `Actions: Review supplier SLAs, optimize stockroom layout, adjust staffing rosters, and investigate POS stability.`;
  
  return {
    summary,
    topThemes: themes.slice(0, 5)
  };
}

export function mockAskCEO(question: string, isoWeek: string, rows: any[], summaries: any[]) {
  console.log('Mock AI - rows:', rows.length, 'summaries:', summaries.length);
  console.log('Mock AI - sample row:', rows[0]);
  
  const themes = Array.from(new Set(rows.flatMap((r: any) => r.themes || [])));
  const regions = Array.from(new Set(rows.map((r: any) => r.region)));
  
  console.log('Mock AI - themes:', themes, 'regions:', regions);
  
  if (question.toLowerCase().includes('themes')) {
    return {
      answer: `Top themes this week: ${themes.join(', ')}. These themes are affecting ${regions.length} regions across ${rows.length} stores.`
    };
  }
  
  if (question.toLowerCase().includes('region')) {
    const regionData = summaries.find(s => s.region);
    return {
      answer: regionData ? regionData.summary : 'No regional data available for analysis.'
    };
  }
  
  if (question.toLowerCase().includes('risks')) {
    return {
      answer: `Key risks identified: ${themes.slice(0, 3).join(', ')}. Immediate action required on supplier performance and operational efficiency.`
    };
  }
  
  return {
    answer: `Based on this week's data from ${rows.length} stores across ${regions.length} regions, the main focus areas are: ${themes.slice(0, 3).join(', ')}.`
  };
}

function extractThemes(text: string): string[] {
  const themes: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('late') || lowerText.includes('delivery') || lowerText.includes('container')) {
    themes.push('Late Delivery');
  }
  if (lowerText.includes('stockroom') || lowerText.includes('congestion') || lowerText.includes('bulky')) {
    themes.push('Stockroom Ops');
  }
  if (lowerText.includes('staff') || lowerText.includes('sick') || lowerText.includes('shortage')) {
    themes.push('Staffing Shortfall');
  }
  if (lowerText.includes('pos') || lowerText.includes('system') || lowerText.includes('freeze')) {
    themes.push('POS Stability');
  }
  if (lowerText.includes('promo') || lowerText.includes('shelf') || lowerText.includes('launch')) {
    themes.push('Promo On-Shelf');
  }
  if (lowerText.includes('size') || lowerText.includes('missing') || lowerText.includes('gap')) {
    themes.push('Size Gaps');
  }
  if (lowerText.includes('planogram') || lowerText.includes('reset') || lowerText.includes('compliance')) {
    themes.push('Planogram Compliance');
  }
  if (lowerText.includes('replen') || lowerText.includes('backlog') || lowerText.includes('lag')) {
    themes.push('Replen Backlog');
  }
  
  return themes.length > 0 ? themes : ['General Operations'];
}
