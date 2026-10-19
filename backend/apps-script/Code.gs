/**
 * Endpoint poptávkového formuláře – Google Apps Script Web App.
 * Nasazení: viz README.md. Žádné adresy ani tajemství v kódu – vše ve Script Properties:
 *   MODE               staging | production
 *   RECIPIENTS         příjemci poptávek na produkci (čárkou oddělené e-maily)
 *   TEST_RECIPIENTS    příjemci na stagingu (Lukáš)
 *   REPLY_TO           adresa firmy, kterou dostane zákazník jako Reply-To (např. info@…)
 *   SENDER_NAME        jméno odesílatele, např. "TOP seminárky – oprava práce"
 *   ALLOWED_ORIGINS    povolené originy formuláře, čárkou (https://sonyx9.github.io, https://doména.cz)
 *   ALLOWED_REDIRECTS  povolené hosty pro _redirect (sonyx9.github.io, doména.cz)
 *   MIN_SECONDS        min. doba od načtení stránky k odeslání (výchozí 3)
 *   MAX_PER_HOUR       max. poptávek z jednoho e-mailu za hodinu (výchozí 3)
 */

var REQUIRED = ['jmeno', 'email', 'typ_prace', 'situace', 'zprava', 'souhlas'];
var MAX_LEN = { jmeno: 120, email: 160, telefon: 40, typ_prace: 80, situace: 120, zprava: 4000, skola_obor: 160, rozsah: 6, vytka: 4000, termin: 20, _source: 200 };

function doPost(e) {
  var props = PropertiesService.getScriptProperties().getProperties();
  var data = parseBody_(e);
  var isJson = data._json === '1';

  // 1) Honeypot + časová kontrola → tichý discard (bot si myslí, že uspěl)
  if (data.website) return respond_(isJson, { ok: true, id: fakeId_() }, data._redirect, props);
  var minSeconds = Number(props.MIN_SECONDS || 3);
  if (data._ts && Date.now() - Number(data._ts) < minSeconds * 1000) {
    return respond_(isJson, { ok: true, id: fakeId_() }, data._redirect, props);
  }

  // 2) Validace na straně endpointu
  var errors = validate_(data);
  if (errors.length) return respond_(isJson, { ok: false, error: errors.join(' ') }, null, props, 400);

  // 3) Limit na e-mail (Apps Script nevidí IP – náhrada za IP rate limit)
  var cache = CacheService.getScriptCache();
  var key = 'rl:' + Utilities.base64EncodeWebSafe(data.email.toLowerCase());
  var count = Number(cache.get(key) || 0);
  if (count >= Number(props.MAX_PER_HOUR || 3)) {
    return respond_(isJson, { ok: false, error: 'Z této adresy už přišlo víc poptávek. Ozvěte se prosím e-mailem.' }, null, props, 429);
  }
  cache.put(key, String(count + 1), 3600);

  // 4) Odeslání
  var id = makeId_();
  var mode = props.MODE === 'production' ? 'production' : 'staging';
  var recipients = mode === 'production' ? props.RECIPIENTS : props.TEST_RECIPIENTS;
  if (!recipients) return respond_(isJson, { ok: false, error: 'Endpoint není nakonfigurovaný (příjemci).' }, null, props, 500);

  var prefix = mode === 'staging' ? '[TEST] ' : '';
  var isTest = /\[TEST\]/i.test(data.jmeno) || /\[TEST\]/i.test(data.zprava);
  if (isTest) prefix = '[TEST] ';

  var subject = prefix + 'Poptávka ' + id + ' – ' + data.typ_prace + ' – ' + data.situace;
  MailApp.sendEmail({
    to: recipients,
    replyTo: data.email,
    name: props.SENDER_NAME || 'Poptávkový formulář',
    subject: subject,
    body: internalBody_(id, data, mode),
  });

  MailApp.sendEmail({
    to: data.email,
    replyTo: props.REPLY_TO || undefined,
    name: props.SENDER_NAME || 'TOP seminárky',
    subject: prefix + 'Přijali jsme vaši poptávku (' + id + ')',
    body: customerBody_(id, data, props),
  });

  return respond_(isJson, { ok: true, id: id }, data._redirect, props);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, service: 'lead-form' })).setMimeType(ContentService.MimeType.JSON);
}

// ---------- helpers ----------

function parseBody_(e) {
  var out = {};
  try {
    if (e.postData && e.postData.contents && (e.postData.type || '').indexOf('text/plain') === 0) {
      out = JSON.parse(e.postData.contents) || {};
    } else {
      out = e.parameter || {};
    }
  } catch (err) {
    out = e.parameter || {};
  }
  Object.keys(out).forEach(function (k) {
    var v = String(out[k] == null ? '' : out[k]).trim();
    if (MAX_LEN[k] && v.length > MAX_LEN[k]) v = v.slice(0, MAX_LEN[k]);
    out[k] = v;
  });
  return out;
}

