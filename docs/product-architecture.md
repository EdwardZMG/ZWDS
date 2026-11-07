# 紫微斗数 AI 解读 SaaS — 技术架构规划

## 一、产品定位

**核心价值：** 基于倪海厦《天纪》体系的 AI 深度命盘解读  
**目标用户：** 命理爱好者、学习者、普通用户  
**商业模式：** Freemium（免费排盘 + 付费 AI 解读）

---

## 二、功能分层

### 免费层（引流）
- ✅ 完整排盘（十二宫、主星、四化、大限）
- ✅ 基础格局显示
- ✅ 古籍引证查看
- ✅ 每日运势（简版）

### 付费层（变现）
- 💰 AI 深度解读（单次 9.9 元）
  - 命格总览 + 六大维度（事业/财运/感情/健康/家庭/迁移）
  - 大限流年详批
  - 格局深度分析
- 💰 包月会员（99 元/月）
  - 无限次 AI 解读
  - 专属命理顾问（AI + 人工）
  - 高级功能（合盘、择日等）
- 💰 分享卡片（1 元/次）
  - 精美命盘卡片生成
  - 社交分享裂变

---

## 三、技术架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                      用户端                             │
│  Web App (Next.js)  |  微信小程序  |  H5 页面           |
└────────────────┬────────────────────────────────────────┘
                 |
                 v
┌─────────────────────────────────────────────────────────┐
│              CDN + 负载均衡 (Vercel/Cloudflare)          |
└────────────────┬────────────────────────────────────────┘
                 |
                 v
