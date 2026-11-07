#!/usr/bin/env tsx
/**
 * 紫微斗数排盘引擎 — Agent Skill CLI
 *
 * Usage:
 *   tsx scripts/skill/ziwei-cli.ts --year 1990 --month 1 --day 1 --hour 0 --gender male
 *   tsx scripts/skill/ziwei-cli.ts --year 1990 --month 1 --day 1 --hour 0 --gender male --format json
 *   tsx scripts/skill/ziwei-cli.ts --year 1990 --month 1 --day 1 --hour 0 --gender male --format text
 *
 * Options:
 *   --year <number>      出生年份（公历）
 *   --month <number>     出生月份（1-12）
 *   --day <number>       出生日期（1-31）
 *   --hour <number>      时辰索引（0=子时, 1=丑时, ... 11=亥时）
 *   --gender <string>    性别（male/female）
 *   --name <string>      姓名（可选）
 *   --format <string>    输出格式（json/text，默认 json）
 *   --leap-month <str>   闰月策略（split/next-month/prev-month/origin-month，默认 split）
 *   --include-patterns   包含格局判定结果
 *   --include-classics   包含古籍引证
 */

import { generateChart, setBrightnessSchool, type LunarMonthPolicy } from '../../lib/ziwei/algorithm';
import type { BirthInfo, ZiweiChart } from '../../lib/ziwei/types';
import { BRANCHES, STEMS } from '../../lib/ziwei/constants';
import { ALL_BOOKS } from '../../lib/classics';

// 格局检测和古籍搜索需要 Next.js server context，CLI 下跳过
// import { detectPatterns } from '../../lib/ziwei/patterns';

interface CliArgs {
  year: number;
  month: number;
  day: number;
  hour: number;
  gender: 'male' | 'female';
  name?: string;
  format: 'json' | 'text';
  leapMonth: LunarMonthPolicy;
  includePatterns: boolean;
  includeClassics: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };
  const has = (flag: string): boolean => args.includes(flag);

  const year = parseInt(get('--year') || '');
  const month = parseInt(get('--month') || '');
  const day = parseInt(get('--day') || '');
  const hour = parseInt(get('--hour') || '');
  const gender = get('--gender') as 'male' | 'female';
  const name = get('--name');
  const format = (get('--format') || 'json') as 'json' | 'text';
  const leapMonth = (get('--leap-month') || 'split') as LunarMonthPolicy;

  if (!year || !month || !day || isNaN(hour) || !gender) {
    console.error('Error: Missing required arguments.');
    console.error('Usage: tsx scripts/skill/ziwei-cli.ts --year <year> --month <month> --day <day> --hour <hour> --gender <male|female>');
    process.exit(1);
  }

  if (hour < 0 || hour > 11) {
    console.error('Error: --hour must be between 0 (子时) and 11 (亥时)');
    process.exit(1);
  }

  if (!['male', 'female'].includes(gender)) {
    console.error('Error: --gender must be "male" or "female"');
    process.exit(1);
  }

  return {
    year,
    month,
    day,
    hour,
    gender,
    name,
    format,
    leapMonth,
    includePatterns: has('--include-patterns'),
    includeClassics: has('--include-classics'),
  };
}

