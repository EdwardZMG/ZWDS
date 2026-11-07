export const metadata = {
  title: 'Terms of Service · 服务条款 | ZiWei Chart',
  description: 'Terms of service for ZiWei Chart AI interpretation service'
};

export default function TermsPage() {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>Back</span>
        </a>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: 12, color: 'var(--ac)', letterSpacing: '0.2em' }}>ZiWei Chart</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Terms of Service · 服务条款</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>Last updated: November 2026 · 最后更新：2026年11月</p>

        {/* ── English ─────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. Service Description</h2>
          <p>ZiWei Chart provides AI-powered Zi Wei Dou Shu (Purple Star Astrology) chart generation and interpretation. This service is based on traditional Chinese astrology systems and is <strong>for entertainment and cultural reference only</strong>.</p>
          <p><strong>Not professional advice.</strong> Interpretations do not constitute medical, financial, legal, psychological, or life-decision guidance. Consult qualified professionals for such matters.</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. Acceptable Use</h2>
          <p>By using this service, you agree to:</p>
          <ul style={{ paddingLeft: 24 }}>
            <li>Use it only for lawful, personal reference purposes</li>
            <li>Not scrape, automate, or bulk-call the API</li>
            <li>Not resell or redistribute the generated content</li>
            <li>Provide accurate birth information; inaccurate data will produce inaccurate interpretations</li>
          </ul>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. Intellectual Property</h2>
          <p>The chart calculation engine is open-source (MIT License). Classical texts (骨髓赋, 紫微斗数全集, 紫微斗数全书) are in the public domain.</p>
          <p>AI-generated interpretations are provided for your personal use. You may not:</p>
          <ul style={{ paddingLeft: 24 }}>
            <li>Use them to train machine learning models</li>
            <li>Republish them as your own content</li>
            <li>Build a competing service using our API or content</li>
          </ul>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. Disclaimer of Warranties</h2>
          <p style={{ padding: '12px 16px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 8 }}>
            This service is provided <strong>"as is"</strong> without warranties of any kind. Astrology is a cultural tradition, not a science. We do not guarantee accuracy, completeness, or fitness for any particular purpose.
          </p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. Limitation of Liability</h2>
          <p>In no event shall we be liable for any damages arising from your use of this service. You assume full responsibility for decisions made based on interpretations.</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. Rate Limiting & Availability</h2>
          <p>We reserve the right to limit requests (currently 10/minute/IP) and to modify or discontinue the service at any time without notice.</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. Jurisdiction</h2>
          <p>These terms are governed by the laws of <strong>Singapore</strong>. Disputes shall be resolved in Singapore courts.</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>8. Changes</h2>
          <p>We may update these terms periodically. Continued use after changes constitutes acceptance.</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>9. Contact</h2>
          <p>For questions: <a href="mailto:legal@ziwei.app" style={{ color: 'var(--ac)' }}>legal@ziwei.app</a></p>
        </section>

        {/* ── 中文 ────────────────────────────────────────────────────────── */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--bdr)', margin: '40px 0' }} />

        <section>
          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. 服务说明</h2>
          <p>ZiWei Chart 提供 AI 驱动的紫微斗数排盘与解读服务。本服务基于传统中国命理体系，<strong>仅供娱乐与文化参考</strong>。</p>
          <p><strong>非专业建议。</strong>解读内容不构成医疗、投资、法律、心理或人生决策建议。相关事务请咨询专业人士。</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. 使用规范</h2>
          <p>使用本服务即表示您同意：</p>
          <ul style={{ paddingLeft: 24 }}>
            <li>仅用于合法、个人参考目的</li>
            <li>不进行爬虫抓取、自动化调用或批量请求</li>
            <li>不转售或再分发生成的内容</li>
            <li>提供真实出生信息；错误数据将导致错误解读</li>
          </ul>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. 知识产权</h2>
          <p>排盘引擎为开源代码（MIT 许可证）。古籍原文（骨髓赋、紫微斗数全集、紫微斗数全书）属公有领域。</p>
          <p>AI 生成的解读仅供个人使用。您不得：</p>
          <ul style={{ paddingLeft: 24 }}>
            <li>用于训练机器学习模型</li>
            <li>以本人名义发布为原创内容</li>
            <li>使用本 API 或内容构建同类竞争服务</li>
          </ul>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. 免责声明</h2>
          <p style={{ padding: '12px 16px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 8 }}>
            本服务按<strong>"现状"</strong>提供，不附带任何明示或默示的担保。命理属于传统文化，非科学实证。我们不保证准确性、完整性或特定用途的适用性。
          </p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>5. 责任限制</h2>
          <p>在任何情况下，我们不对因使用本服务产生的任何损害承担责任。您须对基于解读做出的决定承担全部责任。</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>6. 频率限制与可用性</h2>
          <p>我们保留限制请求频率（当前 10 次/分钟/IP）以及随时修改或中断服务的权利，恕不另行通知。</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>7. 管辖权</h2>
          <p>本条款受<strong>新加坡</strong>法律管辖。争议提交新加坡法院解决。</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>8. 变更</h2>
          <p>我们可能不定期更新本条款。变更后继续使用即表示接受。</p>

          <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>9. 联系方式</h2>
          <p>咨询：<a href="mailto:legal@ziwei.app" style={{ color: 'var(--ac)' }}>legal@ziwei.app</a></p>
        </section>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <a href="/privacy" style={{ color: 'var(--ac)' }}>Privacy · 隐私政策</a> · <a href="/" style={{ color: 'var(--ac)' }}>Home · 首页</a>
        </p>
      </main>
    </>
  );
}
