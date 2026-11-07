/**
 * 古籍知识库 — AI 解读检索层
 *
 * 基于公有领域古籍（骨髓赋、紫微斗数全集、紫微斗数全书）构建
 * 提供主题索引 + 上下文检索，供 AI 解读 API 调用
 *
 * 明确排除：docs/tianji-ziwei/ 内容（CC BY-NC-SA 4.0，不可商用）
 */

import { ALL_BOOKS, searchClassics } from './index';
import type { Paragraph, SearchHit } from './types';

// ─── 主题索引 ───────────────────────────────────────────────────────────────

/** 14 主星 + 6 吉 6 煞 → 古籍段落 id */
const STAR_INDEX: Record<string, string[]> = {
  // 14 主星
  '紫微': ['gsf-2-1', 'gsf-2-2', 'gsf-2-3', 'gsf-2-4', 'qj-2-1', 'qj-2-2', 'qj-2-3', 'qj-2-4'],
  '天机': ['qj-4-2'],
  '太阳': ['qj-4-3'],
  '武曲': ['qj-4-4'],
  '天同': [], // 古籍中单独论述较少，通过格局索引覆盖
  '廉贞': ['qj-4-5'],
  '天府': ['qj-3-1'],
  '太阴': ['qj-3-2'],
  '贪狼': ['qj-3-3'],
  '巨门': ['qj-3-4'],
  '天相': ['qj-3-5'],
  '天梁': ['qj-3-6'],
  '七杀': ['gsf-3-1', 'gsf-3-2', 'gsf-3-3'],
  '破军': ['qj-4-6'],

  // 6 吉星
  '左辅': ['gsf-7-1', 'gsf-7-2', 'gsf-7-3'],
  '右弼': ['gsf-7-1', 'gsf-7-2', 'gsf-7-3'],
  '文昌': ['gsf-7-1'],
  '文曲': ['gsf-7-1'],
  '天魁': ['gsf-7-1'],
  '天钺': ['gsf-7-1'],

  // 6 煞星
  '擎羊': ['gsf-8-1', 'gsf-8-2', 'gsf-8-3'],
  '陀罗': ['gsf-8-1', 'gsf-8-2', 'gsf-8-3'],
  '火星': ['gsf-8-1'],
  '铃星': ['gsf-8-1'],
  '地空': ['gsf-8-1', 'gsf-8-4'],
  '地劫': ['gsf-8-1', 'gsf-8-4'],
};

/** 格局 → 古籍段落 id */
const PATTERN_INDEX: Record<string, string[]> = {
  '紫府同宫': ['gsf-2-2', 'qj-5-5'],
  '君臣庆会': ['gsf-7-3', 'qj-2-2'],
  '七杀朝斗': ['gsf-3-2', 'qj-5-6'],
  '杀破狼': ['gsf-4-1', 'gsf-4-2', 'qj-5-9'],
  '机月同梁': ['gsf-5-1', 'gsf-5-2', 'qj-5-8', 'qs-6-1', 'qs-6-2'],
  '双禄朝垣': ['gsf-6-4', 'qj-3-1', 'qj-5-7', 'qs-7-1', 'qs-7-2'],
  '科权双会': ['gsf-6-4'],
  '火贪格': ['qj-3-3'],
  '铃贪格': ['qj-3-3'],
  '日月同宫': ['qj-5-10'],
  '日月反背': ['qj-3-4'],
  '武曲七杀': ['qj-4-4'],
  '廉相格': ['qj-4-5'],
  '空劫夹命': ['gsf-8-4'],
  '羊陀夹忌': ['gsf-8-3'],
  '辅弼夹命': ['gsf-7-3'],
};

/** 十二宫 → 古籍段落 id */
const PALACE_INDEX: Record<string, string[]> = {
  '命宫': ['gsf-9-1', 'qs-1-1', 'qs-1-2', 'qs-1-3'],
  '财帛宫': ['gsf-9-1', 'qs-2-1', 'qs-2-2'],
  '官禄宫': ['gsf-9-1', 'qs-3-1', 'qs-3-2'],
  '夫妻宫': ['gsf-9-2', 'qs-4-1', 'qs-4-2'],
  '子女宫': ['gsf-9-2'],
  '疾厄宫': ['gsf-9-2'],
  '迁移宫': ['gsf-9-2', 'gsf-9-4'],
  '田宅宫': ['gsf-9-3'],
  '福德宫': ['gsf-9-3'],
  '父母宫': ['gsf-9-3'],
  '兄弟宫': [],
  '身宫': ['gsf-1-3', 'qj-1-3'],
};

