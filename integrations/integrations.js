/*
 * iPlace Corporativo UY — integrações de terceiros do site estático.
 * Réplica do que o WordPress (iplacecorp.com.uy) carregava:
 *   GTM-MWCB764   Google Tag Manager (contém a tag Google GA4 G-XXFDQFJ3QX)
 *   G-JE1WMSCC61  GA4 via gtag direto (antes pelo plugin "GA Google Analytics")
 *   RD Station    formulários de lead (hoje retornam 404) -> <form data-lead-form>
 *
 * Uso, no <head> de todas as páginas (consent.js sempre antes):
 *   <script src="/integrations/consent.js"></script>
 *   <script src="/integrations/integrations.js"></script>
 * GTM e GA4 só carregam depois que o visitante aceita as cookies (Lei 18.331 do Uruguai).
 * Para sobrescrever a configuração, defina window.IPLACE_INTEGRATIONS antes deste script.
 */
(function () {
  'use strict';

  var CONFIG = Object.assign({
    gtmId: 'GTM-MWCB764',
    ga4Id: 'G-JE1WMSCC61',
    // IDs que recebem hits; bloqueados em localhost para não poluir os relatórios.
    analyticsIds: ['G-JE1WMSCC61', 'G-XXFDQFJ3QX', 'UA-9794176-27'],
    // Token público do RD Station Marketing. Vazio = desativado.
    rdPublicToken: '',
    // Qualquer endpoint que aceite POST JSON (Formspree, Getform, backend próprio).
    leadEndpoint: '',
    // Sem RD nem endpoint, o formulário abre o WhatsApp com a mensagem pronta.
    whatsappNumber: '59896438030'
  }, window.IPLACE_INTEGRATIONS);

  var isDev = location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|\[::1\])$|\.(localhost|test)$/.test(location.hostname);

  // --- Google Tag Manager + GA4 (só com consentimento, ver consent.js) --------
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  var gtag = window.gtag;

  if (isDev) {
    CONFIG.analyticsIds.forEach(function (id) { window['ga-disable-' + id] = true; });
    console.info('[integrations] ambiente local: tags carregadas, envio ao Google Analytics bloqueado.');
  }

  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function loadGtm() {
    if (!CONFIG.gtmId) return;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    loadScript('https://www.googletagmanager.com/gtm.js?id=' + CONFIG.gtmId);
  }

  function loadGa4() {
    if (!CONFIG.ga4Id) return;
    gtag('js', new Date());
    gtag('config', CONFIG.ga4Id);
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4Id);
  }

  var consent = window.iplaceConsent;
  if (consent) {
    consent.onGrant('analytics', loadGa4);
    // As tags dentro do GTM seguem o Consent Mode que o consent.js define por categoria.
    consent.onGrant(['analytics', 'marketing'], loadGtm);
  } else {
    console.error('[integrations] consent.js não foi carregado antes deste script: GTM e GA4 desativados.');
  }

  // --- Origem do tráfego (UTM), anexada aos leads -----------------------------
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var utm = {};
  try { utm = JSON.parse(sessionStorage.getItem('iplace_utm')) || {}; } catch (e) {}
  var params = new URLSearchParams(location.search);
  if (params.has('utm_source')) {
    utm = {};
    UTM_KEYS.forEach(function (k) { if (params.get(k)) utm[k] = params.get(k); });
    try { sessionStorage.setItem('iplace_utm', JSON.stringify(utm)); } catch (e) {}
  }

  // --- Formulários de lead: <form data-lead-form="contacto-uy"> ---------------
  // Campos padrão do RD Station; os demais vão como campo personalizado cf_*.
  var RD_FIELDS = ['name', 'email', 'company_name', 'job_title', 'mobile_phone',
    'personal_phone', 'city', 'state', 'country', 'website'];

  function post(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
  }

  function sendToRd(id, fields) {
    var payload = {
      conversion_identifier: id,
      traffic_source: utm.utm_source,
      traffic_medium: utm.utm_medium,
      traffic_campaign: utm.utm_campaign
    };
    Object.keys(fields).forEach(function (k) {
      var isKnown = RD_FIELDS.indexOf(k) > -1 || k.indexOf('cf_') === 0;
      payload[isKnown ? k : 'cf_' + k] = fields[k];
    });
    return post('https://api.rd.services/platform/conversions?api_key=' +
      encodeURIComponent(CONFIG.rdPublicToken),
      { event_type: 'CONVERSION', event_family: 'CDP', payload: payload });
  }

  function whatsappUrl(fields) {
    var lines = ['Hola, soy ' + (fields.name || '') +
      (fields.company_name ? ' de ' + fields.company_name : '') + '.'];
    if (fields.message) lines.push(fields.message);
    if (fields.email) lines.push('Email: ' + fields.email);
    if (fields.mobile_phone) lines.push('Tel: ' + fields.mobile_phone);
    return 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function setStatus(form, state, html) {
    form.setAttribute('data-state', state);
    var el = form.querySelector('[data-lead-status]');
    if (el) el.innerHTML = html;
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.matches || !form.matches('form[data-lead-form]')) return;
    e.preventDefault();

    var id = form.getAttribute('data-lead-form');
    var fields = {};
    new FormData(form).forEach(function (v, k) { if (String(v).trim()) fields[k] = String(v).trim(); });
    // Nome e sobrenome vêm em campos separados; RD Station e WhatsApp usam o nome completo.
    if (!fields.name && fields.first_name) {
      fields.name = [fields.first_name, fields.last_name].filter(Boolean).join(' ');
    }
    var method = CONFIG.rdPublicToken ? 'rdstation' : CONFIG.leadEndpoint ? 'endpoint' : 'whatsapp';
    var track = function () {
      gtag('event', 'generate_lead', { form_id: id, lead_method: method });
      window.dataLayer.push({ event: 'lead_submit', form_id: id, lead_method: method });
    };

    if (method === 'whatsapp') {
      window.open(whatsappUrl(fields), '_blank', 'noopener');
      track();
      setStatus(form, 'sent', 'Abrimos WhatsApp con tu mensaje. ¡Gracias!');
      return;
    }

    setStatus(form, 'sending', 'Enviando…');
    var request = method === 'rdstation'
      ? sendToRd(id, fields)
      : post(CONFIG.leadEndpoint, Object.assign({ form_id: id }, utm, fields));
    request.then(function () {
      track();
      form.reset();
      setStatus(form, 'sent', '¡Gracias! Te contactaremos a la brevedad.');
    }, function () {
      setStatus(form, 'error', 'No pudimos enviar el formulario. <a href="' + whatsappUrl(fields) +
        '" target="_blank" rel="noopener">Escribinos por WhatsApp</a>.');
    });
  });
})();
