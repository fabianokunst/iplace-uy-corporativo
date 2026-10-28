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
npm run build      # gera _site/
```

## Publicar

A cada push na `main`, o GitHub Actions gera o site, publica o preview em
<https://fabianokunst.github.io/iplace-uy-corporativo/> e grava o mesmo HTML na branch **`site`**.

- **Hostinger ou qualquer hospedagem:** no GitHub, troque para a branch `site` > Code > Download ZIP e
  envie o conteúdo da pasta de dentro do ZIP para `public_html` (ou envie o conteúdo de `_site/`).
  Não precisa de Node. Na Hostinger, o recurso Git do hPanel também pode implantar a branch `site` direto.
- Antes da primeira publicação, apague o WordPress do `public_html` (guarde um backup completo).
- O `.htaccess` (redirects do blog, HTTPS) só vale em Apache/LiteSpeed, como a Hostinger. Em outros
  servidores é ignorado e o site funciona igual, só sem esses redirects.

## Ao editar

- Em atributos HTML (`href`, `src`, `srcset`, `action`), escreva links a partir da raiz (`/contacto/`,
  `/assets/img/...`): o build converte. Não use o filtro `url`; dentro de `<script>`, use `| relative`.
- CSS, JS e `manifest.webmanifest` não passam pela conversão: neles, use caminhos relativos ao próprio arquivo.
- `politica-de-privacidad.html` é copiada como está: caminhos relativos e sem `/` no início.
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
| `assets-src/wp-uploads/` | Imagens originais do WordPress. `npm run images` gera os WebP em `src/assets/img/`. |
| `integrations/`, `politica-de-privacidad.html` | Cookies, GTM/GA4, formulários e política. Mantidos por outra frente: ver `integrations/README.md`. |

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