/** 四化 → 古籍段落 id */
const SIHUA_INDEX: Record<string, string[]> = {
  '化禄': ['gsf-6-1', 'gsf-6-2', 'gsf-6-4', 'qj-5-1', 'qj-5-5', 'qs-5-1', 'qs-5-3'],
  '化权': ['gsf-6-1', 'gsf-6-2', 'qj-5-2', 'qs-5-1', 'qs-5-2'],
  '化科': ['gsf-6-1', 'gsf-6-2', 'qj-5-3', 'qs-5-1'],
  '化忌': ['gsf-6-1', 'gsf-6-2', 'gsf-6-3', 'qj-5-4', 'qs-5-1', 'qs-5-4'],
};

// ─── 段落查找表 ──────────────────────────────────────────────────────────────

/** 所有段落的扁平 id → 段落 映射（启动时构建一次） */
let paragraphCache: Map<string, { bookSlug: string; bookTitle: string; chapterTitle: string; paragraph: Paragraph }> | null = null;

function buildCache() {
  if (paragraphCache) return;
  paragraphCache = new Map();
  for (const book of ALL_BOOKS) {
    for (const chapter of book.chapters) {
      for (const p of chapter.paragraphs) {
        paragraphCache.set(p.id, {
          bookSlug: book.slug,
          bookTitle: book.title,
          chapterTitle: chapter.title,
          paragraph: p,
        });
      }
    }
  }
}

// ─── 检索 API ────────────────────────────────────────────────────────────────

export interface KnowledgeContext {
  /** 相关古籍段落（含出处） */
  passages: Array<{
    id: string;
    bookTitle: string;
    chapterTitle: string;
    text: string;
  }>;
  /** 命盘摘要（用于 AI prompt） */
  chartSummary: string;
}

export interface QueryOptions {
  /** 主星名列表（如 ['紫微', '天府']） */
  stars?: string[];
  /** 格局名列表（如 ['七杀朝斗', '双禄朝垣']） */
  patterns?: string[];
  /** 宫位名列表（如 ['命宫', '官禄宫']） */
  palaces?: string[];
  /** 四化名列表（如 ['化禄', '化忌']） */
  sihuas?: string[];
  /** 自由文本搜索（关键词） */
  keywords?: string[];
  /** 最大返回段落数（默认 15） */
  maxPassages?: number;
}

/**
 * 根据命盘要素检索相关古籍段落
 *
 * 用于构建 AI 解读的上下文 prompt
 */
export function retrieveKnowledge(opts: QueryOptions): KnowledgeContext {
  buildCache();
  const maxPassages = opts.maxPassages ?? 15;
  const seen = new Set<string>();
  const passages: KnowledgeContext['passages'] = [];

  const addById = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const entry = paragraphCache!.get(id);
    if (!entry) return;
    passages.push({
      id: entry.paragraph.id,
      bookTitle: entry.bookTitle,
      chapterTitle: entry.chapterTitle,
      text: entry.paragraph.text,
    });
  };

  // 按优先级收集：星曜 → 格局 → 宫位 → 四化 → 关键词搜索
  for (const star of opts.stars ?? []) {
    const ids = STAR_INDEX[star];
    if (ids) ids.forEach(addById);
    if (passages.length >= maxPassages) break;
  }

  for (const pattern of opts.patterns ?? []) {
    const ids = PATTERN_INDEX[pattern];
    if (ids) ids.forEach(addById);
    if (passages.length >= maxPassages) break;
  }

  for (const palace of opts.palaces ?? []) {
    const ids = PALACE_INDEX[palace];
    if (ids) ids.forEach(addById);
    if (passages.length >= maxPassages) break;
  }

  for (const sihua of opts.sihuas ?? []) {
    const ids = SIHUA_INDEX[sihua];
    if (ids) ids.forEach(addById);
    if (passages.length >= maxPassages) break;
  }

  // 关键词搜索兜底
  if (passages.length < maxPassages && opts.keywords) {
    for (const kw of opts.keywords) {
      const hits = searchClassicsLimited(kw, maxPassages - passages.length);
      for (const hit of hits) {
        addById(hit.paragraphId);
        if (passages.length >= maxPassages) break;
      }
      if (passages.length >= maxPassages) break;
    }
  }

  return {
    passages: passages.slice(0, maxPassages),
    chartSummary: buildChartSummary(opts),
  };
}

/**
 * 按单个星曜名检索（简化版）
 */