┌─────────────────────────────────────────────────────────┐
│              API Gateway (Next.js API Routes)            |
│  /api/auth/*  |  /api/chart/*  |  /api/ai/*  |  /api/pay/*│
└────────────────┬────────────────────────────────────────┘
                 |
        ┌────────┴────────┬───────────────┬──────────┐
        v                 v               v          v
┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│ Auth Service  |  | Chart Engine  |  | AI Service│  | Payment  |
│ (NextAuth.js)│  | (排盘引擎)    |  | (LLM API)│  | Service  |
└──────┬───────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘
       |                 |               |              |
       v                 v               v              v
┌─────────────────────────────────────────────────────────┐
│                  数据层                                   |
│  PostgreSQL (Supabase)  |  Redis (Upstash)  |  S3 (R2)  |
│  - 用户数据              |  - Session        |  - 图片    |
│  - 解读历史              |  - 限流           |  - 缓存    |
│  - 支付记录              |  - 热门命盘        |           |
└─────────────────────────────────────────────────────────┘
```

### 3.2 技术栈选型

| 层级 | 技术 | 理由 |
|------|------|------|
| **前端** | Next.js 14 + Tailwind + shadcn/ui | 已有基础，SSR/SSG 支持好，SEO 友好 |
| **后端** | Next.js API Routes | 全栈统一，部署简单 |
| **数据库** | PostgreSQL (Supabase) | 免费 500MB，自带 Auth/Realtime |
| **缓存** | Redis (Upstash) | Serverless，免费 10k 请求/天 |
| **AI** | DeepSeek API / Kimi API | 国产免费额度，中文能力强 |
| **支付** | 微信支付 JSAPI | 小程序/H5 通用 |
| **认证** | NextAuth.js + 微信登录 | 社交登录，用户体验好 |
| **部署** | Vercel (前端) + Supabase (后端) | 免费额度够用，自动扩容 |
| **监控** | Sentry + PostHog | 错误追踪 + 用户行为分析 |

### 3.3 核心模块设计

#### A. 排盘引擎（已有）
```typescript
// lib/ziwei/algorithm.ts
export function generateChart(birthInfo: BirthInfo): ZiweiChart {
  // 完整的排盘逻辑
  // 输入：年月日时 + 性别
  // 输出：十二宫、主星、四化、大限等
}
```

#### B. AI 解读服务
```typescript
// services/ai-interpretation.ts
interface InterpretationRequest {
  chart: ZiweiChart;
  dimensions: ('overview' | 'career' | 'wealth' | 'love' | 'health' | 'family')[];
  depth: 'basic' | 'detailed';
}

interface InterpretationResult {
  content: string;        // Markdown 格式解读
  references: string[];   // 古籍引证
  confidence: number;     // AI 置信度
}

async function generateInterpretation(
  req: InterpretationRequest
): Promise<InterpretationResult> {
  // 1. 构建 Prompt（命盘数据 + 知识库 + 用户问题）
  const prompt = buildPrompt(req.chart, req.dimensions);
  
  // 2. 调用 LLM API
  const response = await deepseek.chat.completions.create({
    model: ' deepseek-chat',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });
  
  // 3. 解析 + 后处理
  return parseInterpretation(response.choices[0].message.content);
}
```

#### C. 支付系统
```typescript
// services/payment.ts
interface PaymentOrder {
  userId: string;
  productId: 'single_interpretation' | 'monthly_subscription';
  amount: number;       // 分
  orderId: string;
}

async function createWeChatPayOrder(order: PaymentOrder) {
  // 1. 创建订单记录
  await db.orders.create({ ...order, status: 'pending' });
  
  // 2. 调用微信支付 API
  const result = await wechatPay.createOrder({
    out_trade_no: order.orderId,
    description: '紫微斗数 AI 深度解读',
    total_amount: order.amount,
    notify_url: 'https://api.example.com/api/payment/notify'
  });
  
  return result;
}

// 支付回调
async function handlePaymentNotify(notification: WeChatPayNotify) {
  // 1. 验签
  if (!verifySignature(notification)) throw new Error('Invalid signature');
  
  // 2. 更新订单状态
  await db.orders.update(
    { where: { orderId: notification.out_trade_no }, data: { status: 'paid' } }
  );
  
  // 3. 解锁权益
  await unlockUserBenefits(notification.out_trade_no);
}
```

#### D. 用户系统
```typescript
// models/user.ts
interface User {
  id: string;
  openid: string;       // 微信 OpenID
  unionid?: string;     // 微信 UnionID
  nickname: string;
  avatar: string;
  phone?: string;
  membership: {
    type: 'free' | 'monthly' | 'yearly';
    expiresAt: Date;
  };
  credits: {
    singleInterpretations: number;  // 单次解读次数
    shareCards: number;              // 分享卡片次数
  };
 createdAt: Date;
}

// 认证中间件
async function authMiddleware(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}
```

---

## 四、数据库设计

### 4.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid VARCHAR(64) UNIQUE NOT NULL,
  unionid VARCHAR(64),
  nickname VARCHAR(64),
  avatar TEXT,
  phone VARCHAR(20),
  membership_type VARCHAR(20) DEFAULT 'free',
  membership_expires_at TIMESTAMP,
  credits_single_interpretation INT DEFAULT 0,
  credits_share_card INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 命盘表
CREATE TABLE charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  birth_year INT NOT NULL,
  birth_month INT NOT NULL,
  birth_day INT NOT NULL,
  birth_hour INT NOT NULL,
  gender VARCHAR(10) NOT NULL,
  chart_data JSONB NOT NULL,  -- 完整命盘数据
  created_at TIMESTAMP DEFAULT NOW()
);

-- 解读记录表
CREATE TABLE interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  chart_id UUID REFERENCES charts(id),
  dimensions TEXT[] NOT NULL,  -- ['overview', 'career', ...]
  content TEXT NOT NULL,       -- AI 生成的解读内容
  references TEXT[],           -- 古籍引证
  tokens_used INT,             -- 消耗的 token 数
  cost DECIMAL(10, 4),         -- API 调用成本
  created_at TIMESTAMP DEFAULT NOW()
);

-- 订单表
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  order_no VARCHAR(64) UNIQUE NOT NULL,
  product_type VARCHAR(30) NOT NULL,  -- 'single_interpretation', 'monthly_subscription'
  amount INT NOT NULL,                -- 金额（分）
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'paid', 'failed', 'refunded'
  payment_method VARCHAR(20),         -- 'wechat', 'alipay'
  transaction_id VARCHAR(64),         -- 第三方支付流水号
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 分享卡片表
CREATE TABLE share_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  chart_id UUID REFERENCES charts(id),
  image_url TEXT NOT NULL,
  share_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 索引优化

```sql
-- 用户查询优化
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_phone ON users(phone);

-- 命盘查询优化
CREATE INDEX idx_charts_user_id ON charts(user_id);
CREATE INDEX idx_charts_created_at ON charts(created_at DESC);

-- 解读记录查询优化
CREATE INDEX idx_interpretations_user_id ON interpretations(user_id);
CREATE INDEX idx_interpretations_chart_id ON interpretations(chart_id);
CREATE INDEX idx_interpretations_created_at ON interpretations(created_at DESC);

-- 订单查询优化
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_no ON orders(order_no);
```

---

## 五、API 设计

### 5.1 认证相关

```
POST /api/auth/wechat-login
  Body: { code: string }
  Response: { token: string, user: User }

POST /api/auth/phone-login
  Body: { phone: string, code: string }
  Response: { token: string, user: User }

GET  /api/auth/me
  Headers: { Authorization: Bearer <token> }
  Response: { user: User }
```

### 5.2 排盘相关

```
POST /api/chart/generate
  Body: { year, month, day, hour, gender }
  Response: { chart: ZiweiChart }

GET  /api/chart/:id
  Response: { chart: ZiweiChart }

GET  /api/charts/my
  Query: { page, limit }
  Response: { charts: ZiweiChart[], total: number }
```

### 5.3 AI 解读相关

```
POST /api/ai/interpret
  Headers: { Authorization: Bearer <token> }
  Body: { 
    chartId: string, 
    dimensions: string[],
    depth: 'basic' | 'detailed'
  }
  Response: { 
    interpretationId: string,
    content: string,
    references: string[]
  }

GET  /api/ai/interpretation/:id
  Response: { interpretation: Interpretation }

POST /api/ai/follow-up
  Body: { 
    interpretationId: string,
    question: string 
  }
  Response: { answer: string }
```

### 5.4 支付相关

```
POST /api/payment/create-order
  Body: { 
    productId: 'single_interpretation' | 'monthly_subscription',
    paymentMethod: 'wechat' 
  }
  Response: { 
    orderId: string,
    paymentParams: object  // 微信支付参数
  }

POST /api/payment/notify
  Body: { ... }  // 微信支付回调
  Response: { success: true }

GET  /api/payment/orders/my
  Query: { page, limit }
  Response: { orders: Order[], total: number }
```

### 5.5 分享卡片相关

```
POST /api/share/generate-card
  Body: { chartId: string, template: string }
  Response: { cardId: string, imageUrl: string }

GET  /api/share/card/:id
  Response: { card: ShareCard }

POST /api/share/card/:id/increment
  Response: { shareCount: number }
```

---

## 六、Prompt 工程

### 6.1 System Prompt

```
你是一位精通倪海厦《天纪》体系的紫微斗数命理大师。你的解读必须：

1. **严格基于命盘数据**：所有结论必须从命盘的星曜组合、宫位关系、四化飞星中推导
2. **引用古籍原文**：关键论断需标注出处（《紫微斗数全书》《骨髓赋》等）
3. **分维度解读**：按用户选择的维度（事业/财运/感情/健康/家庭/迁移）逐一分析
4. **客观中立**：不夸大吉凶，强调"命理为参考，人事在人为"
5. **通俗易懂**：避免过度专业术语，必要时解释概念

解读结构：
- 命格总览（300字）：整体格局特点
- 各维度详批（每维度 500字）：
  - 核心星曜组合分析
  - 吉凶判断 + 古籍依据
  - 实际建议
- 大限流年提示（200字）：当前运势重点
- 结语（100字）：鼓励 + 免责声明

注意事项：
- 不给出绝对化的预测（如"你一定会发财"）
- 涉及健康/投资/法律等敏感话题时，提醒用户咨询专业人士
- 保持正面积极的语气，即使命盘有不利因素也要给出化解建议
```

### 6.2 User Prompt 模板

```
请为以下命盘生成深度解读：

【出生信息】
公历：{year}年{month}月{day}日 {hour}时
农历：{lunarYear}年{lunarMonth}月{lunarDay}日
性别：{gender}

【命盘核心】
五行局：{wuxingJuName}
命宫：{mingGongBranch}（主星：{mingGongStars}）
身宫：{shenGongBranch}（主星：{shenGongStars}）
命主星：{mingZhu}
身主星：{shenZhu}

【十二宫概览】
{palacesSummary}

【四化飞星】
{sihuaSummary}

【当前大限】
{currentDaXian}

请重点解读以下维度：
{selectedDimensions}

解读深度：{depth}
```

---

## 七、成本估算

### 7.1 基础设施成本（月）

| 服务 | 免费额度 | 超出成本 | 备注 |
|------|----------|----------|------|
| Vercel (前端) | 100GB 带宽 | $20/月 | 前 1000 用户够用 |
| Supabase (数据库) | 500MB 存储 | $25/月 | 含 Auth/Realtime |
| Upstash (Redis) | 10k 请求/天 | $10/月 | 限流 + 缓存 |
| Cloudflare R2 (存储) | 10GB | $0.015/GB | 分享卡片图片 |
| **小计** | - | **~$55/月** | 约 400 元 |

### 7.2 AI API 成本

| LLM 服务商 | 价格 | 单次解读成本 | 备注 |
|------------|------|--------------|------|
| DeepSeek | 1元/百万 tokens | ~0.02 元 | 有免费额度 |
| Kimi | 0.06元/千 tokens | ~0.03 元 | 有免费额度 |
| 千问 | 0.02元/千 tokens | ~0.01 元 | 有免费额度 |
| **平均** | - | **~0.02 元/次** | - |

### 7.3 盈利模型

假设：
- 月活用户：10,000
- 付费转化率：5%（500 人）
- 客单价：15 元（单次解读 + 部分会员）
- AI 成本：0.02 元/次 × 2 次/人 = 0.04 元/人

月收入：500 × 15 = 7,500 元  
月成本：400（基础设施）+ 500 × 0.04（AI）= 420 元  
月利润：**7,080 元**

**盈亏平衡点：** 28 个付费用户（覆盖基础设施成本）

---

## 八、开发计划

### Phase 1：MVP（2-3 周）

**目标：** 验证核心付费流程

- [ ] 搭建 Next.js 项目 + Supabase 数据库
- [ ] 实现微信登录 + 手机号登录
- [ ] 集成排盘引擎（已有）
- [ ] 开发 AI 解读 API（接入 DeepSeek）
- [ ] 实现微信支付（单次解读）
- [ ] 基础 UI（命盘展示 + 解读结果页）
- [ ] 部署到 Vercel

**交付物：** 可访问的 Web App，支持登录 → 排盘 → 付费解读

### Phase 2：完善功能（1 个月）

**目标：** 提升用户体验 + 增加变现点

- [ ] 用户中心（历史记录、会员状态）
- [ ] 分享卡片生成（Canvas API）
- [ ] 包月会员系统
- [ ] 每日运势推送（邮件/短信）
- [ ] 解读质量优化（Prompt 调优 + 知识库增强）
- [ ] 数据埋点（PostHog）
- [ ] 错误监控（Sentry）

**交付物：** 功能完整的 Web App，支持多种付费模式

### Phase 3：微信小程序（2 个月）

**目标：** 拓展流量入口

- [ ] 小程序开发（Taro / uni-app）
- [ ] 小程序登录 + 支付
- [ ] 小程序分享裂变（朋友圈/群聊）
- [ ] 公众号对接（每日运势推送）
- [ ] 企业微信客服（高端咨询）

**交付物：** 微信小程序 + 公众号 + 企业微信闭环

### Phase 4：规模化（持续）

**目标：** 提升留存 + 拓展 B 端

- [ ] 社区功能（命盘案例分享 + 讨论）
- [ ] 命理课程（视频 + 文档）
- [ ] 合盘功能（情侣/亲子/合作伙伴）
- [ ] 择日功能（结婚/开业/搬家）
- [ ] B 端 API（给其他 App 提供排盘服务）
- [ ] 人工咨询（高端定制服务）

---

## 九、风险与合规

### 9.1 法律风险

- **免责声明**：所有页面标注"命理为传统文化娱乐参考，不能代替专业判断"
- **隐私政策**：明确说明用户数据收集范围 + 用途
- **支付合规**：使用正规支付渠道（微信支付/支付宝）
- **内容审核**：AI 生成内容需过滤敏感词 + 人工抽检

### 9.2 技术风险

- **AI 幻觉**：通过 Prompt 工程 + 知识库约束降低风险
- **支付安全**：验签 + 幂等性处理 + 对账机制
- **数据泄露**：HTTPS + 数据加密 + 访问控制
- **服务宕机**：多地域部署 + 自动扩容 + 降级策略

### 9.3 商业风险

- **用户付费意愿**：先做免费用户积累，再推付费功能
- **竞品压力**：差异化（倪海厦体系 + 古籍引证 + AI 深度）
- **政策变化**：关注命理类 App 监管动态

---

## 十、下一步行动

### 立即开始（本周）

1. **环境搭建**
   ```bash
   npx create-next-app@latest ziwei-saas
   cd ziwei-saas
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install redis ioredis
   npm install deepseek-ai
   ```

2. **数据库初始化**
   - 注册 Supabase 账号
   - 创建项目 + 执行 SQL 建表
   - 配置 Row Level Security (RLS)

3. **AI API 接入**
   - 注册 DeepSeek 开放平台
   - 获取 API Key
   - 编写测试脚本验证效果

4. **微信支付申请**
   - 注册微信商户平台
   - 提交资质审核（需要营业执照）
   - 获取商户号 + API 密钥

### 第一周目标

- [ ] 完成本地开发环境搭建
- [ ] 数据库表结构创建
- [ ] AI 解读 API 原型（命令行测试）
- [ ] 微信支付申请提交

---

## 附录：参考资源

- [Next.js 文档](https://nextjs.org/docs)
- [Supabase 文档](https://supabase.com/docs)
- [微信支付 JSAPI 文档](https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_1.shtml)
- [ DeepSeek API 文档](https://platform.deepseek.com/api-docs)
- [紫微斗数开源仓库](https://github.com/Renhuai123/ziwei-doushu)

---

**文档版本：** v1.0  
**最后更新：** 2026-10-31  
**作者：** AI Assistant for Edward
