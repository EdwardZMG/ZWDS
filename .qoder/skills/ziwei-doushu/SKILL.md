---
name: ziwei-doushu
description: 紫微斗数排盘引擎 — 基于倪海厦《天纪》体系，输入出生年月日时生成完整命盘，含十二宫、十四主星、四化飞星、大限流年、格局判定、古籍引证。支持真太阳时校正、夏令时处理、闰月策略切换。
version: 1.0.0
author: Renhuai123 (GitHub)
license: MIT
tags:
  - 紫微斗数
  - 命理
  - 排盘
  - 传统文化
  - 倪海厦
  - 天纪
---

# 紫微斗数排盘引擎 · Agent Skill

## 概述

本 Skill 封装了 [ziwei-doushu](https://github.com/Renhuai123/ ziwei-doushu) 开源排盘引擎，基于倪海厦《天纪》教学体系，提供完整的紫微斗数排盘能力。

**核心能力：**
- 输入出生年月日时（公历），输出完整紫微命盘
- 十二宫、十四主星、辅星、煞星全量展示
- 天干四化（禄权科忌）、宫干自化
- 大限、流年运限推演
- 真太阳时校正（按出生地经度）
- 中国夏令时（1986-1991）自动判定
- 闰月四种处理策略（split/next-month/prev-month/origin-month）
- 星曜亮度流派切换（《斗数全书》/现代修正等）
- 格局自动识别（1100+ 行规则库）
- 古籍引证（《紫微斗数全书》《紫微斗数全集》《骨髓赋》）

**数据来源：**
- 排盘算法基于 [iztro](https://github.com/SylarLong/iztro) 开源库
- 历法计算基于 [lunar-javascript](https://github.com/6tail/lunar-javascript)
- 星曜亮度、四化、格局规则按倪海厦《天纪》校正
- 古籍原文数据来自公版《紫微斗数全书》《紫微斗数全集》

## 使用方法

### CLI 调用

```bash
# 基本用法：输入出生信息，输出 JSON 格式命盘
npx tsx scripts/skill/ziwei-cli.ts \
  --year 1990 \
  --month 1 \
  --day 1 \
  --hour 0 \
  --gender male \
  --format json

# 输出可读文本格式
npx tsx scripts/skill/ziwei-cli.ts \
  --year 1990 \
  --month 1 \
  --day 1 \
  --hour 0 \
  --gender male \
  --format text

# 包含古籍引证
npx tsx scripts/skill/ziwei-cli.ts \
  --year 1990 \
  --month 1 \
  --day 1 \
  --hour 0 \
  --gender male \
  --format text \
  --include-classics

# 指定闰月策略（默认 split）
npx tsx scripts/skill/ziwei-cli.ts \
  --year 1990 \
  --month 4 \
  --day 15 \
  --hour 3 \
  --gender female \
  --leap-month next-month
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `--year` | number | ✓ | 出生年份（公历） |
| `--month` | number | ✓ | 出生月份（1-12） |
| `--day` | number | ✓ | 出生日期（1-31，必须为真实存在的日期） |
| `--hour` | number | ✓ | 时辰索引（0=子时 23-1点, 1=丑时 1-3点, ... 11=亥时 21-23点） |
| `--gender` | string | ✓ | 性别（`male` 或 `female`） |
| `--name` | string | | 姓名（可选，仅用于显示） |
| `--format` | string | | 输出格式（`json` 或 `text`，默认 `json`） |
| `--leap-month` | string | | 闰月策略（`split`/`next-month`/`prev-month`/`origin-month`，默认 `split`） |
| `--include-patterns` | flag | | 包含格局判定结果（需要 Next.js 服务端环境） |
| `--include-classics` | flag | | 包含古籍引证信息 |

### 时辰对照表

| 时辰 | 地支 | 时间范围 | hour 索引 |
|------|------|----------|-----------|
| 子时 | 子 | 23:00-01:00 | 0 |
| 丑时 | 丑 | 01:00-03:00 | 1 |
| 寅时 | 寅 | 03:00-05:00 | 2 |
| 卯时 | 卯 | 05:00-07:00 | 3 |
| 辰时 | 辰 | 07:00-09:00 | 4 |
| 巳时 | 巳 | 09:00-11:00 | 5 |
| 午时 | 午 | 11:00-13:00 | 6 |
| 未时 | 未 | 13:00-15:00 | 7 |
| 申时 | 申 | 15:00-17:00 | 8 |
| 酉时 | 酉 | 17:00-19:00 | 9 |
| 戌时 | 戌 | 19:00-21:00 | 10 |
| 亥时 | 亥 | 21:00-23:00 | 11 |

**注意：** 23:00-23:59 属于晚子时，按次日排盘（子时换日规则）。

## 输出字段说明

### JSON 格式

```json
{
  "birthInfo": {
    "year": 1990,
    "month": 1,
    "day": 1,
    "hour": 0,
    "gender": "male"
  },
  "lunarInfo": {
    "lunarYear": 1989,
    "lunarMonth": 12,
    "lunarDay": 5,
    "yearStem": 5,
    "yearBranch": 5,
    "isLeapMonth": false,
    "fourPillars": ["己巳", "丙子", "丙寅", "戊子"]
  },
  "core": {
    "wuxingJu": 2,
    "wuxingJuName": "水二局",
    "mingZhu": "巨门",
    "shenZhu": "天机",
    "yinYangGender": "阴男",
    "mingGongBranch": "丑",
    "shenGongBranch": "丑"
  },
  "palaces": [
    {
      "name": "命宫",
      "branch": "丑",
      "stem": "己",
      "stars": [...],
      "isEmpty": false,
      "selfSihua": [...],
      "daXianAge": [2, 11],
      "isCurrentDaXian": false
    }
  ],
  "daXians": [...],
  "currentAge": 36,
  "currentDaXianIndex": 3
}
```

### 关键字段

- **wuxingJu**：五行局（水二局=2、木三局=3、金四局=4、土五局=5、火六局=6）
- **mingZhu**：命主星（按命宫地支查表）
- **shenZhu**：身主星（按生年地支查表）
- **yinYangGender**：阴阳性别（阳男/阴男/阳女/阴女，决定大限顺逆）
- **palaces**：十二宫数组，每宫包含星曜、四化、大限等信息
- **stars[].sihua**：四化标记（禄/权/科/忌）
- **stars[].brightness**：星曜亮度（庙/旺/得/利/平/不/陷）
- **palaces[].selfSihua**：宫干自化（倪师体系核心）
- **palaces[].isEmpty**：是否空宫（无主星）
- **palaces[].borrowedFrom**：空宫借对宫哪个宫

## 程序化调用

也可以在 TypeScript/JavaScript 代码中直接调用：

```typescript
import { generateChart } from './lib/ziwei/algorithm';
import type { BirthInfo } from './lib/ziwei/types';

const birthInfo: BirthInfo = {
  year: 1990,
  month: 1,
  day: 1,
  hour: 0,  // 子时
  gender: 'male',
};

const chart = generateChart(birthInfo, { leapMonth: 'split' });

console.log(chart.core.wuxingJuName);  // "水二局"
console.log(chart.palaces.length);     // 12
```

## 注意事项

1. **日期必须真实存在**：2月30日、非闰年2月29日等不存在的日期会报错
2. **时辰是地支索引**：0-11 对应子-亥，不是 0-23 的小时数
3. **晚子时换日**：23:00-23:59 输入会被修正为次日子时
4. **闰月策略**：默认 `split`（月中分界），可按需切换
5. **格局检测**：需要 Next.js 服务端环境，CLI 下暂不支持
6. **真太阳时**：CLI 未集成，需手动计算后传入修正后的时间

## 免责声明

紫微斗数属于中国传统文化娱乐参考，不能代替医疗、投资、法律等专业判断。本工具仅供学习、研究、娱乐使用，请理性看待，切勿迷信。

## 数据来源与许可

- **代码**：MIT License
- **数据集**：CC BY 4.0（需注明出处）
- **古籍原文**：公版
- **倪海厦《天纪》原话**：CC BY-NC-SA 4.0（非商用）

项目地址：https://github.com/Renhuai123/ ziwei-doushu

## 示例输出

```
═══════════════════════════════════════════════════════════
                    紫微斗数命盘
═══════════════════════════════════════════════════════════

【出生信息】
  公历：1990年1月1日 子时
  农历：1989年12月5日
  性别：男

【命盘核心】
  五行局：水二局
  命主星：巨门
  身主星：天机
  阴阳性别：阴男
  命宫地支：丑
  身宫地支：丑

【四柱八字】
  年柱：己巳
  月柱：丙子
  日柱：丙寅
  时柱：戊子

【十二宫】
  命宫（丑）：天府〔庙〕、恩光〔庙〕、华盖〔陷〕、天哭〔庙〕
  兄弟（子）：太阳〔陷〕、天魁〔旺〕、天姚〔陷〕、龙德
  夫妻（亥）：武曲〔平〕、破军〔平〕、右弼〔平〕、天马〔平〕、地空〔陷〕、地劫〔陷〕
  ...

【大限】
  2-11岁 命宫
  12-21岁 兄弟
  22-31岁 夫妻
  32-41岁 子女 ← 当前
  ...

═══════════════════════════════════════════════════════════
注：紫微斗数属于传统文化娱乐参考，不能代替专业判断，理性看待。
═══════════════════════════════════════════════════════════
```