export function getPassagesByStar(starName: string): KnowledgeContext['passages'] {
  buildCache();
  const ids = STAR_INDEX[starName] ?? [];
  return ids
    .map(id => paragraphCache!.get(id))
    .filter((e): e is NonNullable<typeof e> => !!e)
    .map(e => ({
      id: e.paragraph.id,
      bookTitle: e.bookTitle,
      chapterTitle: e.chapterTitle,
      text: e.paragraph.text,
    }));
}

/**
 * 按格局名检索（简化版）
 */
export function getPassagesByPattern(patternName: string): KnowledgeContext['passages'] {
  buildCache();
  const ids = PATTERN_INDEX[patternName] ?? [];
  return ids
    .map(id => paragraphCache!.get(id))
    .filter((e): e is NonNullable<typeof e> => !!e)
    .map(e => ({
      id: e.paragraph.id,
      bookTitle: e.bookTitle,
      chapterTitle: e.chapterTitle,
      text: e.paragraph.text,
    }));
}

/**
 * 列出所有已索引的星曜名
 */
export function listIndexedStars(): string[] {
  return Object.keys(STAR_INDEX).filter(k => STAR_INDEX[k].length > 0);
}

/**
 * 列出所有已索引的格局名
 */
export function listIndexedPatterns(): string[] {
  return Object.keys(PATTERN_INDEX);
}

// ─── 内部辅助 ────────────────────────────────────────────────────────────────

function searchClassicsLimited(query: string, limit: number): SearchHit[] {
  return searchClassics(query, limit);
}

function buildChartSummary(opts: QueryOptions): string {
  const parts: string[] = [];
  if (opts.stars?.length) parts.push(`主星：${opts.stars.join('、')}`);
  if (opts.patterns?.length) parts.push(`格局：${opts.patterns.join('、')}`);
  if (opts.palaces?.length) parts.push(`重点宫位：${opts.palaces.join('、')}`);
  if (opts.sihuas?.length) parts.push(`四化：${opts.sihuas.join('、')}`);
  return parts.join('；');
}

// ─── 双语支持 ────────────────────────────────────────────────────────────────

/** 星曜中英文名称映射 */
export const STAR_NAME_EN: Record<string, string> = {
  '紫微': 'Ziwei (Emperor)',
  '天机': 'Tianji (Wisdom)',
  '太阳': 'Taiyang (Sun)',
  '武曲': 'Wuqu (Warrior)',
  '天同': 'Tiantong (Child)',
  '廉贞': 'Lianzhen (Chaste)',
  '破军': 'Poju (Army Breaker)',
  '天府': 'Tianfu (Treasury)',
  '太阴': 'Taiyin (Moon)',
  '贪狼': 'Tanlang (Greedy Wolf)',
  '巨门': 'Jumen (Giant Gate)',
  '天相': 'Tianxiang (Seal)',
  '天梁': 'Tianliang (Beam)',
  '七杀': 'Qisha (Seven Killings)',
  '左辅': 'Zuofu (Left Assistant)',
  '右弼': 'Youbi (Right Assistant)',
  '文昌': 'Wenchang (Literary)',
  '文曲': 'Wenqu (Literary Music)',
  '天魁': 'Tiankui (Noble)',
  '天钺': 'Tianyue (Noble)',
  '擎羊': 'Qingyang (Sheep Blade)',
  '陀罗': 'Tuoluo (Whip)',
  '火星': 'Huoxing (Fire)',
  '铃星': 'Lingxing (Bell)',
  '地空': 'Dikong (Emptiness)',
  '地劫': 'Dijie (Calamity)',
  '禄存': 'Lacun (Salary Storage)',
  '天马': 'Tianma (Sky Horse)',
};

/** 宫位中英文名称映射 */
export const PALACE_NAME_EN: Record<string, string> = {
  '命宫': 'Life Palace',
  '兄弟宫': 'Siblings Palace',
  '夫妻宫': 'Spouse Palace',
  '子女宫': 'Children Palace',
  '财帛宫': 'Wealth Palace',
  '疾厄宫': 'Health Palace',
  '迁移宫': 'Travel Palace',
  '交友宫': 'Friends Palace',
  '官禄宫': 'Career Palace',
  '田宅宫': 'Property Palace',
  '福德宫': 'Fortune Palace',
  '父母宫': 'Parents Palace',
  '身宫': 'Body Palace',
};

/** 四化中英文名称映射 */
export const SIHUA_NAME_EN: Record<string, string> = {
  '化禄': 'Hua Lu (Prosperity)',
  '化权': 'Hua Quan (Power)',
  '化科': 'Hua Ke (Fame)',
  '化忌': 'Hua Ji (Obstacle)',
};
