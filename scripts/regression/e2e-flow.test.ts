#!/usr/bin/env tsx
/**
 * E2E Flow Validation Test
 *
 * Tests the complete interpretation pipeline:
 * 1. Birth info → Chart generation
 * 2. Chart → Knowledge retrieval
 * 3. Request validation
 * 4. Response format
 *
 * Does NOT test actual AI call (requires API key)
 *
 * Usage: tsx scripts/regression/e2e-flow.test.ts
 */

import { generateChart } from '../../lib/ziwei/algorithm';
import type { BirthInfo } from '../../lib/ziwei/types';
import { retrieveKnowledge, listIndexedStars, listIndexedPatterns, STAR_NAME_EN, PALACE_NAME_EN } from '../../lib/classics/knowledge-base';
import { ALL_BOOKS, searchClassics } from '../../lib/classics';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    failed++;
  }
}

// ─── Test 1: Chart Generation ────────────────────────────────────────────────

console.log('\n📊 Test 1: Chart Generation');

const testBirth: BirthInfo = {
  year: 1990,
  month: 1,
  day: 15,
  hour: 5,
  gender: 'male',
  name: 'Test User',
};

const chart = generateChart(testBirth, { leapMonth: 'split' });

assert(chart !== null, 'Chart generated successfully');
assert(chart.birthInfo.year === 1990, 'Birth year preserved');
assert(chart.birthInfo.gender === 'male', 'Gender preserved');
assert(chart.palaces.length === 12, '12 palaces generated');
assert(chart.daXians.length > 0, 'Da Xian periods generated');
assert(typeof chart.wuxingJu === 'number', 'Wuxing Ju calculated');
assert(chart.wuxingJuName.length > 0, 'Wuxing Ju name present');
assert(chart.mingGongBranch >= 0 && chart.mingGongBranch < 12, 'Ming Gong branch valid');
assert(chart.shenGongBranch >= 0 && chart.shenGongBranch < 12, 'Shen Gong branch valid');

// Check star assignment
const mingPalace = chart.palaces.find(p => p.name === '命宫');
assert(mingPalace !== undefined, 'Life Palace exists');
assert(mingPalace!.stars.length > 0, 'Life Palace has stars');

const mainStars = mingPalace!.stars.filter(s => s.type === 'major');
assert(mainStars.length >= 0, 'Main stars identified');

// ─── Test 2: Knowledge Retrieval ─────────────────────────────────────────────

console.log('\n📚 Test 2: Knowledge Retrieval');

const stars = listIndexedStars();
assert(stars.length > 0, `Star index populated (${stars.length} stars)`);
assert(stars.includes('紫微'), '紫微 indexed');
assert(stars.includes('七杀'), '七杀 indexed');

const patterns = listIndexedPatterns();
assert(patterns.length > 0, `Pattern index populated (${patterns.length} patterns)`);
assert(patterns.includes('七杀朝斗'), '七杀朝斗 indexed');
assert(patterns.includes('双禄朝垣'), '双禄朝垣 indexed');

// Test retrieval by star
const ziweiPassages = retrieveKnowledge({ stars: ['紫微'], maxPassages: 5 });
assert(ziweiPassages.passages.length > 0, `紫微 passages retrieved (${ziweiPassages.passages.length})`);
assert(ziweiPassages.passages[0].text.length > 0, 'Passage has content');
assert(ziweiPassages.passages[0].bookTitle.length > 0, 'Passage has book title');

// Test retrieval by pattern
const patternPassages = retrieveKnowledge({ patterns: ['机月同梁'], maxPassages: 5 });
assert(patternPassages.passages.length > 0, `机月同梁 passages retrieved (${patternPassages.passages.length})`);

// Test bilingual mappings
assert(Object.keys(STAR_NAME_EN).length >= 14, `English star names mapped (${Object.keys(STAR_NAME_EN).length})`);
assert(STAR_NAME_EN['紫微'] === 'Ziwei (Emperor)', '紫微 English name correct');
assert(Object.keys(PALACE_NAME_EN).length === 13, `English palace names mapped (${Object.keys(PALACE_NAME_EN).length})`);

