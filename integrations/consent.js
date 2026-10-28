/*
 * iPlace Corporativo UY — consentimento de cookies (Lei 18.331 do Uruguai).
 *
 * A lei uruguaia pede consentimento livre, prévio, expresso e informado (art. 9) e,
 * diferente da LGPD, não tem "legítimo interesse" como base geral. Por isso:
 *   - nada de analytics/publicidade carrega antes do "Aceptar" (integrations.js usa onGrant);
 *   - "Rechazar" tem o mesmo peso visual que "Aceptar" e nada vem pré-marcado;
 *   - a escolha fica registrada (versão da política + data) e vale por 12 meses;
 *   - o visitante muda de ideia quando quiser por qualquer elemento [data-cookie-settings].
 * Também adiciona o aceite da Política de Privacidade aos <form data-lead-form> (art. 13).
 *
 * Uso, no <head> de todas as páginas, ANTES do integrations.js:
 *   <script src="/integrations/consent.js"></script>
 *   <script src="/integrations/integrations.js"></script>
 * Rodapé: <a href="#" data-cookie-settings>Configuración de cookies</a>
 *   (sem esse link na página, aparece um botão flutuante no canto inferior esquerdo).
 * API: window.iplaceConsent.onGrant('analytics', fn), .get('analytics'), .open()
 */
