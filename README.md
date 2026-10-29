# iPlace Corporativo UY — site estático

Substitui o WordPress de `iplacecorp.com.uy`. Mesmas páginas e URLs, sem o blog.
Visual do **iPlace Uruguai Design System** (classes `ds-*`, tokens `--ds-*`).

## Como funciona

O Eleventy (11ty) só monta o site: junta cabeçalho, rodapé e blocos repetidos de `src/` e gera HTML
puro em `_site/`. Ele roda no computador ou no GitHub Actions; a hospedagem recebe só arquivos
estáticos (HTML, CSS, JS, imagens), sem Node, PHP ou banco de dados.

Os links saem **relativos** (`../contacto/`, `../assets/...`), então o mesmo `_site/` funciona na raiz
de um domínio, numa subpasta ou em qualquer hospedagem estática, sem configurar nada.

```bash
npm install
npm start          # http://localhost:5590, recarrega ao salvar
npm run build      # apaga e gera _site/ do zero
```

## Publicar

A cada push na `main`, o GitHub Actions gera o site, publica o preview em
<https://fabianokunst.github.io/iplace-uy-corporativo/> e grava o mesmo HTML na branch **`site`**.
É a branch `site` que vai para a hospedagem: o que está na `main`, gerado do zero, igual ao preview.
Não envie o `_site/` do computador, que pode ter mudanças ainda fora da `main`.

- Antes da primeira publicação, guarde um backup completo do WordPress e esvazie o `public_html`
  (inclusive o `.htaccess` dele).
- **Hostinger, automático (recomendado):** hPanel > Avançado > Git, repositório
  `https://github.com/fabianokunst/iplace-uy-corporativo.git`, branch `site`, diretório em branco (= `public_html`).
  Depois ative a implantação automática e cadastre a URL do webhook dela no GitHub (Settings > Webhooks):
  cada push na `main` entra no ar sozinho, logo depois do preview.
- **Manual, em qualquer hospedagem:** no GitHub, troque para a branch `site` > Code > Download ZIP, envie e
  extraia no `public_html` e mova o conteúdo da pasta `iplace-uy-corporativo-site/` para a raiz: `index.html` e
  `.htaccess` ficam direto no `public_html`. Não precisa de Node.
- O `.htaccess` (redirects do blog, HTTPS) só vale em Apache/LiteSpeed, como a Hostinger. Em outros
  servidores é ignorado e o site funciona igual, só sem esses redirects.
- Depois de publicar, confira que o `.htaccess` subiu (é arquivo oculto): `http://` e `www.` devem ir para
  `https://iplacecorp.com.uy` e `/blog/` para a home. Teste um endereço inexistente (404) e envie o
  `sitemap.xml` no Search Console.

## Ao editar

- Em atributos HTML (`href`, `src`, `srcset`, `action`), escreva links a partir da raiz (`/contacto/`,
  `/assets/img/...`): o build converte. Não use o filtro `url`; dentro de `<script>`, use `| relative`.
- CSS, JS e `manifest.webmanifest` não passam pela conversão: neles, use caminhos relativos ao próprio arquivo.
- `404.njk` é uma página própria, sem o layout, porque aparece em qualquer endereço (ver o comentário no arquivo).

## Estrutura

