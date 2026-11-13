/**
 * 防再犯：规则解读引擎（零 API Key 链路）
 *
 * 1. 六个主题都能出结构化文本（**【…】** 段落，InsightPanel 可直接渲染）
 * 2. 引擎提到的星曜必须是该宫真实存在的星曜（不许凭空安星，规格 §5.1）
 * 3. 「古籍印证」引文必须逐字存在于公版古籍库（不许伪造引文，规格 §5.1）
 * 4. 引擎文本不得引用 CC BY-NC-SA 的倪海厦《天纪》材料
 * 5. 正文不得断出该盘不存在的四化（教义条文一律写成条件句）
 * 6. 前端提示词不得要求引用《天纪》（CC BY-NC-SA，不可商用）
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateChart } from '../../lib/ziwei/algorithm';
import {
  interpret, interpretRequest, isRuleEngineAvailable, STAR_NATURE, type TopicKey,
} from '../../lib/interpret/engine';
import { ALL_BOOKS } from '../../lib/classics';

const TOPICS: TopicKey[] = ['overview', 'personality', 'love', 'career', 'wealth', 'health'];
const MAJOR_STARS = Object.keys(STAR_NATURE);

// 多组命盘，覆盖不同年干（四化不同）、不同时辰、男女命。hour 为地支索引 0–11。
const CHARTS = [
  generateChart({ year: 1988, month: 10, day: 8, hour: 7, gender: 'male' }),
  generateChart({ year: 1990, month: 3, day: 15, hour: 11, gender: 'female' }),
  generateChart({ year: 1975, month: 12, day: 1, hour: 3, gender: 'male' }),
  generateChart({ year: 2000, month: 6, day: 21, hour: 0, gender: 'female' }),
];

assert.equal(isRuleEngineAvailable(), true, '14 主星断语库必须完整');

// 公版古籍全文语料（用于引文逐字校验）
const CORPUS = new Set<string>();
for (const b of ALL_BOOKS) {
  for (const c of b.chapters) for (const p of c.paragraphs) CORPUS.add(p.text);
}
assert.ok(CORPUS.size > 0, '古籍语料为空');

let checkedQuotes = 0;
let checkedPalaceStars = 0;
let checkedSihua = 0;

/** 正文里「主星＋化X」是断言句式，必须对上本盘真实四化；公版古籍引文属通论，不参与校验 */
const SIHUA_RE = new RegExp(`(${MAJOR_STARS.join('|')})化([禄权科忌])`, 'g');