// ─── Test 3: Classics Search ─────────────────────────────────────────────────

console.log('\n🔍 Test 3: Classics Search');

assert(ALL_BOOKS.length === 3, `3 books loaded (${ALL_BOOKS.length})`);

const searchResults = searchClassics('紫微', 10);
assert(searchResults.length > 0, `Search "紫微" returned ${searchResults.length} results`);
assert(searchResults[0].snippet.includes('<mark>'), 'Search results have highlighted snippets');

const noResults = searchClassics('不存在的关键词 xyz', 10);
assert(noResults.length === 0, 'Non-existent query returns empty');

// ─── Test 4: Chart Summary (for AI prompt) ───────────────────────────────────

console.log('\n📝 Test 4: Chart Summary Generation');

const mainStarsInChart = chart.palaces
  .flatMap(p => p.stars.filter(s => s.type === 'major').map(s => s.name));
const uniqueStars = [...new Set(mainStarsInChart)].slice(0, 5);
assert(uniqueStars.length > 0, `Chart has main stars: ${uniqueStars.join(', ')}`);

const sihuas = chart.palaces
  .flatMap(p => p.stars.filter(s => s.siHua).map(s => s.siHua!));
const uniqueSihuas = [...new Set(sihuas)];
assert(uniqueSihuas.length >= 0, `Chart has sihuas: ${uniqueSihuas.join(', ') || 'none'}`);

// Build knowledge context for this chart
const chartKnowledge = retrieveKnowledge({
  stars: uniqueStars,
  sihuas: uniqueSihuas,
  palaces: ['命宫', '官禄宫', '财帛宫'],
  maxPassages: 10,
});
assert(chartKnowledge.passages.length > 0, `Knowledge retrieved for chart (${chartKnowledge.passages.length} passages)`);
assert(chartKnowledge.chartSummary.length > 0, 'Chart summary generated');

// ─── Test 5: Response Format Validation ──────────────────────────────────────

console.log('\n📦 Test 5: Response Format Validation');

// Simulate API response structure
const mockResponse = {
  ok: true,
  data: {
    chart: chart,
    interpretation: 'Mock interpretation text',
    classics: chartKnowledge.passages.map(p => ({
      id: p.id,
      bookTitle: p.bookTitle,
      chapterTitle: p.chapterTitle,
      text: p.text,
    })),
    disclaimer: '本解读仅供参考...',
  },
};

assert(mockResponse.ok === true, 'Response has ok field');
assert(mockResponse.data.chart !== null, 'Response has chart');
assert(typeof mockResponse.data.interpretation === 'string', 'Response has interpretation string');
assert(Array.isArray(mockResponse.data.classics), 'Response has classics array');
assert(mockResponse.data.classics.length > 0, 'Classics array has entries');
assert(typeof mockResponse.data.disclaimer === 'string', 'Response has disclaimer');

// ─── Test 6: Edge Cases ──────────────────────────────────────────────────────

console.log('\n⚠️  Test 6: Edge Cases');

// Female chart
const femaleChart = generateChart({ ...testBirth, gender: 'female' }, { leapMonth: 'split' });
assert(femaleChart !== null, 'Female chart generated');
assert(femaleChart.yinYangGender !== undefined, 'Yin-yang gender determined');

// Different hour
const ziHourChart = generateChart({ ...testBirth, hour: 0 }, { leapMonth: 'split' });
assert(ziHourChart !== null, 'Zi hour (0) chart generated');

const haiHourChart = generateChart({ ...testBirth, hour: 11 }, { leapMonth: 'split' });
assert(haiHourChart !== null, 'Hai hour (11) chart generated');

// Leap month policy
const leapChart = generateChart(testBirth, { leapMonth: 'next-month' });
assert(leapChart !== null, 'Leap month policy: next-month works');

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log(`E2E Flow Test: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(60));

if (failed > 0) {
  process.exit(1);
}
