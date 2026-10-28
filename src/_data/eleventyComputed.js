// Dados estruturados (schema.org) de cada página, lidos pelo Google e por assistentes de IA.
// O layout imprime o resultado em <script type="application/ld+json">.
// Tipo da página: front matter `schemaType` (AboutPage, ContactPage...); com `faq`, vira FAQPage.
export default {
  jsonLd(data) {
    const { site, page } = data;
    if (!site || !page || page.outputFileExtension !== 'html' || data.noindex) return null;

    const abs = (url) => new URL(url, site.url).href;
    const home = abs('/');
    const pageUrl = abs(page.url);

    const organization = {
      '@type': 'Organization',
      '@id': `${home}#organization`,
      name: site.name,
      alternateName: ['iPlace Corporativo Uruguay', 'iPlace Corp UY'],
      url: home,
      logo: {
        '@type': 'ImageObject',
        '@id': `${home}#logo`,
        url: abs('/assets/img/brand/logo-iplace-corporativo.png'),
        width: 512,
        height: 512,
        caption: site.name,
      },
      image: { '@id': `${home}#logo` },
      description: site.description,
      email: site.footerEmail,
      areaServed: { '@type': 'Country', name: 'Uruguay' },
      address: { '@type': 'PostalAddress', addressCountry: 'UY' },
      parentOrganization: {
        '@type': 'Organization',
        name: 'iPlace',
        parentOrganization: { '@type': 'Organization', name: 'Grupo Herval' },
      },
      knowsAbout: [
        'Apple para empresas', 'Mac', 'iPad', 'iPhone', 'Apple Watch', 'AirPods',
        'Apple Business Manager', 'Gestión de dispositivos móviles (MDM)',
        'Migración de Windows a Mac', 'Recompra de equipos', 'Leasing operacional',
      ],
      contactPoint: site.people.map((p) => ({
        '@type': 'ContactPoint',
        contactType: 'sales',
        name: p.name,
        telephone: p.phone.replace(/\s/g, ''),
        email: p.email,
        areaServed: 'UY',
        availableLanguage: 'es',
      })),
      sameAs: site.social.map((s) => s.url),
    };

    const website = {
      '@type': 'WebSite',
      '@id': `${home}#website`,
      url: home,
      name: site.name,
      alternateName: 'iPlace Corporativo Uruguay',
      description: site.description,
      inLanguage: site.lang,
      publisher: { '@id': organization['@id'] },
    };

    const webPage = {
      '@type': data.faq ? 'FAQPage' : data.schemaType || 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: data.seoTitle || data.title || site.name,
      description: data.description,
      inLanguage: site.lang,
      isPartOf: { '@id': website['@id'] },
      about: { '@id': organization['@id'] },
      primaryImageOfPage: { '@type': 'ImageObject', url: abs(data.ogImage || '/assets/img/og-default.jpg') },
      dateModified: page.date.toISOString(),
    };
    if (data.faq) {
      webPage.mainEntity = data.faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      }));
    }

    const graph = [organization, website, webPage];

    // Migalhas: Inicio > seção do menu > página (as mesmas do topo das páginas internas).
    if (page.url !== '/') {
      const crumbs = [{ name: 'Inicio', url: '/' }];
      const parent = site.nav.find((item) => page.url !== item.url && page.url.startsWith(item.url));
      if (parent) crumbs.push({ name: parent.label, url: parent.url });
      crumbs.push({ name: data.title, url: page.url });
      webPage.breadcrumb = { '@id': `${pageUrl}#breadcrumb` };
      graph.push({
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.url) })),
      });
    }

    return { '@context': 'https://schema.org', '@graph': graph };
  },
};
