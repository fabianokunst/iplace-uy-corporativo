// Eleventy só junta cabeçalho, rodapé e blocos repetidos; o resultado em _site/ é HTML puro.
import { HtmlBasePlugin } from '@11ty/eleventy';

export default function (eleventyConfig) {
  // Prefixa os links "/..." quando o build roda com --pathprefix (preview no GitHub Pages).
  // Sem o parâmetro, o prefixo é "/" e o HTML sai igual ao do domínio.
  eleventyConfig.addPlugin(HtmlBasePlugin);

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

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    templateFormats: ['njk'],
    htmlTemplateEngine: 'njk',
  };
}
