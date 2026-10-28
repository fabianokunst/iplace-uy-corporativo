// Comportamento do site: menu mobile, vídeo sob demanda e seletores dos comparadores.
(function () {
  'use strict';

  // Menu mobile
  var header = document.querySelector('.site-header');
  var toggle = header && header.querySelector('.site-header__toggle');
  if (toggle) {
    var setOpen = function (open) {
      header.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      toggle.querySelector('use').setAttribute('href', open ? '#i-fechar' : '#i-menu');
    };
    toggle.addEventListener('click', function () { setOpen(!header.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && header.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 960px)').addEventListener('change', function (e) { if (e.matches) setOpen(false); });
  }

  // Vídeo do YouTube: só carrega (e só fala com o YouTube) quando o visitante clica.
  document.querySelectorAll('[data-youtube]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + btn.getAttribute('data-youtube') + '?autoplay=1&rel=0';
      iframe.title = btn.getAttribute('aria-label') || 'Video';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      var frame = document.createElement('div');
      frame.className = 'video';
      frame.appendChild(iframe);
      btn.replaceWith(frame);
    }, { once: true });
  });

  // Comparadores: cada coluna troca de modelo pelo <select>. Sem JS, ficam os modelos padrão.
  document.querySelectorAll('[data-compare]').forEach(function (root) {
    var data = JSON.parse(root.querySelector('script[type="application/json"]').textContent);
    var byId = {};
    data.models.forEach(function (m) { byId[m.id] = m; });

    function fillCell(el, values) {
      el.textContent = '';
      (values || ['—']).forEach(function (v) {
        var span = document.createElement('span');
        span.textContent = v;
        if (v === '—') { span.className = 'muted'; span.setAttribute('aria-label', 'No aplicable'); }
        el.appendChild(span);
      });
    }

    function render(col, id) {
      var m = byId[id];
      root.querySelectorAll('[data-col="' + col + '"]').forEach(function (el) {
        var kind = el.getAttribute('data-kind');
        if (kind === 'head') {
          var img = el.querySelector('img');
          if (img) {
            if (m.image) { img.src = m.image; img.alt = m.name; img.hidden = false; } else { img.hidden = true; }
          }
          el.querySelector('.compare__name').textContent = m.name;
          var price = el.querySelector('.compare__price');
          if (price) price.textContent = m.price || '';
          var buy = el.querySelector('[data-buy]');
          if (buy) {
            buy.hidden = !(m.buyUrl && m.available !== false);
            if (m.buyUrl) buy.href = m.buyUrl;
          }
        } else if (kind === 'cell') {
          var s = el.getAttribute('data-s'), r = el.getAttribute('data-r');
          fillCell(el, data.sections[s].rows[r].values[id]);
        }
      });
    }

    root.querySelectorAll('select[data-col]').forEach(function (select) {
      select.addEventListener('change', function () { render(select.getAttribute('data-col'), select.value); });
    });
  });
})();
