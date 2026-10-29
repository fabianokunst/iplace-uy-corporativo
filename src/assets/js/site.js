// Comportamento do site: menu mobile, vídeo sob demanda e movimento (cabeçalho, revelação, atalhos).
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

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cabeçalho mais leve depois que a página rola. A barra de progresso é CSS scroll-driven;
  // aqui só o reserva para navegadores sem animation-timeline.
  var progress = document.querySelector('.scroll-progress');
  var needsProgress = progress && !reduceMotion && !(window.CSS && CSS.supports('animation-timeline: scroll()'));
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (needsProgress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--progress', max > 0 ? Math.min(y / max, 1) : 0);
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Revelação: blocos abaixo da dobra entram quando chegam à tela (site.css, "Revelação").
  // O que já está visível ao carregar fica como está; sem JS ou com movimento reduzido, nada é escondido.
  // Listas (checklist, especialistas) revelam item a item, por isso o contêiner fica de fora.
  var REVEAL = '.section__head, .media-split__copy > :not(.checklist):not(.people), .media-split__media, .prose-cols > *, '
    + '.checklist li, .person, .feature, .tile, .line, .product-row, .cta-band, .form-card, .partners > *, .line-nav li, .social';
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        revealer.unobserve(el);
        var delay = Math.min(batch++, 5) * 90;
        el.style.setProperty('--reveal-delay', delay + 'ms');
        el.classList.add('is-in');
        // Terminada a entrada, o elemento volta às próprias transições (hover dos cartões).
        setTimeout(function () {
          el.classList.remove('reveal', 'reveal--media', 'is-in');
          el.style.removeProperty('--reveal-delay');
        }, delay + 1900);
      });
    }, { rootMargin: '0px 0px -12% 0px' });

    var fold = window.innerHeight;
    document.querySelectorAll(REVEAL).forEach(function (el) {
      if (el.closest('.hero, .page-hero') || el.parentElement.closest('.reveal')) return;
      if (el.getBoundingClientRect().top < fold) return;
      el.classList.add('reveal');
      if (el.matches('.media-split__media:not(.media-split__media--contain)')) el.classList.add('reveal--media');
      revealer.observe(el);
    });
  }

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

  // Luz que segue o cursor nos cartões e na faixa escura (site.css usa --mx/--my).
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.tile, .feature, .person, .cta-band--dark');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  // Os comparadores têm script próprio: assets/js/compare.js.
})();