function validate_(d) {
  var errors = [];
  REQUIRED.forEach(function (k) { if (!d[k]) errors.push('Chybí povinné pole: ' + k + '.'); });
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errors.push('E-mail nemá platný tvar.');
  if (d.jmeno && d.jmeno.length < 2) errors.push('Jméno je příliš krátké.');
  if (d.zprava && d.zprava.length < 20) errors.push('Popis je příliš krátký (min. 20 znaků).');
  if (d.souhlas && d.souhlas !== 'ano') errors.push('Bez souhlasu se zpracováním poptávku nemůžeme přijmout.');
  return errors;
}

function makeId_() {
  var d = new Date();
  var ymd = Utilities.formatDate(d, 'Europe/Prague', 'yyMMdd');
  var rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return 'OP-' + ymd + '-' + rnd;
}
function fakeId_() { return 'OP-000000-0000'; }

function internalBody_(id, d, mode) {
  var lines = [
    'Nová poptávka ' + id + (mode === 'staging' ? ' (STAGING – testovací příjemci)' : ''),
    '',
    'Jméno: ' + d.jmeno,
    'E-mail: ' + d.email,
    'Telefon: ' + (d.telefon || '–'),
    'Typ práce: ' + d.typ_prace,
    'Situace: ' + d.situace,
    'Termín: ' + (d.termin || '–'),
    'Škola a obor: ' + (d.skola_obor || '–'),
    'Rozsah (NS): ' + (d.rozsah || '–'),
    '',
    'Co práce potřebuje:',
    d.zprava,
    '',
    'Co škola vytkla:',
    d.vytka || '–',
    '',
    'Zdroj: ' + (d._source || '–') + ' · odeslání bez JS: ' + (d._json === '1' ? 'ne' : 'ano'),
    'Odpovědět stačí přes Reply (Reply-To = zákazník).',
  ];
  return lines.join('\n');
}

function customerBody_(id, d, props) {
  var jmeno = d.jmeno.split(' ')[0] || d.jmeno;
  return [
    'Dobrý den,',
    '',
    'děkujeme za poptávku. Evidujeme ji pod číslem ' + id + '.',
    '',
    'Shrnutí:',
    '– typ práce: ' + d.typ_prace,
    '– situace: ' + d.situace,
    (d.termin ? '– termín: ' + d.termin : null),
    '',
    'Co bude dál: do 24 hodin (i o víkendu) vám napíšeme, co k práci potřebujeme, a navrhneme postup s cenou. První konzultace je zdarma.',
    'Pokud máte posudek nebo připomínky od školy, pošlete je prosím odpovědí na tento e-mail – usnadní to odhad rozsahu práce.',
    '',
    'S pozdravem',
    'Mgr. Miroslava Jiráková, MBA',
    (props.REPLY_TO || ''),
  ].filter(function (x) { return x !== null; }).join('\n');
}

function respond_(isJson, payload, redirect, props, status) {
  if (isJson) {
    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
  }
  // Odeslání bez JS: vrátit stránku s přesměrováním na /dekujeme/ (jen povolené hosty)
  var target = safeRedirect_(redirect, props);
  if (!payload.ok) {
    return HtmlService.createHtmlOutput(
      '<!doctype html><meta charset="utf-8"><title>Poptávku se nepodařilo odeslat</title>' +
      '<p style="font-family:sans-serif;max-width:40em">' + esc_(payload.error || 'Chyba.') + ' Vraťte se prosím zpět a zkuste to znovu.</p>'
    );
  }
  var url = target ? target + '?id=' + encodeURIComponent(payload.id) : null;
  return HtmlService.createHtmlOutput(
    '<!doctype html><meta charset="utf-8">' +
    (url ? '<meta http-equiv="refresh" content="0;url=' + esc_(url) + '">' : '') +
    '<title>Děkujeme</title><p style="font-family:sans-serif">Poptávka ' + esc_(payload.id) + ' byla přijata.' +
    (url ? ' <a href="' + esc_(url) + '">Pokračovat</a>' : '') + '</p>'
  );
}

function safeRedirect_(redirect, props) {
  if (!redirect) return null;
  var allowed = String(props.ALLOWED_REDIRECTS || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var m = String(redirect).match(/^https:\/\/([^\/?#]+)/i);
  if (!m) return null;
  return allowed.indexOf(m[1].toLowerCase()) >= 0 ? redirect : null;
}

function esc_(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}
