import 'dotenv/config';

const WATCH = process.argv.includes('--watch');

async function runOnce() {
  try {
    const r = await fetch('http://localhost:3000/api/exec/worker/run', { method:'POST' });
    const result = await r.json();
    console.log(`[${new Date().toISOString()}] Worker result:`, result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Worker error:`, error);
  }
}

if (!WATCH) {
  await runOnce();
  process.exit(0);
}

console.log('🤖 AI worker loop started - processing jobs every 4 seconds');
while (true) {
  await runOnce();
  await new Promise(r => setTimeout(r, 4000));
}
