// Status vocabulary from the Codebook. Each badge has a text label and a
// distinct visual style; red ("tone-severe") is reserved for Sentenced and
// Convicted at trial. Acquitted / Dismissed use a strong, equally prominent style.
export const DEFENDANT_STATUSES = {
  'Charged - pending': { tone: 'neutral', def: 'Charged; no plea or plea not reported.' },
  'Pleaded not guilty - awaiting trial': { tone: 'blue', def: 'Not-guilty plea entered; case continuing.' },
  'Pleaded guilty - awaiting sentence': { tone: 'amber', def: 'Guilty plea; sentencing scheduled.' },
  'Pleaded guilty - sentence not confirmed': { tone: 'amber-outline', def: 'Guilty plea; scheduled sentencing outcome not found in public sources.' },
  'Sentenced': { tone: 'severe', def: 'Sentence imposed.' },
  'Convicted at trial': { tone: 'severe', def: 'Found guilty at trial; sentence pending.' },
  'Acquitted': { tone: 'cleared', def: 'Found not guilty.' },
  'Dismissed': { tone: 'cleared', def: 'Charges dismissed or dropped.' },
  'Fugitive': { tone: 'violet', def: 'Charged but not in custody.' },
};

export const CASE_STATUSES = {
  'Charged - pending': { tone: 'neutral', def: 'At least one defendant charged; nothing resolved yet.' },
  'Partially resolved': { tone: 'amber', def: 'Some defendants resolved (plea, sentence), others pending.' },
  'Resolved': { tone: 'blue', def: 'All defendants resolved.' },
  'Seizure - no charges yet': { tone: 'outline', def: 'Hardware seized; no one charged yet.' },
};

export const toneFor = (status) =>
  (DEFENDANT_STATUSES[status] || CASE_STATUSES[status] || { tone: 'neutral' }).tone;

export const isCleared = (status) => status === 'Acquitted' || status === 'Dismissed';
