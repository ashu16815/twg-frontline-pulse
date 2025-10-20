import 'dotenv/config';
import sql from 'mssql';

async function createMockSnapshot() {
  const pool = await new sql.ConnectionPool(process.env.AZURE_SQL_CONNECTION_STRING).connect();
  
  const mockAnalysis = {
    top_opportunities: [
      {
        theme: "Inventory Management",
        impact_dollars: 15000,
        why: "Stockouts causing lost sales across multiple departments"
      },
      {
        theme: "Customer Experience",
        impact_dollars: 8500,
        why: "Long checkout queues during peak hours"
      },
      {
        theme: "Staff Training",
        impact_dollars: 6200,
        why: "Product knowledge gaps affecting sales conversion"
      }
    ],
    top_actions: [
      {
        action: "Implement automated reorder system",
        owner: "Operations Team",
        eta_weeks: 4,
        expected_uplift_dollars: 12000
      },
      {
        action: "Add express checkout lanes",
        owner: "Store Management",
        eta_weeks: 2,
        expected_uplift_dollars: 6000
      },
      {
        action: "Launch product training program",
        owner: "HR Department",
        eta_weeks: 6,
        expected_uplift_dollars: 5000
      }
    ],
    risks: [
      {
        risk: "Seasonal demand spikes",
        mitigation: "Pre-build inventory buffers for key categories"
      },
      {
        risk: "Staff turnover during busy periods",
        mitigation: "Implement retention bonuses and flexible scheduling"
      }
    ],
    volume_series: [
      { week: "FY26-W10", count: 45 },
      { week: "FY26-W11", count: 52 },
      { week: "FY26-W12", count: 48 }
    ]
  };

  const insertQuery = `
    INSERT INTO dbo.exec_report_snapshots(
      scope_type, scope_key, iso_week, month_key, 
      analysis_json, rows_used, gen_model, gen_ms
    ) VALUES (
      @scope_type, @scope_key, @iso_week, @month_key,
      @analysis_json, @rows_used, @gen_model, @gen_ms
    )
  `;

  await pool.request()
    .input('scope_type', 'network')
    .input('scope_key', null)
    .input('iso_week', null)
    .input('month_key', null)
    .input('analysis_json', JSON.stringify(mockAnalysis))
    .input('rows_used', 45)
    .input('gen_model', 'gpt-4o-mini')
    .input('gen_ms', 2500)
    .query(insertQuery);

  console.log('✅ Mock snapshot created successfully');
  process.exit(0);
}

createMockSnapshot().catch(console.error);
