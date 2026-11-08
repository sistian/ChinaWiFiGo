/**
 * 站点流量埋点模块（GA4）
 *
 * 用于 VIPChinaGuide / ChinaWiFiGo（Chinawheely 有更完整的双通道版本 js/analytics.js）。
 *
 * 设计要点：
 *   - 集中式配置：只改下方 SITE 配置即可切换站点
 *   - 隐私：只上报事件名与业务维度（城市/落地页/UTM/服务类型），
 *           不采集姓名、邮箱、电话等个人信息
 *   - 绝不报错：任何异常都静默吞掉，不影响页面交互
 *   - 自动 page_view 由 GA4 config 上报，不重复发送
 */
(function () {
  'use strict';

  // ★↓↓ 站点配置（换站只需改这里） ★↓↓
  var SITE = {
  "name": "chinawifigo",
  "gaId": "G-T7GRQN0G2F",
  "forms": {
    "cwgContactForm": "contact_submit",
    "quoteForm": "quote_submit",
    "form": "form_submit"
  },
  "skipPages": [
    "admin.html",
    "admin-login.html",
    "account.html",
    "404.html"
  ]
};

  var GA_ID = SITE.gaId;
  var GA_ENABLED = /^G-[A-Z0-9]{6,}$/i.test(GA_ID);
  window.SITE_GA_ID = GA_ID;

  // ---------- 加载 gtag.js ----------
  if (GA_ENABLED) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { send_page_view: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // ---------- 业务维度白名单（其余一律丢弃，防 PII 混入） ----------
  var PROP_ALLOWED = {
    city: 1, form_id: 1, service_type: 1, city_to: 1, city_from: 1,
    product: 1, label: 1, tier: 1, hours: 1, endpoint: 1, status: 1,
    utm_source: 1, utm_medium: 1, utm_campaign: 1, landing_page: 1, page_type: 1
  };

  // ---------- 会话 id ----------
  var SESSION_KEY = SITE.name + '_sid';
  var memSessionId = null;

  function randomId() {
    try {
      if (window.crypto && window.crypto.getRandomValues) {
        var buf = new Uint16Array(8);
        window.crypto.getRandomValues(buf);
        var hex = '';
        for (var i = 0; i < buf.length; i++) {
          hex += (buf[i] + 0x10000).toString(16).slice(1);
        }
        return hex;
      }
    } catch (e) { /* ignore */ }
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function sessionId() {
    if (memSessionId) return memSessionId;
    var id = null;
    try {
      id = window.sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = randomId();
        window.sessionStorage.setItem(SESSION_KEY, id);
      }
    } catch (e) {
      id = memSessionId || (memSessionId = randomId());
    }
    return id || (memSessionId = randomId());
  }

  /** 城市维度：优先 URL slug，其次 body 的 data-city */
  function currentCity() {
    try {
      var m = window.location.pathname.match(/\/([a-z0-9_-]+)\.html$/i);
      if (m && m[1] && m[1] !== 'index') return m[1];
      var el = document.body && document.body.getAttribute('data-city');
      if (el) return el;
      var q = new URLSearchParams(window.location.search);
      return q.get('city') || '';
    } catch (e) {
      return '';
    }
  }

  function sessionContext() {
    try {
      var q = new URLSearchParams(window.location.search);
      return {
        city: currentCity(),
        utm_source: q.get('utm_source') || '',
        utm_medium: q.get('utm_medium') || '',
        utm_campaign: q.get('utm_campaign') || '',
        landing_page: window.location.pathname.replace(/^\//, '') || 'index.html'
      };
    } catch (e) {
      return { city: currentCity(), utm_source: '', utm_medium: '', utm_campaign: '', landing_page: '' };
    }
  }

  /** 只保留白名单维度，且值必须是标量（嵌套对象直接丢） */
  function pickProps(params) {
    var out = {};
    if (!params || typeof params !== 'object') return out;
    for (var k in params) {
      if (!Object.prototype.hasOwnProperty.call(params, k)) continue;
      if (!PROP_ALLOWED[k]) continue;
      var v = params[k];
      if (v === undefined || v === null) continue;
      if (typeof v === 'object') continue;
      var str = String(v);
      if (!str) continue;
      out[k] = str.slice(0, 80);
    }
    return out;
  }

  /** 统一派发入口 */
  window.siteTrack = function (eventName, params) {
    if (!eventName || !GA_ENABLED) return;
    try {
      window.gtag('event', eventName, pickProps(params));
    } catch (e) { /* 埋点失败绝不影响业务 */ }
  };

  function isSkipped() {
    try {
      var p = window.location.pathname.replace(/^\//, '') || 'index.html';
      return SITE.skipPages.indexOf(p) >= 0;
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!GA_ENABLED || isSkipped()) return;

    // ---------- 1. WhatsApp / 电话 ----------
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('a,button') : null;
      if (!el) return;
      var href = el.getAttribute('href') || '';
      var cls = String(el.className || '');

      if (/wa\.me|whatsapp/i.test(href) || /whatsapp/i.test(cls)) {
        window.siteTrack('whatsapp_click', Object.assign(sessionContext(), {
          label: (el.getAttribute('data-label') || el.textContent || '').trim().slice(0, 60)
        }));
      } else if (/^tel:/i.test(href)) {
        window.siteTrack('phone_click', sessionContext());
      } else if (/city-card/i.test(cls)) {
        window.siteTrack('city_card_click', Object.assign(sessionContext(), {
          city: el.getAttribute('data-city') || currentCity()
        }));
      }
    }, true);

    // ---------- 2. 导航点击 ----------
    var nav = document.querySelector('.nav-links, nav');
    if (nav) {
      nav.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a') : null;
        if (!a) return;
        window.siteTrack('nav_click', Object.assign(sessionContext(), {
          label: (a.textContent || '').trim().slice(0, 40)
        }));
      });
    }

    // ---------- 3. 表单开始（首次 focus = 有意图） ----------
    var started = {};
    document.addEventListener('focusin', function (e) {
      var f = e.target;
      if (!f || !f.form || !f.form.id) return;
      var key = f.form.id;
      if (started[key]) return;
      started[key] = true;
      window.siteTrack('form_start', Object.assign(sessionContext(), { form_id: key }));
    }, true);

    // ---------- 4. 表单提交 ----------
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form || !form.id) return;
      var ev = SITE.forms[form.id];
      if (!ev) return;

      var params = Object.assign(sessionContext(), { form_id: form.id });
      try {
        var fd = new FormData(form);
        var pick = function (keys) {
          for (var i = 0; i < keys.length; i++) {
            var v = fd.get(keys[i]);
            if (v) return String(v).slice(0, 60);
          }
          return '';
        };
        params.service_type = pick(['serviceType', 'service', 'service_type', 'tripType', 'type']);
        params.city_to = pick(['city', 'cityTo', 'destination', 'arrivalCity']);
        params.city_from = pick(['cityFrom', 'pickupCity', 'departureCity']);
      } catch (err) { /* ignore */ }

      window.siteTrack(ev, params);
    }, true);
  });
})();
