# Oprava závěrečné práce – web pro TOP seminárky

Statický poptávkový web (Astro 5 + Tailwind 4), staging na GitHub Pages, formulář přes Google Apps Script.

## Příkazy
- `npm run dev` – vývoj (http://localhost:4321/ai-seminarky/ při SITE_ENV=staging, jinak `/`)
- `npm run build:staging` – build pro GitHub Pages (noindex, robots Disallow, base `/ai-seminarky`)
- `npm run build` – produkční build (vyžaduje `PROD_SITE`)

## Proměnné (.env, GitHub Actions)
Viz `.env.example`. `PUBLIC_FORM_ENDPOINT` je secret, `PUBLIC_GA4_ID` a `SITE_ENV` jsou repository variables.

## Struktura
- `src/lib/site.ts` – fakta o provozovateli, navigace, helper `url()` pro base path
- `src/layouts/Base.astro` – head, noindex podle prostředí, hlavička, patička, souhlas s cookies
- `src/components/LeadForm.astro` – formulář (funguje i bez JS)
- `backend/apps-script/` – endpoint formuláře + návod k nasazení
- `pripominky.md` – evidence kol připomínek

## Otevřené body
Viz poslední sekce v chatu / trezor (02_KLIENTI/Miroslava Jiráková.md → Otevřené otázky).
