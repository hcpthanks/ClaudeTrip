/* ═══════════════════════════════════════════════════════
   站点配置文件 — 改域名/改支付链接只需改这一个文件
   此文件必须在 anti-theft.js 之前加载
   ═══════════════════════════════════════════════════════ */

window.CC_SITE_CONFIG = {

  // ══════ 官方域名白名单 ══════
  // 新域名直接加到这里即可，anti-theft.js 会自动读取
  allowedDomains: [
    'hcpthanks.github.io',
    'hcpthanks.com',
    'www.hcpthanks.com',
    'localhost',
    '127.0.0.1'
  ],

  // ══════ 官方信息 ══════
  officialDomain: 'www.hcpthanks.com',
  officialName:    'Claude Code 学习站',
  officialPayUrl:  'https://www.hcpthanks.com/pay/pay.html',
  officialSiteUrl: 'https://www.hcpthanks.com/'

};
