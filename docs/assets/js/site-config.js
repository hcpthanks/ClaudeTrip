/* ═══════════════════════════════════════════════════════
   站点配置文件 — 改域名/改支付链接只需改这一个文件
   此文件必须在 anti-theft.js 之前加载
   ═══════════════════════════════════════════════════════ */

window.CC_SITE_CONFIG = {

  // ══════ 官方域名白名单 ══════
  // 新域名直接加到这里即可，anti-theft.js 会自动读取
  allowedDomains: [
    'hcpthanks.github.io',
    'localhost',
    '127.0.0.1'
    // 例: 'www.your-domain.cn',   ← 新域名加这里
  ],

  // ══════ 官方信息 ══════
  officialDomain: 'hcpthanks.github.io',
  officialName:    'Claude Code 学习站',
  officialPayUrl:  'https://hcpthanks.github.io/ClaudeTrip/pay/pay.html',
  officialSiteUrl: 'https://hcpthanks.github.io/ClaudeTrip/'

};
