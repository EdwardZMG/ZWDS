# AI 解读 API 配置指南

## 快速启用

### 1. 配置 API Key

在项目根目录创建 `.env.local` 文件：

```bash
# 方案 A：Anthropic Claude（默认，推荐）
ANTHROPIC_API_KEY=sk-ant-xxxxx

# 方案 B：DeepSeek（国内备选，更便宜）
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-xxxxx
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 测试 AI 解读

1. 打开 http://localhost:3000/chart
2. 输入出生信息，点击"起盘"
3. 右侧面板会自动生成命格总览
4. 可点击"感情/事业/财运"等主题按钮获取专项解读
5. 也可在输入框自由追问

## API 接口

### POST /api/interpret

**请求体：**
```json
{
  "chart": { /* ZiweiChart 对象 */ },
  "messages": [
    { "role": "user", "content": "请分析命格总览" }
  ]
}
```

**响应：** Server-Sent Events (SSE) 流
```
data: {"delta":{"text":"**【命格定性】**\n"}}
data: {"delta":{"text":"此命紫微在午..."}}
data: [DONE]
```

## 安全控制

| 控制项 | 配置 |
|--------|------|
| 频率限制 | 10 次/分钟/IP |
| Token 上限 | 2000 tokens/次 |
| 错误处理 | 脱敏，不暴露内部细节 |
| 数据保留 | 无，仅内存处理 |

## 成本估算

| 服务商 | 单价 | 每次解读成本 |
|--------|------|-------------|
| Claude 3.5 Sonnet | $3/M input + $15/M output | ≈ ¥0.15 |
| DeepSeek Chat | ¥1/M input + ¥2/M output | ≈ ¥0.01 |

按每天 100 次解读估算：
- Claude: ¥15/天 ≈ ¥450/月
- DeepSeek: ¥1/天 ≈ ¥30/月

## 古籍知识库

AI 解读自动引用以下公有领域古籍：

| 书名 | 朝代 | 段落数 |
|------|------|--------|
| 骨髓赋 | 明代 | 34 |
| 紫微斗数全集 | 明代 | 30 |
| 紫微斗数全书 | 明代 | 17 |

**明确排除：** `docs/tianji-ziwei/` 内容（CC BY-NC-SA 4.0，不可商用）

## 环境变量一览

| 变量 | 必填 | 说明 |
|------|------|------|
| `ANTHROPIC_API_KEY` | 二选一 | Claude API Key |
| `DEEPSEEK_API_KEY` | 二选一 | DeepSeek API Key |
| `AI_PROVIDER` | 否 | `anthropic`(默认) 或 `deepseek` |

## 故障排查

### "AI 服务未配置"
→ 检查 `.env.local` 是否存在且 API Key 正确

### "Rate limit exceeded"
→ 同一 IP 1 分钟内请求超过 10 次，等待后重试

### 前端显示"开源版不含 AI 解读接口"
→ API 路由未正确加载，检查 `app/api/interpret/route.ts` 是否存在
