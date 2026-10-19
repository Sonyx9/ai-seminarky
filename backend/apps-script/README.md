# Backend formuláře – Google Apps Script

Statický web nic neodesílá; formulář posílá data na Web App z `Code.gs`.

## Pod jakým účtem
Metodika: pod účtem klientky. Klientka má jen seznam.cz → je potřeba Google účet.
Doporučení: založit Gmail účet pro klientku (nebo použít její, pokud nějaký má). Pod účtem Lukáše jen jako
dočasné řešení pro staging – na produkci by Lukáš byl zpracovatelem osobních údajů bez smlouvy.

## Nasazení
1. script.google.com → Nový projekt → vložit `Code.gs`.
2. Nastavení projektu → Vlastnosti skriptu (Script Properties):
   - `MODE` = `staging` (na produkci `production`)
   - `TEST_RECIPIENTS` = e-mail Lukáše
   - `RECIPIENTS` = e-mail klientky (až na produkci)
   - `REPLY_TO` = info@… (adresa, na kterou má zákazník odpovídat)
   - `SENDER_NAME` = `TOP seminárky – oprava práce`
   - `ALLOWED_REDIRECTS` = `sonyx9.github.io` (později + ostrá doména)
   - volitelně `MIN_SECONDS` (3), `MAX_PER_HOUR` (3)
3. Nasadit → Nové nasazení → Webová aplikace: spustit jako **já**, přístup **kdokoli**. Zkopírovat URL `/exec`.
4. URL dát do `.env` jako `PUBLIC_FORM_ENDPOINT` (lokálně) a do GitHub Actions secret `PUBLIC_FORM_ENDPOINT`.
5. Při změně kódu vždy **nové nasazení** (URL se nemění jen u „Správa nasazení → upravit → nová verze“).

## Co endpoint dělá
- přijme JSON (`text/plain`, fetch z webu) i klasický POST bez JS,
- honeypot `website` a odeslání do 3 s od načtení → tichý discard,
- validace povinných polí, délek, e-mailu; limit 3 poptávky / e-mail / hodinu (Apps Script nevidí IP),
- e-mail firmě s ID `OP-RRMMDD-XXXX` v předmětu, Reply-To = zákazník,
- potvrzovací e-mail zákazníkovi (shrnutí, co bude dál, výzva poslat posudek odpovědí),
- bez JS vrátí stránku s přesměrováním na `/dekujeme/?id=…` (jen povolené hosty).

## Odchylky od metodiky (vědomé)
- Časové razítko `_ts` nastavuje prohlížeč, není podepsané serverem (Apps Script nemá session). Bot ho může podstrčit.
- Rate limit je per e-mail, ne per IP.
- Odesílatel je Google účet, pod kterým skript běží – ne mailbox na doméně klientky (SPF/DKIM se tím neřeší, ale Gmail doručuje spolehlivě).
- Denní kvóta MailApp: 100 e-mailů/den na běžném Gmailu (2 na poptávku).

## Test
Jméno `[TEST] …` nebo `[TEST]` ve zprávě → předmět dostane prefix `[TEST]`, nikdy nevytvářet falešné zakázky.
