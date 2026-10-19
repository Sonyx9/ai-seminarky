// Fakta o provozovateli – zdroj: topseminarky.cz a korektu.cz (19. 10. 2026). Nic z toho nevymýšlet.
export const site = {
  name: 'Oprava závěrečné práce',
  shortName: 'TOP seminárky',
  tagline: 'Kontrola a oprava bakalářských a diplomových prací – i těch, kde škola namítla použití AI.',
  phone: '+420 603 711 499',
  phoneHref: 'tel:+420603711499',
  email: 'info@topseminarky.cz',
  operator: {
    name: 'Mgr. Miroslava Jiráková, MBA',
    ico: '01929534',
    address: 'Hostovice 7, 530 02 Pardubice',
    vat: null as string | null, // ❓ plátce/neplátce DPH – doplní klientka
  },
  responseTime: 'do 24 hodin',
  proof: '800+ studentů', // 🗣️ údaj klientky z topseminarky.cz – nechat potvrdit
  parentSite: 'https://topseminarky.cz',
};

export const env = (import.meta.env.SITE_ENV as 'staging' | 'production') ?? 'production';
export const isStaging = env === 'staging';
export const formEndpoint: string = import.meta.env.PUBLIC_FORM_ENDPOINT ?? '';
export const ga4Id: string = import.meta.env.PUBLIC_GA4_ID ?? '';

/** Interní odkaz s respektem k `base` (GitHub Pages staging běží v podsložce). */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (path.startsWith('#')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export const nav = [
  { label: 'Situace', href: '/#situace' },
  { label: 'Jak to probíhá', href: '/#postup' },
  { label: 'Cena', href: '/#cena' },
  { label: 'AI v závěrečné práci', href: '/ai-v-bakalarske-praci/' },
  { label: 'Kontakt', href: '/kontakt/' },
];