function formatChartAsText(chart: ZiweiChart, args: CliArgs): string {
  const lines: string[] = [];
  const { birthInfo, lunarInfo, palaces, daXians, wuxingJuName, mingZhu, shenZhu, yinYangGender } = chart;

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('                    紫微斗数命盘');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');

  // 基本信息
  lines.push('【出生信息】');
  lines.push(`  公历：${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日 ${BRANCHES[birthInfo.hour]}时`);
  lines.push(`  农历：${lunarInfo.lunarYear}年${lunarInfo.isLeapMonth ? '闰' : ''}${Math.abs(lunarInfo.lunarMonth)}月${lunarInfo.lunarDay}日`);
  lines.push(`  性别：${birthInfo.gender === 'male' ? '男' : '女'}`);
  if (birthInfo.name) lines.push(`  姓名：${birthInfo.name}`);
  lines.push('');

  // 命盘核心
  lines.push('【命盘核心】');
  lines.push(`  五行局：${wuxingJuName}`);
  lines.push(`  命主星：${mingZhu || '无'}`);
  lines.push(`  身主星：${shenZhu || '无'}`);
  lines.push(`  阴阳性别：${yinYangGender || '未知'}`);
  lines.push(`  命宫地支：${BRANCHES[chart.mingGongBranch]}`);
  lines.push(`  身宫地支：${BRANCHES[chart.shenGongBranch]}`);
  lines.push('');

  // 四柱
  if (lunarInfo.fourPillars) {
    lines.push('【四柱八字】');
    lines.push(`  年柱：${lunarInfo.fourPillars[0]}`);
    lines.push(`  月柱：${lunarInfo.fourPillars[1]}`);
    lines.push(`  日柱：${lunarInfo.fourPillars[2]}`);
    lines.push(`  时柱：${lunarInfo.fourPillars[3]}`);
    lines.push('');
  }

  // 十二宫
  lines.push('【十二宫】');
  lines.push('');
  for (const palace of palaces) {
    lines.push(`  ${palace.name}（${BRANCHES[palace.branch]}）`);
    const starNames = palace.stars.map(s => {
      let str = s.name;
      if (s.siHua) str += `化${s.siHua}`;
      if (s.brightnessRaw) str += `〔${s.brightnessRaw}〕`;
      return str;
    });
    if (starNames.length > 0) {
      lines.push(`    主星/辅星：${starNames.join('、')}`);
    }
    if (palace.isEmpty && palace.borrowedFromName) {
      lines.push(`    空宫，借对宫${palace.borrowedFromName}：${palace.borrowedStars?.join('、') || ''}`);
    }
    if (palace.selfSihua && palace.selfSihua.length > 0) {
      const sh = palace.selfSihua.map(s => `${s.starName}化${s.siHua}`).join('、');
      lines.push(`    宫干自化：${sh}`);
    }
    if (palace.daXianAge) {
      lines.push(`    大限：${palace.daXianAge[0]}-${palace.daXianAge[1]}岁${palace.isCurrentDaXian ? ' ← 当前' : ''}`);
    }
    lines.push('');
  }

  // 大限
  lines.push('【大限】');
  for (const dx of daXians) {
    const current = dx.startAge <= chart.currentAge && chart.currentAge <= dx.endAge ? ' ← 当前' : '';
    lines.push(`  ${dx.startAge}-${dx.endAge}岁 ${dx.palaceName}${dx.stemName ? `（${dx.stemName}）` : ''}${current}`);
    if (dx.siHua) {
      lines.push(`    四化：${dx.siHua.lu}化禄、${dx.siHua.quan}化权、${dx.siHua.ke}化科、${dx.siHua.ji}化忌`);
    }
  }
  lines.push('');

  // 格局（需要 Next.js server context，CLI 下暂不支持）
  if (args.includePatterns) {
    lines.push('【格局】');
    lines.push('  （格局检测需要 Next.js 服务端环境，请使用在线版本或 Web API）');
    lines.push('');
  }

  // 古籍引证
  if (args.includeClassics) {
    lines.push('【古籍引证】');
    for (const book of ALL_BOOKS) {
      lines.push(`  ${book.title}：${book.chapters.length}章 ${book.chapters.reduce((s, c) => s + c.paragraphs.length, 0)}段`);
    }
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('注：紫微斗数属于传统文化娱乐参考，不能代替专业判断，理性看待。');
  lines.push('═══════════════════════════════════════════════════════════');

  return lines.join('\n');
}

function formatChartAsJson(chart: ZiweiChart, args: CliArgs): object {
  const result: any = {
    birthInfo: chart.birthInfo,
    lunarInfo: chart.lunarInfo,
    core: {
      wuxingJu: chart.wuxingJu,
      wuxingJuName: chart.wuxingJuName,
      mingZhu: chart.mingZhu,
      shenZhu: chart.shenZhu,
      yinYangGender: chart.yinYangGender,
      mingGongBranch: BRANCHES[chart.mingGongBranch],
      shenGongBranch: BRANCHES[chart.shenGongBranch],
    },
    palaces: chart.palaces.map(p => ({
      name: p.name,
      branch: BRANCHES[p.branch],
      stem: STEMS[p.stem],
      stars: p.stars.map(s => ({
        name: s.name,
        type: s.type,
        sihua: s.siHua,
        brightness: s.brightnessRaw,
      })),
      isEmpty: p.isEmpty,
      borrowedFrom: p.borrowedFromName,
      borrowedStars: p.borrowedStars,
      selfSihua: p.selfSihua,
      daXianAge: p.daXianAge,
      isCurrentDaXian: p.isCurrentDaXian,
    })),
    daXians: chart.daXians.map(dx => ({
      ageRange: `${dx.startAge}-${dx.endAge}`,
      palaceName: dx.palaceName,
      stem: dx.stemName,
      sihua: dx.siHua,
    })),
    currentAge: chart.currentAge,
    currentDaXianIndex: chart.currentDaXianIndex,
  };

  if (args.includePatterns) {
    result.patterns = { note: '格局检测需要 Next.js 服务端环境' };
  }

  if (args.includeClassics) {
    result.classics = {
      books: ALL_BOOKS.map(b => ({
        slug: b.slug,
        title: b.title,
        chapters: b.chapters.length,
        paragraphs: b.chapters.reduce((s, c) => s + c.paragraphs.length, 0),
      })),
    };
  }

  return result;
}

function main() {
  const args = parseArgs();

  const birthInfo: BirthInfo = {
    year: args.year,
    month: args.month,
    day: args.day,
    hour: args.hour,
    gender: args.gender,
    name: args.name,
  };

  try {
    const chart = generateChart(birthInfo, { leapMonth: args.leapMonth });

    if (args.format === 'text') {
      console.log(formatChartAsText(chart, args));
    } else {
      console.log(JSON.stringify(formatChartAsJson(chart, args), null, 2));
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
