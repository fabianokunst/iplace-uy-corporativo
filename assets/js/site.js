// Comportamento do site: menu mobile, vídeo sob demanda e atalhos de Productos.
// Sem animações de entrada: o DS só anima cor e borda (site.css).
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // Atalhos de Productos: marca a linha que está no meio da tela e centraliza a pílula.
  var subnav = document.querySelector('.subnav');
  if (subnav && 'IntersectionObserver' in window) {
    var links = {};
    var current = null;
    subnav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = entry.isIntersecting && links[entry.target.id];
        if (!link || link === current) return;
        if (current) current.removeAttribute('aria-current');
        link.setAttribute('aria-current', 'true');
        current = link;
        var list = link.closest('ul');
        var delta = link.getBoundingClientRect().left - list.getBoundingClientRect().left;
        list.scrollTo({ left: list.scrollLeft + delta - (list.clientWidth - link.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var target = document.getElementById(id);
      if (target) spy.observe(target);
    });
  }

  // Os comparadores têm script próprio: assets/js/compare.js.
})();
