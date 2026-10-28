# iPlace Corporativo UY — site estático

Substitui o WordPress de `iplacecorp.com.uy`. Mesmas páginas e URLs, sem o blog.
Visual do **iPlace Uruguai Design System** (classes `ds-*`, tokens `--ds-*`).

## Rodar e publicar

```bash
npm install
npm start          # http://localhost:5590, recarrega ao salvar
npm run build      # gera _site/
```

Publicar = enviar **o conteúdo de `_site/`** para `public_html` na Hostinger (inclui `.htaccess`).
Antes, apague o WordPress do `public_html` (guarde um backup completo).

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
