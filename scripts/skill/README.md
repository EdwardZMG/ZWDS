# 紫微斗数 Agent Skill

本目录包含紫微斗数排盘引擎的 Agent Skill 封装。

## 快速开始

```bash
# 安装依赖（首次使用）
npm install

# 排盘 — 文本格式
./scripts/skill/ziwei.sh 1990 1 1 0 male text

# 排盘 — JSON 格式
./scripts/skill/ziwei.sh 1990 1 1 0 male json

# 或直接调用 CLI
npx tsx scripts/skill/ziwei-cli.ts --year 1990 --month 1 --day 1 --hour 0 --gender male --format text
```

## 参数说明

```
<year>   公历年份，如 1990
<month>  月份 1-12
<day>    日期 1-31（必须为真实存在的日期）
<hour>   时辰索引 0-11（0=子时, 1=丑时, ... 11=亥时）
<gender> 性别 male/female
[format] 输出格式 text/json（默认 text）
```

## 时辰对照

| 索引 | 地支 | 时间 |
|------|------|------|
| 0 | 子 | 23-1点 |
| 1 | 丑 | 1-3点 |
| 2 | 寅 | 3-5点 |
| 3 | 卯 | 5-7点 |
| 4 | 辰 | 7-9点 |
| 5 | 巳 | 9-11点 |
| 6 | 午 | 11-13点 |
| 7 | 未 | 13-15点 |
| 8 | 申 | 15-17点 |
| 9 | 酉 | 17-19点 |
| 10 | 戌 | 19-21点 |
| 11 | 亥 | 21-23点 |

## 文件结构

```
scripts/skill/
├── ziwei-cli.ts      # 核心 CLI 脚本
├── ziwei.sh          # Bash 快捷调用
└── README.md         # 本文件

.qoder/skills/ziwei-doushu/
└── SKILL.md          # Agent Skill 定义

lib/ziwei/            # 排盘引擎核心
lib/classics/         # 古籍知识库
```

## 程序化调用

```typescript
import { generateChart } from './lib/ziwei/algorithm';

const chart = generateChart({
  year: 1990,
  month: 1,
  day: 1,
  hour: 0,
  gender: 'male',
});

console.log(chart.core.wuxingJuName);  // "水二局"
console.log(chart.palaces[0].name);    // "命宫"
```

## 测试

```bash
npm test              # 跑全部回归测试
npm run typecheck     # TypeScript 类型检查
```

## 许可

- 代码：MIT
- 数据集：CC BY 4.0
- 古籍：公版
- 倪海厦原话：CC BY-NC-SA 4.0