| Caminho | O quê |
|---|---|
| `src/*.njk` | Uma página por arquivo. `compara.njk` gera os 4 comparadores. |
| `src/_data/site.json` | Menu, redes, telefones do rodapé e **especialistas** (nome, WhatsApp, e-mail). |
| `src/_data/compare/*.json` | Dados dos comparadores (Mac, iPad, iPhone, Apple Watch). |
| `src/_includes/` | Layout, cabeçalho, rodapé, ícones e macros (`pageHero`, `people`, `leadForm`). |
| `src/assets/css/tokens.css` | Tokens do DS. `ds.css` é o `bundle.css` do DS sem alterações. `site.css` é o do site. |
| `src/static/` | Copiado para a raiz: `.htaccess` (redirects do blog, HTTPS), `robots.txt`. |
| `assets-src/wp-uploads/` | Imagens originais do WordPress usadas pelos scripts (as que o site não usa foram removidas; estão no histórico do Git). |
| `scripts/` | `images.py` (`npm run images`) gera os WebP em `src/assets/img/`; `favicons.py` gera favicon e ícones. Precisam de Python com Pillow. |
| `integrations/` | Cookies, GTM/GA4 e formulários. Mantidos por outra frente: ver `integrations/README.md`. |
| `src/politica-de-privacidad.njk` | Política de Privacidad y Cookies. Ao mudar cookies, fornecedores ou formulários, atualize o texto e a `version` do `consent.js`. |
| `.github/workflows/pages.yml` | Build e publicação a cada push (preview no GitHub Pages e branch `site`). |

## SEO, IA e ícones

- Cada página tem `title` (nome curto, usado nas migalhas) e, se preciso, `seoTitle` (o `<title>` do Google,
  até ~55 caracteres com o " | iPlace Corporativo"). `description` com até ~155 caracteres.
- Dados estruturados (schema.org) saem de `src/_data/eleventyComputed.js`: organização, site, página e migalhas.
  `schemaType` no front matter muda o tipo da página (AboutPage, ContactPage); `faq` vira FAQPage (home).
- `llms.txt` e `llms-full.txt` (resumo e texto completo para assistentes de IA) são gerados das páginas;
  os dados fixos do resumo estão em `src/llms.njk`. `robots.txt` libera buscadores e robôs de IA.
- `sitemap.xml` usa a data do último commit de cada página (`src/src.11tydata.json`).
- O preview no GitHub Pages recebe `noindex` no navegador; o canônico de todas as páginas é `iplacecorp.com.uy`.
- Favicon e ícones: `python scripts/favicons.py` gera `favicon.svg/.ico`, `apple-touch-icon.png` e os ícones do
  `manifest.webmanifest` a partir do anel do logo (sem letras).

## Formulários

- Contato, Soluciones, iPad e newsletter da home usam `<form data-lead-form>`; o envio é do
  `integrations/integrations.js` (hoje abre o WhatsApp; RD Station ou endpoint por configuração).
- Lanzamientos continua postando direto no Responsys (`a.newsiplace.com.uy`), como no WordPress.

## Pendências de conteúdo (confirmar com o time comercial)

- Especialistas: Rodrigo Silvera usa o e-mail `rodrigo.ferullo@`; Marcos de Pena e Rodrigo têm o mesmo número.
- Rodapé tem um telefone do Brasil (`+55 51 4042 1345`).
- Textos desatualizados mantidos como estavam: iPhone 11 / iOS 14 (Productos), AirPods com chip H1,
  e os comparadores (param no iPhone 14 / Apple Watch Series 8).
- "Recompra de equipos" apontava para `iplacecorp.com.br/buyback`, que não existe mais; agora leva ao formulário.
  "Leasing operacional" ainda aponta para a página do Brasil (em português).
- Rodrigo não tem foto (o WordPress usava o logo); o cartão mostra as iniciais.

## Comparadores

- Dados extraídos das 4 páginas do WordPress (92 modelos), sem cortes. Para atualizar, edite
  `src/_data/compare/<família>.json`: cada célula é uma lista de itens — texto (`"\n"` quebra linha),
  `{ "value": "6.1 pulgadas" }` (número em destaque) ou `{ "icon": "...", "width", "height" }`.
- As páginas mostram 3 modelos lado a lado (2 no celular); cada coluna troca pelo seletor (`assets/js/compare.js`).
- "Comprar" leva ao bloco de especialistas da própria página, como no WordPress. Não há preços.
- Os títulos das linhas são só para leitores de tela, como no original; alguns vieram trocados do construtor
  da página (ex.: no Apple Watch, "Tamaño de la caja" guarda resistência ao pó e botão de Ação).
