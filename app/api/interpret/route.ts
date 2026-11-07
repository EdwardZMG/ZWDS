/**
 * POST /api/interpret — AI 紫微斗数解读（流式 SSE）
 *
 * 请求体:
 * {
 *   chart: ZiweiChart,
 *   messages: Array<{ role: 'user' | 'assistant'; content: string }>
 * }
 *
 * 响应: text/event-stream
 *   data: {"delta":{"text":"..."}}
 *   data: [DONE]
 *
 * 安全控制:
 * - Rate limiting: 10 req/min/IP（内存计数）
 * - Token limit: 单次解读 ≤ 2000 tokens
 * - Error desensitization: 不暴露内部错误
 * - 无持久化：不存储用户输入
 *
 * 环境变量:
 * - ANTHROPIC_API_KEY: Claude API key（优先）
 * - DEEPSEEK_API_KEY: DeepSeek API key（备选）
 * - AI_PROVIDER: 'anthropic' | 'deepseek'（默认 anthropic）
 */

import { NextRequest } from 'next/server';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { retrieveKnowledge, STAR_NAME_EN, PALACE_NAME_EN } from '@/lib/classics/knowledge-base';
import { BRANCHES } from '@/lib/ziwei/constants';

// ─── 配置 ────────────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_TOKENS = 2000;

// ─── Rate Limiter ────────────────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 5 * 60 * 1000).unref();

// ─── 命盘摘要 ────────────────────────────────────────────────────────────────

function summarizeChart(chart: ZiweiChart): string {
  const lines: string[] = [];

  lines.push(`命主：${chart.birthInfo.name || '匿名'}，${chart.birthInfo.gender === 'male' ? '男' : '女'}`);
  lines.push(`公历：${chart.birthInfo.year}年${chart.birthInfo.month}月${chart.birthInfo.day}日 ${BRANCHES[chart.birthInfo.hour]}时`);
  lines.push(`五行局：${chart.wuxingJuName}`);
  lines.push(`命宫：${BRANCHES[chart.mingGongBranch]}，身宫：${BRANCHES[chart.shenGongBranch]}`);
  lines.push(`命主星：${chart.mingZhu || '无'}，身主星：${chart.shenZhu || '无'}`);
  lines.push('');
  lines.push('十二宫主星：');

  for (const p of chart.palaces) {
    const mainStars = p.stars
      .filter(s => s.type === 'major')
      .map(s => s.name + (s.siHua ? `化${s.siHua}` : '') + (s.brightnessRaw ? `〔${s.brightnessRaw}〕` : ''))
      .join('、');
    if (mainStars) {
      lines.push(`  ${p.name}（${BRANCHES[p.branch]}）：${mainStars}`);
    }
    if (p.isEmpty && p.borrowedFromName) {
      lines.push(`  ${p.name}：空宫，借对宫${p.borrowedFromName}`);
    }
  }

  // 大限
  lines.push('');
  lines.push('当前大限：');
  const currentDx = chart.daXians[chart.currentDaXianIndex];
  if (currentDx) {
    lines.push(`  ${currentDx.startAge}-${currentDx.endAge}岁 ${currentDx.palaceName}`);
    if (currentDx.stemName) lines.push(`  大限天干：${currentDx.stemName}`);
  }

  return lines.join('\n');
}

// ─── 构建系统提示 ────────────────────────────────────────────────────────────