for (const chart of CHARTS) {
  const ming = chart.palaces.find(p => p.name === '命宫')!;

  const realSihua = new Set<string>();
  for (const p of chart.palaces) {
    for (const s of p.stars) if (s.siHua) realSihua.add(`${s.name}化${s.siHua}`);
    for (const s of p.selfSihua ?? []) realSihua.add(`${s.starName}化${s.siHua}`);
  }

  for (const topic of TOPICS) {
    const text = interpret(chart, topic);

    assert.ok(text.length > 80, `[${topic}] 输出过短`);
    assert.match(text, /\*\*【.+】\*\*/, `[${topic}] 缺少 InsightPanel 可渲染的段落标题`);
    assert.ok(text.includes('命理属传统文化参考'), `[${topic}] 缺少免责收尾`);
    assert.ok(!/undefined|NaN|\[object/.test(text), `[${topic}] 输出含 undefined/NaN：\n${text}`);
    assert.ok(!/天纪|倪海厦|倪师/.test(text), `[${topic}] 输出引用了 CC BY-NC-SA 材料`);

    // 引文逐字校验
    for (const m of text.matchAll(/^> (.+?)——《.+》$/gm)) {
      assert.ok(CORPUS.has(m[1]), `[${topic}] 古籍引文不在语料库中（疑似伪造）：${m[1].slice(0, 40)}`);
      checkedQuotes++;
    }

    // 四化一致性
    for (const line of text.split('\n')) {
      if (line.startsWith('> ')) continue;
      for (const m of line.matchAll(SIHUA_RE)) {
        assert.ok(realSihua.has(m[0]), `[${topic}] 断出本盘不存在的四化「${m[0]}」：${line}`);
        checkedSihua++;
      }
    }
  }

  // 不许凭空安星：命格定性首行出现的任何主星名，必须是命宫真星或借对宫之星
  const overview = interpret(chart, 'overview');
  const realNames = new Set<string>(ming.stars.filter(s => s.type === 'major').map(s => s.name));
  if (ming.borrowedStars?.length) ming.borrowedStars.forEach(n => realNames.add(n));
  if (realNames.size > 0) {
    const head = overview.split('\n').filter(Boolean).slice(0, 2).join(' ');
    const mentioned = MAJOR_STARS.filter(n => head.includes(n));
    assert.ok(mentioned.length > 0, `命宫断语首行未提及任何真实主星：${head}`);
    for (const n of mentioned) {
      assert.ok(realNames.has(n), `命宫断语提及非命宫主星「${n}」（疑似凭空安星）：${head}`);
      checkedPalaceStars++;
    }
  }
}

assert.ok(checkedQuotes > 0, '没有任何一次古籍引证被校验，用例覆盖不足');
assert.ok(checkedPalaceStars > 0, '没有任何一次星曜一致性被校验，用例覆盖不足');
assert.ok(checkedSihua > 0, '没有任何一次四化一致性被校验，用例覆盖不足');

// ── interpretRequest：前端四类入口的路由（主题按钮 / 宫位点击 / 四化点击 / 自由追问）
/** InsightPanel.TOPIC_PROMPTS.overview 原文（前端实际发送内容） */
const TOPIC_PROMPT_OVERVIEW = `请生成命格总览，按以下结构输出：

**【命格定性】**
用一句话概括这个命盘的核心格局与命主气质。

**【主星解读】**
命宫主星的核心特质，并引用公版古籍原文佐证。

**【三方四正】**
财、官、迁三宫的联动分析及整体格局。

**【当前大限】**
当下大限运势方向与最值得关注的事项。

**【优势与注意】**
命盘天赋优势，以及需要注意的风险或功课。`;

const c0 = CHARTS[0];
const tianzhai = c0.palaces.find(p => p.name === '田宅')!;
const tanlang = c0.palaces.find(p => p.stars.some(s => s.name === '贪狼'))!;

const palaceOut = interpretRequest(c0, `请重点分析【${tianzhai.name}】（主管：不动产），该宫主星为星，按以下结构输出：\n\n**【格局】**`);
assert.match(palaceOut, /田宅/, '宫位点击未路由到所点宫位');
assert.ok(!/官禄|夫妻/.test(palaceOut.split('\n')[1] ?? ''), '宫位点击串到了别的宫');

const sihuaOut = interpretRequest(c0, `请分析【大限贪狼化禄】的飞化影响，按以下结构输出：\n\n**【化禄基本含义】**`);
assert.match(sihuaOut, /大限贪狼化禄/, '四化点击未保留所点四化');
assert.ok(sihuaOut.includes(tanlang.name), `四化点击未定位到贪狼真实所在宫位（${tanlang.name}）`);

const topicOut = interpretRequest(c0, `请深度分析财运，按以下结构输出：\n\n**【财运格局】**`);
assert.match(topicOut, /财帛/, '主题按钮未路由到财帛');
assert.ok(!topicOut.includes('【就你的问题】'), '模板提示不应被当作自由追问');

// 防再犯：命格总览模板正文含「财、官、迁」，曾被误判成财运
const overviewOut = interpretRequest(c0, TOPIC_PROMPT_OVERVIEW);
assert.match(overviewOut, /命格定性/, '命格总览被误路由到其他主题');
assert.ok(!/财运格局/.test(overviewOut), '命格总览串成了财运解读');

const freeOut = interpretRequest(c0, '我今年适合换工作吗？');
assert.match(freeOut, /官禄/, '自由追问未按关键词路由到事业');
assert.match(freeOut, /【就你的问题】/, '自由追问缺少针对问题的回应段');

// ── 授权边界：提示词不得要求引用 CC BY-NC-SA 的《天纪》材料（前端模板会原样发给大模型）
for (const rel of ['../../components/InsightPanel.tsx', '../../app/api/interpret/route.ts']) {
  const src = readFileSync(new URL(rel, import.meta.url), 'utf8');
  assert.ok(!/倪|天纪/.test(src), `${rel} 的提示词仍引用倪海厦《天纪》（CC BY-NC-SA 4.0，不可商用）`);
}

console.log(`✓ rule engine: ${CHARTS.length * TOPICS.length} topic outputs well-formed, ${checkedQuotes} quotes verbatim-verified, ${checkedPalaceStars} star mentions grounded, ${checkedSihua} sihua claims grounded, 5 request routes verified, prompt templates license-clean`);
