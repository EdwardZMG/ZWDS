export const metadata = {
  title: 'Privacy Policy · 隐私政策 | ZiWei Chart',
  description: 'Privacy policy for ZiWei Chart AI interpretation service'
};

export default function PrivacyPage() {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>Back</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>ZiWei Chart</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Privacy Policy · 隐私政策</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>Last updated: November 2026 · 最后更新：2026年11月</p>

        {/* ── English ─────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. What We Collect</h2>
          <p>For each AI interpretation request, we process the following information <strong>in memory only</strong>:</p>
          <ul style={{ paddingLeft: 24 }}>
            <li>Birth data: year, month, day, hour, gender (required for chart calculation)</li>
            <li>Name (optional, used only for personalizing the report)</li>
            <li>Question or focus area (optional, for tailored interpretation)</li>
          </ul>
          <p style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
            <strong>We do NOT collect or store:</strong> phone numbers, email addresses, payment information, account credentials, or location data. There is no user registration or login system.
          </p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. How We Use Your Information</h2>
          <ul style={{ paddingLeft: 24 }}>
            <li>Generate your Zi Wei Dou Shu chart (calculated client-side)</li>
            <li>Produce an AI interpretation via Anthropic Claude API (see Section 4)</li>
            <li>Rate limiting: we temporarily track your IP address to prevent abuse (10 requests/minute)</li>
          </ul>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. Data Retention</h2>
          <p><strong>All interpretation requests are session-only.</strong> We do not persist your birth data, chart results, or interpretation text to any database. Once the response is sent, the data is discarded from our servers.</p>
          <p>Local browser storage (localStorage) may retain your most recent chart for convenience. You can clear this at any time via browser settings.</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. Third-Party Services</h2>
          <p>AI interpretation is powered by <strong>Anthropic Claude</strong>. Your birth data and chart summary are transmitted to Anthropic's API for processing. Anthropic does not use API data for model training. See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener" style={{ color: 'var(--ac)' }}>Anthropic's Privacy Policy</a>.</p>
          <p>We may add alternative AI providers (e.g., DeepSeek, Kimi) in the future. Any such provider will be bound by equivalent data processing terms.</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. Cookies</h2>
          <p>We use only essential cookies for:</p>
          <ul style={{ paddingLeft: 24 }}>
            <li>Theme preference (dark/light mode)</li>
            <li>Rate limiting (temporary IP counter, no personal data)</li>
          </ul>
          <p>No tracking cookies, no analytics cookies, no advertising cookies.</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. Your Rights</h2>
          <p>Since we do not store personal data, there is no data to access, correct, or delete. If you have concerns, contact us at the address below.</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. Jurisdiction</h2>
          <p>This service is operated from Singapore. By using this service, you consent to the processing of your data in Singapore, which may have different data protection laws than your jurisdiction.</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>8. Contact</h2>
          <p>For privacy inquiries: <a href="mailto:privacy@ziwei.app" style={{ color: 'var(--ac)' }}>privacy@ziwei.app</a></p>
        </section>

        {/* ── 中文 ────────────────────────────────────────────────────────── */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--bdr)', margin: '40px 0' }} />

        <section>
          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. 我们收集什么</h2>
          <p>每次 AI 解读请求，我们<strong>仅在内存中</strong>处理以下信息：</p>
          <ul style={{ paddingLeft: 24 }}>
            <li>出生数据：年、月、日、时、性别（排盘必需）</li>
            <li>姓名（选填，仅用于个性化报告）</li>
            <li>追问内容（选填，用于定向解读）</li>
          </ul>
          <p style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
            <strong>我们不收集也不存储：</strong>手机号、邮箱、支付信息、账号凭证、位置数据。没有注册系统，没有登录功能。
          </p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. 我们如何使用信息</h2>
          <ul style={{ paddingLeft: 24 }}>
            <li>生成紫微斗数命盘（客户端计算）</li>
            <li>通过 Anthropic Claude API 生成 AI 解读（见第 4 条）</li>
            <li>频率限制：临时追踪 IP 地址以防止滥用（10 次/分钟）</li>
          </ul>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. 数据保留</h2>
          <p><strong>所有解读请求仅限当次会话。</strong>我们不会将出生数据、命盘结果或解读文本持久化到任何数据库。响应发送后，数据即从服务器丢弃。</p>
          <p>浏览器本地存储（localStorage）可能保留您最近的命盘以便查看。您可随时通过浏览器设置清除。</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. 第三方服务</h2>
          <p>AI 解读由 <strong>Anthropic Claude</strong> 提供支持。您的出生数据和命盘摘要会传输至 Anthropic API 进行处理。Anthropic 不使用 API 数据训练模型。详见 <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener" style={{ color: 'var(--ac)' }}>Anthropic 隐私政策</a>。</p>
          <p>未来可能接入其他 AI 服务商（如 DeepSeek、Kimi），均将遵守同等数据处理条款。</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. Cookie</h2>
          <p>我们仅使用必要 Cookie：</p>
          <ul style={{ paddingLeft: 24 }}>
            <li>主题偏好（深色/浅色模式）</li>
            <li>频率限制（临时 IP 计数器，不含个人数据）</li>
          </ul>
          <p>无追踪 Cookie，无分析 Cookie，无广告 Cookie。</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. 您的权利</h2>
          <p>由于我们不存储个人数据，因此没有可访问、更正或删除的数据。如有疑虑，请通过以下方式联系。</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. 管辖权</h2>
          <p>本服务运营地为<strong>新加坡</strong>。使用本服务即表示您同意在新加坡处理数据，新加坡的数据保护法律可能与您所在司法管辖区不同。</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>8. 联系方式</h2>
          <p>隐私咨询：<a href="mailto:privacy@ziwei.app" style={{ color: 'var(--ac)' }}>privacy@ziwei.app</a></p>
        </section>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/terms" style={{ color: 'var(--ac)' }}>Terms · 服务条款</a> · <a href="/" style={{ color: 'var(--ac)' }}>Home · 首页</a>
        </p>
      </main>
    </>
  );
}
