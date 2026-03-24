/**
 * Difficulty Evaluation Script
 *
 * Generates exercises at difficulty 1, 3, and 5, then computes readability
 * metrics and checks that they increase monotonically with difficulty.
 *
 * Usage: cd apps/api && pnpm run eval:difficulty
 */

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = 'eval-test@example.com';
const TEST_PASSWORD = 'EvalTest123!';
const TEST_NAME = 'Eval Tester';

const DIFFICULTIES = [1, 3, 5];

interface Metrics {
  difficulty: number;
  wordCount: number;
  avgSentenceLength: number;
  longWordPct: number;
  avgStemLength: number;
}

async function getToken(): Promise<string> {
  // Try login first
  let res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });

  if (res.ok) {
    const data = (await res.json()) as { accessToken: string };
    return data.accessToken;
  }

  // Auto-register
  console.log('Login failed, registering test user...');
  res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: TEST_NAME,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Register failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function computeMetrics(
  difficulty: number,
  passage: { text: string },
  questions: { stem: string }[],
): Metrics {
  const words = passage.text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Sentence count — split on .!? followed by space or end
  const sentences = passage.text
    .split(/[.!?]+(?:\s|$)/)
    .filter((s) => s.trim().length > 0);
  const avgSentenceLength =
    sentences.length > 0 ? wordCount / sentences.length : wordCount;

  // Long word % — words with 8+ characters
  const longWords = words.filter((w) => w.replace(/[^a-zA-Z]/g, '').length >= 8);
  const longWordPct = wordCount > 0 ? (longWords.length / wordCount) * 100 : 0;

  // Average question stem length (words)
  const stemLengths = questions.map(
    (q) => q.stem.split(/\s+/).filter(Boolean).length,
  );
  const avgStemLength =
    stemLengths.length > 0
      ? stemLengths.reduce((a, b) => a + b, 0) / stemLengths.length
      : 0;

  return {
    difficulty,
    wordCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    longWordPct: Math.round(longWordPct * 10) / 10,
    avgStemLength: Math.round(avgStemLength * 10) / 10,
  };
}

async function generateExercise(
  token: string,
  difficulty: number,
): Promise<{ passage: { text: string }; questions: { stem: string }[] }> {
  const res = await fetch(`${API_BASE}/content/generate-exercise/custom`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      skillIds: ['reading_comprehension.main_idea'],
      difficulty,
      passageType: 'science',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Generate D${difficulty} failed: ${res.status} ${text}`);
  }

  return (await res.json()) as { passage: { text: string }; questions: { stem: string }[] };
}

function printTable(rows: Metrics[]) {
  const header = [
    'Difficulty',
    'Word Count',
    'Avg Sent Len',
    'Long Word %',
    'Avg Stem Len',
  ];
  const widths = header.map((h) => h.length + 2);

  const formatRow = (vals: string[]) =>
    vals.map((v, i) => v.padStart(widths[i])).join(' | ');

  console.log('\n' + formatRow(header));
  console.log('-'.repeat(widths.reduce((a, b) => a + b, 0) + (widths.length - 1) * 3));

  for (const r of rows) {
    console.log(
      formatRow([
        `D${r.difficulty}`,
        String(r.wordCount),
        String(r.avgSentenceLength),
        `${r.longWordPct}%`,
        String(r.avgStemLength),
      ]),
    );
  }
}

function checkMonotonicity(rows: Metrics[]) {
  const checks = [
    { name: 'Word Count', key: 'wordCount' as const },
    { name: 'Avg Sentence Length', key: 'avgSentenceLength' as const },
    { name: 'Long Word %', key: 'longWordPct' as const },
    { name: 'Avg Stem Length', key: 'avgStemLength' as const },
  ];

  console.log('\nMonotonicity Check (should increase D1 < D3 < D5):');
  let allPass = true;
  for (const c of checks) {
    const vals = rows.map((r) => r[c.key]);
    const increasing = vals.every(
      (v, i) => i === 0 || v >= vals[i - 1],
    );
    const status = increasing ? 'PASS' : 'FAIL';
    if (!increasing) allPass = false;
    console.log(`  ${c.name}: ${vals.join(' -> ')} [${status}]`);
  }
  console.log(`\nOverall: ${allPass ? 'ALL PASS' : 'SOME FAILED'}`);
}

async function main() {
  console.log('=== Difficulty Evaluation ===\n');
  console.log(`API: ${API_BASE}`);

  const token = await getToken();
  console.log('Authenticated.\n');

  const results: Metrics[] = [];

  for (const d of DIFFICULTIES) {
    console.log(`Generating difficulty ${d}...`);
    try {
      const data = await generateExercise(token, d);
      const metrics = computeMetrics(d, data.passage, data.questions);
      results.push(metrics);
      console.log(`  Done: ${metrics.wordCount} words, ${data.questions.length} questions`);
    } catch (err) {
      console.error(`  ERROR: ${err}`);
      results.push({
        difficulty: d,
        wordCount: 0,
        avgSentenceLength: 0,
        longWordPct: 0,
        avgStemLength: 0,
      });
    }
  }

  printTable(results);
  checkMonotonicity(results);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
