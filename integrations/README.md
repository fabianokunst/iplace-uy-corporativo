# Integrações — iPlace Corporativo UY (site estático)

Réplica dos serviços de terceiros do WordPress atual (`iplacecorp.com.uy`), levantados em 28/10/2026.

## Como incluir

Em todas as páginas, dentro do `<head>`, nesta ordem:

```html
<script src="/integrations/consent.js"></script>
<script src="/integrations/integrations.js"></script>
```

E no rodapé, um link para o visitante mudar a escolha de cookies:

```html
<a href="#" data-cookie-settings>Configuración de cookies</a> · <a href="/politica-de-privacidad/">Política de Privacidad</a>
```

Não use o `<noscript>` do GTM: sem JavaScript não há como pedir consentimento, e a lei uruguaia exige consentimento prévio (ver "Cookies e privacidade").

Em `localhost`, `*.localhost`, `*.test` e `file://` as tags carregam, mas o envio ao Google Analytics fica bloqueado.

## Formulário de contato

Qualquer `<form data-lead-form="ID">` é tratado pelo script. Use estes nomes de campo:
`name`, `email`, `company_name`, `mobile_phone`, `message` (outros campos também são enviados).
Um elemento `[data-lead-status]` dentro do form recebe a mensagem de retorno, e o form ganha
`data-state="sending|sent|error"` para estilização.

Destino do lead, por ordem de prioridade (configurar em `integrations.js` ou via `window.IPLACE_INTEGRATIONS`):

| Configuração | Destino |
|---|---|
| `rdPublicToken` | RD Station Marketing (API de conversões, `conversion_identifier` = ID do form). Campos fora do padrão RD vão como `cf_<nome>` e precisam existir na conta. |
| `leadEndpoint` | POST JSON para qualquer serviço (Formspree, Getform, backend próprio), com UTMs. |
| nenhum (padrão) | Abre o WhatsApp `+598 96 438 030` com a mensagem pronta. |

Todo envio bem-sucedido dispara `generate_lead` (GA4) e `lead_submit` (dataLayer, para gatilhos no GTM).

O `consent.js` acrescenta a cada form, antes do botão de envio, o aceite obrigatório da Política de Privacidade
(`acepta_privacidad=si`), o opt-in opcional de comunicações (`acepta_comunicaciones=si`) e a versão da política aceita
(`politica_version`). Esses campos seguem com o lead; no RD Station chegam como `cf_*` e precisam ser criados na conta.
Se o form já tiver um campo `acepta_privacidad`, nada é acrescentado.

Teste: `integrations/demo.html`, `demo.html?leadEndpoint=URL` ou `demo.html?rdPublicToken=TOKEN`.

## Status dos serviços

| Serviço no WordPress | Status no estático |
|---|---|
| Google Tag Manager `GTM-MWCB764` (tag GA4 `G-XXFDQFJ3QX`) | Replicado |
| GA4 `G-JE1WMSCC61` (gtag direto) | Replicado |
| Universal Analytics `UA-116178824-3` | Não replicado: o Google desativou o UA em 2023/2024 |
| RD Station Forms (`uruguay_contato-…`, `contenidos-uy-…`) | Não replicável: os formulários retornam 404 no RD; substituído por `data-lead-form` |
| RD Station tracking (loader `e2874e7e-…`) | Não replicado: o script está vazio desde 06/03/2024 |
| MonsterInsights | Não replicado: nunca foi configurado |
| WooCommerce (atribuição de pedidos) | Não replicado: o carrinho não é usado; UTMs agora vão com o lead |
| Busca interna do WordPress (`?s=`) | Não existe no estático |
| WhatsApp, e-mails (`mailto:`), Instagram, Facebook, LinkedIn | Links estáticos, funcionam como estão |
| Emarsys | Não existe no site corporativo (só na loja `iplace.com.uy`) |

## Cookies e privacidade (Uruguai)

O site segue a Lei 18.331 (e Lei 19.670, Decretos 414/009 e 64/020). Diferente da LGPD, ela não tem "legítimo
interesse" como base geral: analytics e publicidade só com consentimento prévio e expresso.

**O que o código já faz** (`consent.js` + página `src/politica-de-privacidad.njk`):

- Banner com "Aceptar", "Rechazar" (mesmo peso visual) e "Configurar"; nenhuma opção vem pré-marcada.
- GTM e GA4 só carregam depois do aceite; Google Consent Mode v2 começa com tudo `denied`.
- A escolha fica no cookie `iplace_consent` (categorias, versão da política, data) por 12 meses.
- Revogar apaga os cookies `_ga*` e envia `consent update` ao Google.
- O visitante reabre as preferências por qualquer `[data-cookie-settings]`; sem esse link, aparece um botão flutuante.
- Evento `cookie_consent_update` no dataLayer para gatilhos no GTM.

**Ao mudar cookies ou fornecedores:** atualize a política (seções 6 e 10 e a data) e a `version` no `consent.js`
(isso pede o consentimento de novo a todos). Para tags de publicidade (Google Ads, Meta), ative a categoria
`marketing` com `window.IPLACE_CONSENT = { categories: ['analytics', 'marketing'] }` antes do `consent.js`.

**No GTM (`GTM-MWCB764`):** em Admin > Configurações do container, ative "Visão geral do consentimento". Na tag GA4
`G-XXFDQFJ3QX`, marque "Exigir consentimento adicional" com `analytics_storage`. Toda tag nova que não seja do Google
precisa da mesma configuração (`ad_storage` para publicidade).

**Pendências antes de publicar** (jurídico/responsável pelos dados):

1. Confirmar os dados da política (29/10/2026): responsável Situal S.A., RUT 21.860626.0019, Héctor Miranda 2361
   of. 102 e `contacto@iplace.com.uy`, tirados do rodapé e da política de `iplace.com.uy`. A conservação está por
   critério, sem prazo fixo. Se `rdPublicToken` ou `leadEndpoint` for configurado, incluir o serviço na política.
2. Registrar a base de dados de contatos/leads na URCDP (art. 28) e acrescentar o número na política. Não existe equivalente na LGPD.
3. Transferência internacional (art. 23): Google, WhatsApp e Oracle Responsys (EUA) e Hostinger (servidor no Brasil). Confirmar se o país é
   considerado adequado pela URCDP; se não, usar cláusulas contratuais.
4. Procedimento interno para notificar incidentes à URCDP em até 72 horas (Decreto 64/020).
5. Verificar se a empresa precisa nomear Delegado de Proteção de Dados (Decreto 64/020).
6. Atender pedidos de acesso e retificação em até 5 dias úteis (arts. 14 e 15).
7. Só enviar comunicações de marketing a leads com `acepta_comunicaciones=si`.