(function () {
  'use strict';

  if (window.iplaceConsent) return;

  var CONFIG = Object.assign({
    policyUrl: '/politica-de-privacidad.html',
    // Mudou cookies, fornecedores ou a política? Troque a versão para pedir o aceite de novo.
    version: '2026-10-28',
    // A lei não fixa prazo; 12 meses é a prática usual para renovar o pedido.
    maxAgeDays: 365,
    // Categorias opcionais exibidas. Inclua 'marketing' quando o GTM tiver tags de publicidade.
    categories: ['analytics']
  }, window.IPLACE_CONSENT);

  var COOKIE_NAME = 'iplace_consent';

  var CATEGORIES = {
    analytics: {
      title: 'Analíticas',
      noun: 'analíticas',
      text: 'Nos permiten medir cómo se usa el sitio (páginas visitadas, tiempo de navegación y ' +
        'origen de las visitas) con Google Analytics. Proveedor: Google LLC (Estados Unidos).',
      google: ['analytics_storage'],
      cookies: /^(_ga|_gid|_gat)/
    },
    marketing: {
      title: 'Publicidad',
      noun: 'de publicidad',
      text: 'Permiten medir nuestras campañas y mostrarte anuncios relevantes en otros sitios ' +
        'con Google Ads. Proveedor: Google LLC (Estados Unidos).',
      google: ['ad_storage', 'ad_user_data', 'ad_personalization', 'personalization_storage'],
      cookies: /^(_gcl|_gac)/
    }
  };

  // --- Escolha salva ----------------------------------------------------------
  var granted = {};
  var hasChoice = false;

  (function readSaved() {
    var match = document.cookie.match(new RegExp('(?:^|; )' + COOKIE_NAME + '=([^;]*)'));
    if (!match) return;
    try {
      var saved = JSON.parse(decodeURIComponent(match[1]));
      // Versão diferente = a política mudou desde o aceite; pergunta de novo.
      if (saved.v !== CONFIG.version) return;
      saved.granted.forEach(function (cat) {
        if (CONFIG.categories.indexOf(cat) > -1) granted[cat] = true;
      });
      hasChoice = true;
    } catch (e) {}
  })();

  // --- Google Consent Mode v2: tudo negado até o visitante escolher -------------
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  function googleConsent() {
    var state = {};
    Object.keys(CATEGORIES).forEach(function (cat) {
      CATEGORIES[cat].google.forEach(function (type) {
        state[type] = granted[cat] ? 'granted' : 'denied';
      });
    });
    return state;
  }

  window.gtag('consent', 'default', Object.assign(googleConsent(), {
    functionality_storage: 'granted',
    security_storage: 'granted'
  }));

  // --- Quem depende do consentimento (integrations.js) --------------------------
  var listeners = [];

  function anyGranted(cats) {
    return cats.some(function (cat) { return granted[cat]; });
  }

  // Executa fn uma única vez, quando qualquer uma das categorias estiver aceita.
  function onGrant(cats, fn) {
    cats = [].concat(cats);
    if (anyGranted(cats)) fn();
    else listeners.push({ cats: cats, fn: fn });
  }

  function runListeners() {
    listeners = listeners.filter(function (l) {
      if (!anyGranted(l.cats)) return true;
      l.fn();
      return false;
    });
  }

  // Apaga os cookies das categorias sem consentimento, inclusive os que o WordPress
  // antigo gravava sem pedir (_ga etc. no mesmo domínio).
  function deleteDeniedCookies() {
    var parts = location.hostname.split('.');
    document.cookie.split('; ').forEach(function (pair) {
      var name = pair.split('=')[0];
      var denied = Object.keys(CATEGORIES).some(function (cat) {
        return !granted[cat] && CATEGORIES[cat].cookies.test(name);
      });
      if (!denied) return;
      // O GA grava no domínio raiz (.iplacecorp.com.uy); apaga em todos os níveis.
      var expired = name + '=; path=/; max-age=0';
      document.cookie = expired;
      for (var i = 0; i < parts.length - 1; i++) {
        document.cookie = expired + '; domain=.' + parts.slice(i).join('.');
      }
    });
  }

  deleteDeniedCookies();

  function save(choice) {
    var list = CONFIG.categories.filter(function (cat) { return choice[cat]; });
    granted = {};
    list.forEach(function (cat) { granted[cat] = true; });
    hasChoice = true;

    // Registro do consentimento (art. 9): o que foi aceito, em qual versão da política e quando.
    var record = { v: CONFIG.version, ts: new Date().toISOString(), granted: list };
    document.cookie = COOKIE_NAME + '=' + encodeURIComponent(JSON.stringify(record)) +
      '; path=/; max-age=' + CONFIG.maxAgeDays * 86400 + '; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '');

    window.gtag('consent', 'update', googleConsent());
    window.dataLayer.push({ event: 'cookie_consent_update', cookie_consent: list.join(',') || 'none' });
    deleteDeniedCookies();
    runListeners();

    if (banner) { banner.parentNode.removeChild(banner); banner = null; }
    if (reopen) reopen.hidden = false;
    closePanel();
  }

  function choiceForAll(value) {
    var choice = {};
    CONFIG.categories.forEach(function (cat) { choice[cat] = value; });
    return choice;
  }

  // --- Interface ------------------------------------------------------------------
  var CSS = [
    '.ipc-banner,.ipc-overlay,.ipc-reopen{font:15px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1d1d1f;box-sizing:border-box}',
    '.ipc-banner *,.ipc-overlay *{box-sizing:border-box}',
    '.ipc-banner{position:fixed;left:16px;bottom:16px;z-index:2147483000;width:calc(100% - 32px);max-width:440px;background:#fff;border:1px solid #d2d2d7;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.18);padding:20px}',
    '.ipc-title{margin:0 0 6px;font-size:17px;font-weight:600}',
    '.ipc-text{margin:0;font-size:14px;color:#424245}',
    '.ipc-banner a,.ipc-overlay a,.ipc-form-consent a{color:inherit;text-decoration:underline}',
    '.ipc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}',
    '.ipc-btn{flex:1 1 auto;width:auto;min-height:44px;margin:0;padding:10px 16px;border:1px solid #1d1d1f;border-radius:980px;background:#1d1d1f;color:#fff;font:inherit;font-size:14px;font-weight:500;cursor:pointer}',
    '.ipc-btn-secondary{background:#fff;color:#1d1d1f}',
    '.ipc-btn:focus-visible,.ipc-switch:focus-visible,.ipc-close:focus-visible,.ipc-reopen:focus-visible{outline:2px solid #0071e3;outline-offset:2px}',
    '.ipc-overlay{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.45)}',
    '.ipc-overlay[hidden],.ipc-reopen[hidden]{display:none}',
    '.ipc-dialog{position:relative;width:100%;max-width:520px;max-height:calc(100vh - 32px);overflow:auto;padding:24px;background:#fff;border-radius:16px}',
    '.ipc-dialog h2{margin:0 40px 8px 0;font-size:20px;font-weight:600;line-height:1.3}',
    '.ipc-intro{margin:0 0 16px;font-size:14px;color:#424245}',
    '.ipc-cat{padding:14px 0;border-top:1px solid #e5e5ea}',
    '.ipc-cat-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0;font-weight:600}',
    'label.ipc-cat-head{cursor:pointer}',
    '.ipc-cat p{margin:6px 0 0;font-size:13px;color:#6e6e73}',
    '.ipc-always{font-size:13px;font-weight:500;color:#6e6e73}',
    '.ipc-switch{-webkit-appearance:none;appearance:none;position:relative;flex:none;width:44px;height:26px;margin:0;padding:0;border:0;border-radius:13px;background:#d2d2d7;cursor:pointer;transition:background .2s}',
    '.ipc-switch::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}',
    '.ipc-switch:checked{background:#1d1d1f}',
    '.ipc-switch:checked::after{transform:translateX(18px)}',
    '.ipc-close{position:absolute;top:12px;right:12px;width:36px;height:36px;padding:0;border:0;border-radius:50%;background:#f5f5f7;color:#1d1d1f;font-size:22px;line-height:1;cursor:pointer}',
    '.ipc-reopen{position:fixed;left:16px;bottom:16px;z-index:2147482999;display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border:1px solid #d2d2d7;border-radius:50%;background:#fff;box-shadow:0 2px 10px rgba(0,0,0,.15);color:#1d1d1f;cursor:pointer}',
    '.ipc-form-consent{margin-top:12px}',
    '.ipc-form-consent label{display:flex;align-items:flex-start;gap:8px;margin:8px 0 0;font-size:13px;line-height:1.4}',
    '.ipc-form-consent input[type=checkbox]{flex:none;width:auto;margin:2px 0 0;padding:0}',
    '@media (prefers-reduced-motion:reduce){.ipc-switch,.ipc-switch::after{transition:none}}'
  ].join('\n');

  var COOKIE_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>' +
    '<path d="M8.5 8.5v.01M16 15.5v.01M12 12v.01M11 17v.01M7 14v.01"/></svg>';

  var banner, overlay, reopen, lastFocus;

  function fromHtml(html) {
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    return wrap.firstElementChild;
  }

  function buildBanner() {
    var nouns = CONFIG.categories.map(function (cat) { return CATEGORIES[cat].noun; });
    return fromHtml(
      '<div class="ipc-banner" role="region" aria-label="Aviso de cookies">' +
        '<p class="ipc-title">Usamos cookies</p>' +
        '<p class="ipc-text">Usamos cookies necesarias para que el sitio funcione y, solo si lo ' +
          'aceptás, cookies ' + nouns.join(' y ') + '. Podés cambiar tu elección cuando quieras. ' +
          '<a href="' + CONFIG.policyUrl + '#cookies">Política de cookies</a></p>' +
        '<div class="ipc-actions">' +
          '<button type="button" class="ipc-btn ipc-btn-secondary" data-ipc="settings">Configurar</button>' +
          '<button type="button" class="ipc-btn" data-ipc="reject">Rechazar</button>' +
          '<button type="button" class="ipc-btn" data-ipc="accept">Aceptar</button>' +
        '</div>' +
      '</div>');
  }

  function buildPanel() {
    var cats = CONFIG.categories.map(function (cat) {
      return '<div class="ipc-cat">' +
        '<label class="ipc-cat-head">' + CATEGORIES[cat].title +
          '<input type="checkbox" role="switch" class="ipc-switch" data-ipc-cat="' + cat + '">' +
        '</label>' +
        '<p>' + CATEGORIES[cat].text + '</p>' +
      '</div>';
    }).join('');

    return fromHtml(
      '<div class="ipc-overlay" hidden>' +
        '<div class="ipc-dialog" role="dialog" aria-modal="true" aria-labelledby="ipc-dialog-title">' +
          '<h2 id="ipc-dialog-title">Configuración de cookies</h2>' +
          '<p class="ipc-intro">Elegí qué cookies permitís. Las necesarias no se pueden desactivar ' +
            'porque el sitio no funciona sin ellas. ' +
            '<a href="' + CONFIG.policyUrl + '#cookies">Más información</a></p>' +
          '<div class="ipc-cat">' +
            '<div class="ipc-cat-head">Necesarias <span class="ipc-always">Siempre activas</span></div>' +
            '<p>Hacen funcionar el sitio y guardan tu elección sobre cookies. No requieren consentimiento.</p>' +
          '</div>' +
          cats +
          '<div class="ipc-actions">' +
            '<button type="button" class="ipc-btn" data-ipc="reject">Rechazar todas</button>' +
            '<button type="button" class="ipc-btn ipc-btn-secondary" data-ipc="save">Guardar selección</button>' +
            '<button type="button" class="ipc-btn" data-ipc="accept">Aceptar todas</button>' +
          '</div>' +
          '<button type="button" class="ipc-close" data-ipc="close" aria-label="Cerrar">&times;</button>' +
        '</div>' +
      '</div>');
  }

  function openPanel() {
    if (!overlay) return;
    lastFocus = document.activeElement;
    // Nada pré-marcado: o switch só aparece ligado se o visitante já aceitou antes.
    overlay.querySelectorAll('[data-ipc-cat]').forEach(function (input) {
      input.checked = !!granted[input.getAttribute('data-ipc-cat')];
    });
    overlay.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onDialogKey);
    overlay.querySelector('.ipc-close').focus();
  }

  function closePanel() {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onDialogKey);
    var target = lastFocus && document.contains(lastFocus) ? lastFocus : reopen && !reopen.hidden ? reopen : null;
    if (target) target.focus();
  }

  // Esc fecha; Tab fica preso dentro do diálogo.
  function onDialogKey(e) {
    if (e.key === 'Escape') { closePanel(); return; }
    if (e.key !== 'Tab') return;
    var items = overlay.querySelectorAll('a[href], button, input');
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function onAction(action) {
    if (action === 'accept') save(choiceForAll(true));
    else if (action === 'reject') save(choiceForAll(false));
    else if (action === 'settings') openPanel();
    else if (action === 'close') closePanel();
    else if (action === 'save') {
      var choice = {};
      overlay.querySelectorAll('[data-ipc-cat]').forEach(function (input) {
        choice[input.getAttribute('data-ipc-cat')] = input.checked;
      });
      save(choice);
    }
  }

  // --- Aviso de privacidade nos formulários de lead (art. 13 da Lei 18.331) -----
  function addFormConsent(form) {
    if (form.querySelector('[name="acepta_privacidad"]')) return;
    var block = fromHtml(
      '<div class="ipc-form-consent">' +
        '<label><input type="checkbox" name="acepta_privacidad" value="si" required> ' +
          '<span>Leí y acepto la <a href="' + CONFIG.policyUrl + '" target="_blank" rel="noopener">' +
          'Política de Privacidad</a>. Usaremos estos datos para responder tu consulta.</span></label>' +
        '<label><input type="checkbox" name="acepta_comunicaciones" value="si"> ' +
          '<span>Quiero recibir novedades y ofertas de iPlace (opcional).</span></label>' +
        '<input type="hidden" name="politica_version" value="' + CONFIG.version + '">' +
      '</div>');
    var submit = form.querySelector('[type="submit"], button:not([type])');
    if (submit) submit.parentNode.insertBefore(block, submit);
    else form.appendChild(block);
  }

  function init() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Botão flutuante só quando a página não tem o próprio link "Configuración de cookies".
    var pageHasLink = !!document.querySelector('[data-cookie-settings]');
    overlay = buildPanel();
    document.body.appendChild(overlay);
    if (!pageHasLink) {
      reopen = fromHtml('<button type="button" class="ipc-reopen" data-cookie-settings ' +
        'aria-label="Configuración de cookies" title="Configuración de cookies">' + COOKIE_ICON + '</button>');
      reopen.hidden = !hasChoice;
      document.body.appendChild(reopen);
    }
    if (!hasChoice) {
      banner = buildBanner();
      document.body.appendChild(banner);
    }

    document.addEventListener('click', function (e) {
      var action = e.target.closest('[data-ipc]');
      if (action) { onAction(action.getAttribute('data-ipc')); return; }
      if (e.target === overlay) { closePanel(); return; }
      if (e.target.closest('[data-cookie-settings]')) { e.preventDefault(); openPanel(); }
    });

    document.querySelectorAll('form[data-lead-form]').forEach(addFormConsent);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.iplaceConsent = {
    get: function (cat) { return !!granted[cat]; },
    onGrant: onGrant,
    open: openPanel
  };
})();
