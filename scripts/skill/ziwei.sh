#!/usr/bin/env bash
# 紫微斗数排盘 — 快捷调用脚本
# Usage: ./ziwei.sh <year> <month> <day> <hour> <gender> [format]
# Example: ./ziwei.sh 1990 1 1 0 male text

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

YEAR="${1:?Missing year}"
MONTH="${2:?Missing month}"
DAY="${3:?Missing day}"
HOUR="${4:?Missing hour (0=子时, 1=丑时, ... 11=亥时)}"
GENDER="${5:?Missing gender (male/female)}"
FORMAT="${6:-text}"

exec npx tsx scripts/skill/ziwei-cli.ts \
  --year "$YEAR" \
  --month "$MONTH" \
  --day "$DAY" \
  --hour "$HOUR" \
  --gender "$GENDER" \
  --format "$FORMAT"