function buildSystemPrompt(chart: ZiweiChart): string {
  const chartSummary = summarizeChart(chart);

  // 检索相关古籍
  const mainStars = chart.palaces
    .flatMap(p => p.stars.filter(s => s.type === 'major').map(s => s.name));
  const uniqueStars = [...new Set(mainStars)].slice(0, 6);

  const sihuas = chart.palaces
    .flatMap(p => p.stars.filter(s => s.siHua).map(s => s.siHua!));
  const uniqueSihuas = [...new Set(sihuas)].slice(0, 4);

  const knowledge = retrieveKnowledge({
    stars: uniqueStars,
    sihuas: uniqueSihuas,
    palaces: ['命宫', '官禄宫', '财帛宫', '夫妻宫'],
    maxPassages: 12,
  });

  const classicsText = knowledge.passages
    .map(p => `【${p.bookTitle}·${p.chapterTitle}】${p.text}`)
    .join('\n\n');

  return `你是一位精通紫微斗数的命理师，师承倪海厦《天纪》体系，风格严谨、平和、不夸大。

## 命盘信息
${chartSummary}

## 相关古籍引证
${classicsText}

## 解读原则
1. 用现代白话解读，语气平和，不恐吓、不夸大
2. 引用古籍时注明出处（如"骨髓赋云：..."）
3. 按用户要求的结构输出，使用 **【标题】** 格式分段
4. 结尾加提醒："命理仅供参考，人生际遇受多种因素影响，宜积极面对。"
5. 不要使用 Markdown 标题（#），用 **【段落标题】** 和换行组织
6. 保持专业但易懂，避免过度玄学术语`;
}

// ─── SSE 流式响应 ────────────────────────────────────────────────────────────

function createSSEStream(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const sendDone = () => {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      };

      const sendError = (msg: string) => {
        send({ delta: { text: `\n\n⚠️ ${msg}` } });
        sendDone();
      };

      try {
        const provider = process.env.AI_PROVIDER || 'anthropic';
        const apiKey = provider === 'deepseek'
          ? process.env.DEEPSEEK_API_KEY
          : process.env.ANTHROPIC_API_KEY;

        if (!apiKey) {
          sendError('AI 服务未配置，请联系管理员设置 API Key');
          return;
        }

        if (provider === 'deepseek') {
          await streamDeepSeek(apiKey, systemPrompt, messages, send, sendDone, sendError);
        } else {
          await streamAnthropic(apiKey, systemPrompt, messages, send, sendDone, sendError);
        }
      } catch (err) {
        console.error('[interpret] Stream error:', err);
        sendError('AI 服务暂时不可用，请稍后重试');
      }
    },
  });
}

// ─── Anthropic Claude 流式调用 ───────────────────────────────────────────────

async function streamAnthropic(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  send: (data: object) => void,
  sendDone: () => void,
  sendError: (msg: string) => void,
) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'Anthropic-Version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[interpret] Anthropic API error:', err);
    sendError('AI 服务返回错误');
    return;
  }

  if (!response.body) {
    sendError('AI 服务无响应流');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;

      try {
        const event = JSON.parse(data);
        if (event.type === 'content_block_delta' && event.delta?.text) {
          send({ delta: { text: event.delta.text } });
        }
      } catch { /* skip malformed */ }
    }
  }

  sendDone();
}

// ─── DeepSeek 流式调用（备选） ──────────────────────────────────────────────

async function streamDeepSeek(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  send: (data: object) => void,
  sendDone: () => void,
  sendError: (msg: string) => void,
) {
  const allMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: allMessages,
      max_tokens: MAX_TOKENS,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[interpret] DeepSeek API error:', err);
    sendError('AI 服务返回错误');
    return;
  }

  if (!response.body) {
    sendError('AI 服务无响应流');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data || data === '[DONE]') continue;

      try {
        const event = JSON.parse(data);
        const content = event.choices?.[0]?.delta?.content;
        if (content) {
          send({ delta: { text: content } });
        }
      } catch { /* skip malformed */ }
    }
  }

  sendDone();
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.retryAfter ?? 60),
        },
      }
    );
  }

  // Parse request
  let body: { chart?: ZiweiChart; messages?: Array<{ role: string; content: string }> };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (!body.chart || !body.messages || !Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: 'Missing chart or messages' }), { status: 400 });
  }

  // Validate messages
  const validMessages = body.messages.filter(
    m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
  );

  if (validMessages.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid messages' }), { status: 400 });
  }

  // Build system prompt with chart context
  const systemPrompt = buildSystemPrompt(body.chart);

  // Stream response
  const stream = createSSEStream(systemPrompt, validMessages as Array<{ role: 'user' | 'assistant'; content: string }>);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ─── OPTIONS (CORS) ──────────────────────────────────────────────────────────

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
