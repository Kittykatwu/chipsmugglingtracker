import { SITE } from '../config.js';
import { asOfDisplay } from './metrics.js';

// Prefix internal links with the base path (needed for GitHub Pages project sites).
export function u(p) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + p;
}

export function citeLine() {
  return `${SITE.author}, ${SITE.name}, ${SITE.displayUrl}, data as of ${asOfDisplay}.`;
}

export function tipMailto(caseId) {
  const subject = caseId ? `Tip or correction: ${caseId}` : 'Tip or correction';
  return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}`;
}

export function datasetJsonLd(siteUrl) {
  const abs = (p) => new URL(u(p), siteUrl).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: SITE.name,
    description:
      'Case-level and defendant-level data on criminal and regulatory enforcement against people and companies accused of diverting advanced AI chips, or servers containing them, to China in violation of export controls.',
    url: abs('/'),
    license: SITE.licenseUrl,
    isAccessibleForFree: true,
    creator: { '@type': 'Person', name: SITE.author },
    keywords: ['export controls', 'AI chips', 'smuggling', 'enforcement', 'Nvidia', 'China'],
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: abs('/data/cases.csv') },
      { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: abs('/data/defendants.csv') },
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: abs('/data/cases.json') },
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: abs('/data/defendants.json') },
    ],
  };
}
