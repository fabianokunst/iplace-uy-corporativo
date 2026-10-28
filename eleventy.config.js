// Eleventy só junta cabeçalho, rodapé e blocos repetidos; o resultado em _site/ é HTML puro.
import { htmlToMarkdown, navOrder } from './src/_config/llms.js';

// Os templates escrevem os links a partir da raiz ("/contacto/", "/assets/..."); o build os converte
// em relativos à página ("../contacto/"). Assim o mesmo _site/ funciona na raiz do domínio, numa
// subpasta (preview do GitHub Pages) ou em qualquer servidor estático, sem configurar nada.
function relativeUrl(url, pageUrl) {
  if (!pageUrl || !url.startsWith('/') || url.startsWith('//')) return url;
  // "/" e "/404.html" → 0 níveis, "/contacto/" → 1, "/productos/ipad-para-empresas/" → 2
  const rel = '../'.repeat(pageUrl.split('/').length - 2) + url.slice(1);
  return rel === '' || /^[?#]/.test(rel) ? `./${rel}` : rel;
}

export default function (eleventyConfig) {
  // href, src, srcset, action etc. de todo HTML gerado. CSS e JS não passam por aqui: neles,
  // use caminhos relativos ao próprio arquivo.
  eleventyConfig.htmlTransformer.addUrlTransform('html', function (url) {
    return relativeUrl(url.trim(), this.url);
  });
  // Para URLs fora de atributos, como dentro de um <script>.
  eleventyConfig.addFilter('relative', function (url) {
    return relativeUrl(url, this.page.url);
  });

  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ 'src/static': '/' });

  // Mantidos pelas sessões de integrações e de privacidade, na raiz do projeto.
  eleventyConfig.addPassthroughCopy({ 'integrations/consent.js': 'integrations/consent.js' });
  eleventyConfig.addPassthroughCopy({ 'integrations/integrations.js': 'integrations/integrations.js' });
  eleventyConfig.addPassthroughCopy({ 'politica-de-privacidad.html': 'politica-de-privacidad.html' });
  eleventyConfig.addWatchTarget('integrations/');
  eleventyConfig.addWatchTarget('politica-de-privacidad.html');

  // Link de WhatsApp com a mensagem padrão do site atual.
  eleventyConfig.addFilter('whatsapp', (number, text) =>
    `https://api.whatsapp.com/send/?phone=${number}&text=${encodeURIComponent(text)}`);

  eleventyConfig.addGlobalData('year', () => new Date().getFullYear());

  eleventyConfig.addFilter('find', (list, key, value) => list.find((item) => item[key] === value));

  // llms.txt e llms-full.txt: páginas na ordem do menu e conteúdo de cada uma em Markdown.
  eleventyConfig.addFilter('navOrder', navOrder);
  eleventyConfig.addFilter('markdown', htmlToMarkdown);

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    templateFormats: ['njk'],
    htmlTemplateEngine: 'njk',
  };
}
