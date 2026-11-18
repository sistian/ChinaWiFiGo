/* ============================================================
 * ChinaWiFiGo 全站运行时配置（唯一来源）
 * ------------------------------------------------------------
 * 改这里 = 改全站。Supabase 项目切换时只改这里，不要在页面里硬编码。
 * 2026-11-10 抽出：原先 9 个页面各自硬编码 SB_URL / SB_KEY / API_URL，
 * 且 account.html 与 admin-login.html 误用了无效的 publishable key（qu 前缀，
 * 实测 /auth/v1 返回 401），导致管理后台无法登录。现统一在此声明。
 * ============================================================ */
(function () {
  // Supabase（独立项目，供 CWG 单独使用）
  window.CWG_SB_URL = 'https://tybexleyjssmlqkuggdb.supabase.co';
  window.CWG_SB_KEY = 'sb_publishable_qmWIGt374JA2r1keV07jCQ_xZ6B3GTR';

  // 自建后端 API
  window.CWG_API_URL = 'https://api.chinawifigo.com';
  try {
    var _ap = new URLSearchParams(location.search).get('api');
    if (_ap) window.CWG_API_URL = _ap;
  } catch (e) {}
})();
