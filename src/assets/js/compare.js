// Comparadores (/productos/compara-*): cada <select> troca o modelo da sua coluna.
// O HTML já sai com os modelos padrão; aqui só redesenhamos a coluna escolhida.
(function () {
  'use strict';

  var root = document.querySelector('[data-comparator]');
  if (!root) return;

  var data = JSON.parse(root.querySelector('script[type="application/json"]').textContent);
  // Caminhos dos dados começam com "/"; data-base é o caminho relativo até a raiz do site
  // (o build gera links relativos), então "/assets/x" vira "../../assets/x".
  var base = (root.getAttribute('data-base') || '/').replace(/\/$/, '');
  var byId = {};
  data.models.forEach(function (m) { byId[m.id] = m; });

  function asset(path) { return path && path.charAt(0) === '/' ? base + path : path; }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }

  function fillCell(cell, items) {
    cell.textContent = '';
    (items || ['—']).forEach(function (it) {
      if (it && it.icon) {
        cell.appendChild(el('img', { src: asset(it.icon), alt: '', width: it.width, height: it.height, loading: 'lazy' }));
      } else if (it && it.value) {
        cell.appendChild(el('strong', { 'class': 'cmp__value' }, it.value));
      } else if (it === '—') {
        cell.appendChild(el('span', { 'class': 'cmp__na', 'aria-label': 'No aplicable' }, '—'));
      } else {
        cell.appendChild(el('span', null, it));
      }
    });
  }

  function fillHead(head, m) {
    var img = head.querySelector('.cmp__media img');
    img.src = asset(m.image);
    img.alt = m.name;
    img.width = m.imageWidth;
    img.height = m.imageHeight;

    var swatches = head.querySelector('.cmp__swatches');
    swatches.textContent = '';
    (m.colors || []).forEach(function (c) {
      var li = el('li', { title: c.name });
      li.style.background = c.swatch;
      swatches.appendChild(li);
    });
    swatches.setAttribute('aria-label', 'Colores: ' + (m.colors || []).map(function (c) { return c.name; }).join(', '));

    head.querySelector('.cmp__name').textContent = m.name;
    var available = m.available !== false;
    head.querySelector('[data-buy]').hidden = !available;
    head.querySelector('[data-status]').hidden = available;
  }

  function render(col, id) {
    var m = byId[id];
    if (!m) return;
    root.querySelectorAll('[data-col="' + col + '"][data-kind]').forEach(function (node) {
      if (node.getAttribute('data-kind') === 'head') {
        fillHead(node, m);
      } else {
        var s = +node.getAttribute('data-s');
        var r = +node.getAttribute('data-r');
        fillCell(node, data.sections[s].rows[r].values[id]);
      }
    });
  }

  root.querySelectorAll('select[data-col]').forEach(function (select) {
    select.addEventListener('change', function () { render(select.getAttribute('data-col'), select.value); });
    // Ao recarregar ou voltar, o navegador pode restaurar outra escolha no <select>; a coluna acompanha.
    if (!select.options[select.selectedIndex].defaultSelected) render(select.getAttribute('data-col'), select.value);
  });
})();
