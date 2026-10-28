// Filtros do llms.txt e do llms-full.txt (texto do site para assistentes de IA).

// Páginas na ordem do menu: início, cada seção do menu seguida das suas subpáginas, depois o resto.
export function navOrder(pages, nav) {
  const rank = (url) => {
    if (url === '/') return -1;
    const i = nav.findIndex((item) => url.startsWith(item.url));
    return i === -1 ? nav.length : i;
  };
  return [...pages].sort((a, b) => rank(a.url) - rank(b.url) || a.url.localeCompare(b.url));
}

// Tira do HTML um elemento inteiro (com os filhos), contando aberturas e fechamentos da mesma tag.
function removeElements(html, test) {
  const open = /<([a-z][a-z0-9]*)\b[^>]*>/gi;
  let out = '';
  let last = 0;
  let m;
  while ((m = open.exec(html))) {
    if (!test(m[1].toLowerCase(), m[0])) continue;
    const tag = m[1];
    const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    re.lastIndex = m.index + m[0].length;
    let depth = 1;
    let end = html.length;
    let t;
    while (depth && (t = re.exec(html))) {
      if (t[1]) depth -= 1;
      else if (!t[0].endsWith('/>')) depth += 1;
      if (!depth) end = t.index + t[0].length;
    }
    out += html.slice(last, m.index);
    last = end;
    open.lastIndex = end;
  }
  return out + html.slice(last);
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (e, n) => ENTITIES[n.toLowerCase()] ?? e);

const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i')) || [])[1];
const inline = (html) => decode(html.replace(/<img\b[^>]*>/gi, (t) => attr(t, 'alt') || '').replace(/<[^>]+>/g, ''))
  .replace(/\s+/g, ' ').trim();

// Conteúdo de uma página (HTML gerado, sem o layout) em Markdown. Links viram absolutos no domínio.
export function htmlToMarkdown(html, pageUrl, siteUrl) {
  const base = new URL(pageUrl || '/', siteUrl);
  let s = html.replace(/<!--[\s\S]*?-->/g, '');
  // Fora do texto: código, ícones, formulários, botões, menus/migalhas e enfeites aria-hidden.
  s = removeElements(s, (name, tag) =>
    ['script', 'style', 'svg', 'form', 'button', 'select', 'label', 'template', 'noscript', 'nav'].includes(name)
    || / aria-hidden="true"/.test(tag)
    || (name === 'ul' && /class="social"/.test(tag)));

  s = s.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, inner) => `\n\n${'#'.repeat(n)} ${inline(inner)}\n\n`);
  s = s.replace(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gi, (_, inner) => `\n\n**${inline(inner)}**\n\n`);
  s = s.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, attrs, inner) => {
    const text = inline(inner);
    const href = attr(attrs, 'href');
    if (!text) return '';
    if (!href || href.startsWith('#')) return text;
    return `[${text}](${new URL(href, base).href})`;
  });
  // Com espaço em volta: no HTML o destaque às vezes vem colado ao texto e só o CSS separa.
  s = s.replace(/<(strong|b)\b[^>]*>/gi, ' **').replace(/<\/(strong|b)>/gi, '** ');
  s = s.replace(/<li\b[^>]*>/gi, '\n- ');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/?(p|div|section|article|header|footer|main|aside|ul|ol|li|details|figure|figcaption|blockquote|table|tr|nav)\b[^>]*>/gi, '\n\n');
  s = s.replace(/<\/?(td|th)\b[^>]*>/gi, ' ');
  s = decode(s.replace(/<[^>]+>/g, ''));

  return s
    .replace(/\)\[/g, ') · [')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter((line) => line !== '-')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^- (.*)\n\n(?=- )/gm, '- $1\n')
    .trim();
}
