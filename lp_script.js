(function(){
  'use strict';

  // ---------- Helpers ----------
  const $ = (id) => document.getElementById(id);
  const hasCssEscape = (typeof CSS !== 'undefined' && typeof CSS.escape === 'function');
  const esc = (s) => hasCssEscape ? CSS.escape(s) : s;

  const setText = (id, text) => {
    const el = $(id);
    if (!el) return;
    if (text && String(text).trim() !== "") el.textContent = text;
  };

  const setHTML = (id, html) => {
    const el = $(id);
    if (!el) return;
    if (html && String(html).trim() !== "") el.innerHTML = html;
  };

  const setImage = (id, src, fallback = "/assets/images/logo.png") => {
    const el = $(id);
    if (!el || !src) return;
    const onError = () => { el.src = fallback; };
    el.addEventListener('error', onError, { once: true });
    el.src = src;
  };

  const setLink = (id, href) => {
    const el = $(id);
    if (el && href) el.href = href;
  };

  const setSrc = (id, src) => {
    const el = $(id);
    if (el && src) el.src = src;
  };

  const sanitizeTel = (s) => (s || '').replace(/[^\d+]/g, '');

  // ---------- SEO meta from JSON ----------
  function applySEOMeta(data){
    const title = (data.seo_title && data.seo_title.trim())
      || `${data.key_name || ''} | ${data.key_services || '行政書士'}`.trim();

    const desc = (data.seo_description && data.seo_description.trim())
      || (data.main_message && data.main_message.trim())
      || '外国人向けのビザ申請・更新・翻訳をサポート';

    const baseUrl = (data.canonical_url && data.canonical_url.trim())
      || (location.origin + location.pathname);

    const ogImg = (data.og_image && data.og_image.trim())
      || (data.hero_image && data.hero_image.trim())
      || '/assets/images/hero.jpg';

    const upsertMetaByName = (name, content) => {
      if (!content) return;
      let el = document.head.querySelector(`meta[name="${esc(name)}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    const upsertMetaByProp = (prop, content) => {
      if (!content) return;
      let el = document.head.querySelector(`meta[property="${esc(prop)}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    const upsertLink = (rel, href) => {
      if (!href) return;
      let el = document.head.querySelector(`link[rel="${esc(rel)}"]`);
      if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
      el.setAttribute('href', href);
    };

    const abs = (url) => { try { return new URL(url, location.origin).href; } catch { return url; } };

    // 反映
    document.title = title;
    upsertMetaByName('description', desc);
    upsertMetaByName('robots', data.robots || 'index,follow');
    upsertLink('canonical', baseUrl);

    // OGP
    upsertMetaByProp('og:type', 'website');
    upsertMetaByProp('og:title', title);
    upsertMetaByProp('og:description', desc);
    upsertMetaByProp('og:url', baseUrl);
    upsertMetaByProp('og:image', abs(ogImg));

    // Twitter
    upsertMetaByName('twitter:card', data.twitter_card || 'summary_large_image');
    upsertMetaByName('twitter:title', title);
    upsertMetaByName('twitter:description', desc);
    upsertMetaByName('twitter:image', abs(ogImg));
  }

  // ---------- Main ----------
  const file = 'config.json';
  fetch(file, { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      // SEOを適用
      applySEOMeta(data);

      // Hero（<picture> がある場合は上書きしない）
      (() => {
        const img = document.getElementById('hero_image');
        if (!img) return;
        const pic = img.closest('picture');
        if (!pic) setImage('hero_image', data.hero_image);
      })();

      setImage('hero_logo', data.hero_logo || '/assets/images/logo.png');
      setText('key_name', data.key_name);
      setText('hero_message', data.hero_message || '');

      // 事業所名リンク＆電話リンク（Facts）
      if (document.getElementById('key_name_fact')) {
        document.getElementById('key_name_fact').textContent = data.key_name || '';
      }
      if (document.getElementById('key_name_link')) {
        const url = data.main_url || '#';
        document.getElementById('key_name_link').setAttribute('href', url);
      }

      const telDisplay = data.key_tel_display || '';
      const telHref    = data.key_tel_link || (telDisplay ? `tel:${sanitizeTel(telDisplay)}` : '');
      if (document.getElementById('key_tel_display')) {
        document.getElementById('key_tel_display').textContent = telDisplay;
      }
      if (document.getElementById('key_tel_link') && telHref) {
        document.getElementById('key_tel_link').setAttribute('href', telHref);
      }

      // ===== CTA: 3ブロックをまとめてセット =====
      setupCTA({
        blockId: 'cta_mid1_block',
        messageId: 'cta_mid1',
        message: data.cta_mid1,
        telDisplay: telDisplay,
        telHref: telHref,
        reserveUrl: data.key_reservation_url,
        telElId: 'cta1_tel',
        telDispElId: 'cta1_tel_display',
        resElId: 'cta1_res'
      });
      setupCTA({
        blockId: 'cta_mid2_block',
        messageId: 'cta_mid2',
        message: data.cta_mid2,
        telDisplay: telDisplay,
        telHref: telHref,
        reserveUrl: data.key_reservation_url,
        telElId: 'cta2_tel',
        telDispElId: 'cta2_tel_display',
        resElId: 'cta2_res'
      });
      setupCTA({
        blockId: 'cta_final_block',
        messageId: 'cta_final',
        message: data.cta_final,
        telDisplay: telDisplay,
        telHref: telHref,
        reserveUrl: data.key_reservation_url,
        telElId: 'ctaf_tel',
        telDispElId: 'ctaf_tel_display',
        resElId: 'ctaf_res'
      });

      // 汎用：CTAをセット（メッセージが無ければブロックごと非表示）
      function setupCTA(opts){
        const blk = document.getElementById(opts.blockId);
        if (!blk) return;

        // メッセージ
        if (opts.message && String(opts.message).trim() !== ''){
          setText(opts.messageId, opts.message);
        } else {
          blk.style.display = 'none';
          return;
        }

        // 電話ボタン
        const telA = document.getElementById(opts.telElId);
        const telDisp = document.getElementById(opts.telDispElId);
        if (telA) {
          const isTel = !!(opts.telHref && /^tel:\+?[\d\s\-()]+$/i.test(opts.telHref));
          if (isTel) {
            telA.href = opts.telHref;
            telA.style.display = 'inline-flex';
            const labelEl = telA.querySelector('.btn-label');
            if (labelEl) labelEl.textContent = '電話で問い合わせる';
            const num = (opts.telDisplay || '').trim();
            if (telDisp) {
              telDisp.textContent = num;
              telDisp.style.display = num ? 'block' : 'none';
            }
            telA.setAttribute('aria-label', `電話で問い合わせる ${num || ''}`.trim());
          } else {
            telA.style.display = 'none';
          }
        }

        // 予約ボタン
        const resA = document.getElementById(opts.resElId);
        if (resA) {
          if (opts.reserveUrl && /^https?:/i.test(opts.reserveUrl)){
            resA.href = opts.reserveUrl;
            resA.style.display = 'inline-flex';
          } else {
            resA.style.display = 'none';
          }
        }
      }

      // ===== Facts =====
      setText('key_name_fact', data.key_name);
      setText('key_location', data.key_location);
      setText('key_language', data.key_language);
      setText('key_founded', data.key_founded);
      setText('key_services', data.key_services);
      setText('key_tel_display', data.key_tel_display);
      setLink('key_tel_link', telHref);
      setLink('key_reservation_url', data.key_reservation_url);

      // ===== Owner =====
      setImage('owner_image', data.owner_image);
      setText('owner_name', data.owner_name);
      setText('owner_license', data.owner_license);
      setText('owner_reg_number', data.owner_reg_number);
      setText('owner_cert_number', data.owner_cert_number);

      // ===== Q&A（回答は改行を<br>化）=====
      setText('faq_q1', data.faq_q1);
      setHTML('faq_a1', (data.faq_a1 || '').replace(/\n/g,'<br>'));
      setText('faq_q2', data.faq_q2);
      setHTML('faq_a2', (data.faq_a2 || '').replace(/\n/g,'<br>'));
      setText('faq_q3', data.faq_q3);
      setHTML('faq_a3', (data.faq_a3 || '').replace(/\n/g,'<br>'));

      initFAQAccordion();

      function initFAQAccordion() {
        const root = document.getElementById('faq');
        if (!root) return;

        // 空項目は削除（空ボタン防止）
        root.querySelectorAll('.faq-q').forEach(btn => {
          const ddId = btn.getAttribute('aria-controls');
          const dd = document.getElementById(ddId);
          const qSpan = btn.querySelector('span[id^="faq_q"]');
          const hasQ = qSpan && qSpan.textContent.trim() !== '';
          const hasA = dd && dd.textContent.trim() !== '';
          if (!hasQ || !hasA) {
            const dt = btn.closest('dt');
            if (dt && dd) { dt.remove(); dd.remove(); }
          }
        });

        // クリック（イベント委任）
        root.addEventListener('click', (e) => {
          const btn = e.target.closest('.faq-q');
          if (!btn || !root.contains(btn)) return;
          e.preventDefault();

          const ddId = btn.getAttribute('aria-controls');
          const dd = document.getElementById(ddId);
          if (!dd) return;

          const isOpen = btn.getAttribute('aria-expanded') === 'true';
          if (isOpen) {
            closePanel(dd, btn);
          } else {
            // 同時に1つだけ開きたい場合は下記を有効化
            // root.querySelectorAll('.faq-a.open').forEach(open => {
            //   if (open.id !== ddId) closePanel(open, root.querySelector(`.faq-q[aria-controls="${open.id}"]`));
            // });
            openPanel(dd, btn);
          }
        });
      }

      function openPanel(dd, btn) {
        btn.setAttribute('aria-expanded', 'true');
        const icon = btn.querySelector('.faq-icon'); if (icon) icon.textContent = '−';
        dd.removeAttribute('hidden');
        dd.classList.add('open');
      }

      function closePanel(dd, btn) {
        btn.setAttribute('aria-expanded', 'false');
        const icon = btn.querySelector('.faq-icon'); if (icon) icon.textContent = '+';
        dd.classList.remove('open');
        const onEnd = (ev) => {
          if (ev.propertyName !== 'max-height') return;
          dd.setAttribute('hidden','');
          dd.removeEventListener('transitionend', onEnd);
        };
        dd.addEventListener('transitionend', onEnd);
      }

      // ============ A) 対応エリア（Key Factsへの追加） ============
  // ✅ データが無ければ行ごと隠す（ハードコード排除）
(() => {
  const sa = document.getElementById('service_area');
  if (sa){
    const t = (data.service_area || '').trim();
    if (t) sa.textContent = t;
    else sa.closest('li')?.style.setProperty('display','none');
  }
  const ra = document.getElementById('remote_available');
  if (ra){
    const t = (data.remote_available || '').trim();
    if (t) ra.textContent = t;
    else ra.closest('li')?.style.setProperty('display','none');
  }
})();

// ============ B) ビザ種別（配列 or 改行テキスト 両対応・空ならセクション非表示） ============
(() => {
  const ul = document.getElementById('visa_types_list');
  if (!ul) return;

  const src = data.visa_types;

  // 配列ならそのまま、文字列なら改行で分割
  const items = Array.isArray(src)
    ? src.map(s => String(s || '').trim()).filter(Boolean)
    : String(src || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  if (items.length === 0) {
    ul.closest('section')?.setAttribute('hidden', '');
    return;
  }

  ul.innerHTML = '';
  const frag = document.createDocumentFragment();
  items.forEach(text => {
    const li = document.createElement('li');
    li.textContent = text;
    frag.appendChild(li);
  });
  ul.appendChild(frag);
})();


 // ✅ pricing_items：配列({plan,price,note} or "a|b|c") / "\n" 文字列 両対応
(() => {
  const tbody = document.getElementById('pricing_rows');
  const sec   = document.getElementById('pricing_section');
  if (!tbody || !sec) return;

  const src = data.pricing_items;
  const rows = Array.isArray(src) ? src : String(src || '')
    .split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  if (rows.length === 0){ sec.setAttribute('hidden',''); return; }

  const toTriple = (r) => {
    if (typeof r === 'string'){
      const [a='', b='', c=''] = r.split('|').map(x => (x || '').trim());
      return [a, b, c];
    }
    if (r && typeof r === 'object'){
      return [String(r.plan||'').trim(), String(r.price||'').trim(), String(r.note||'').trim()];
    }
    return ['','',''];
  };

  const frag = document.createDocumentFragment();
  rows.forEach(r => {
    const [plan, price, note] = toTriple(r);
    const tr  = document.createElement('tr');
    const td1 = document.createElement('td');
    const td2 = document.createElement('td');
    const td3 = document.createElement('td');
    td1.textContent = plan || '-';
    td2.textContent = price ? normalizePrice(price) : '-';
    td3.textContent = note || '';
    tr.append(td1, td2, td3);
    frag.appendChild(tr);
  });
  tbody.innerHTML = '';
  tbody.appendChild(frag);
  sec.removeAttribute('hidden');

  const noteEl = document.getElementById('pricing_note');
  if (noteEl){
    const t = (data.pricing_note || '').trim();
    if (t) noteEl.textContent = t;
    else noteEl.style.display = 'none';
  }
})();


      // ============ C) 料金テーブル（1行= "プラン|料金|補足" 改行区切り） ============
      (() => {
        const tbody = document.getElementById('pricing_rows');
        const sec   = document.getElementById('pricing_section');
        if (!tbody || !sec) return;

        const lines = (data.pricing_items || '')
          .split('\n').map(s => s.trim()).filter(Boolean);

        if (lines.length === 0) { sec.setAttribute('hidden',''); return; }

        const frag = document.createDocumentFragment();

        lines.forEach(line => {
          const [plan = '', price = '', note = ''] =
            line.split('|').map(s => (s || '').trim());

          const tr  = document.createElement('tr');
          const td1 = document.createElement('td');
          const td2 = document.createElement('td');
          const td3 = document.createElement('td');

          td1.textContent = plan || '-';
          td2.textContent = price ? normalizePrice(price) : '-';
          td3.textContent = note  || '';

          tr.append(td1, td2, td3);
          frag.appendChild(tr);
        });

        tbody.innerHTML = '';
        tbody.appendChild(frag);
        sec.removeAttribute('hidden');

        const noteEl = document.getElementById('pricing_note');
        if (noteEl) noteEl.textContent = (data.pricing_note || '').trim();
      })();


      
// ===== 訴求PR：data.promo_items（配列 / 改行テキスト / オブジェクト）両対応・安全版 =====
(() => {
  const dl  = document.getElementById('promo_list');
  const sec = document.getElementById('promo_section');
  if (!dl || !sec) return;

  const src = data.promo_items;
  if (src == null || src === '') { sec.setAttribute('hidden',''); return; }

  // 正規化：どんな形でも「'ラベル|値' の配列」にする
  const toPairsArray = (input) => {
    // A) 文字列（改行区切り）
    if (typeof input === 'string') {
      const lines = input.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      return lines;
    }
    // B) 配列（文字列 or {label,value}）
    if (Array.isArray(input)) {
      return input.map(item => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const label = String(item.label ?? item.title ?? '').trim();
          const value = String(item.value ?? item.text  ?? '').trim();
          return (label || value) ? `${label}|${value}` : '';
        }
        return '';
      }).filter(Boolean);
    }
    // C) オブジェクト（{ラベル: 値}）
    if (input && typeof input === 'object') {
      return Object.entries(input).map(([k, v]) => `${String(k).trim()}|${String(v ?? '').trim()}`);
    }
    // その他は空
    return [];
  };

  const lines = toPairsArray(src);
  if (lines.length === 0) { sec.setAttribute('hidden',''); return; }

  const frag = document.createDocumentFragment();

  lines.forEach(line => {
    let label = '', value = '';
    if (line.includes('|')) {
      [label, value] = line.split('|', 2).map(x => (x ?? '').trim());
    } else if (line.includes('：') || line.includes(':')) {
      const idx = line.indexOf('：') >= 0 ? line.indexOf('：') : line.indexOf(':');
      label = line.slice(0, idx).trim();
      value = line.slice(idx + 1).trim();
    } else {
      label = line.trim();
      value = '';
    }

    // DOM生成（XSS防止のため textContent を使用）
    const row = document.createElement('div');
    row.className = 'promo-row';

    const dt = document.createElement('dt');
    dt.textContent = label || '-';

    const dd = document.createElement('dd');
    dd.textContent = value || '';

    row.append(dt, dd);
    frag.appendChild(row);
  });

  dl.innerHTML = '';
  dl.appendChild(frag);
  sec.removeAttribute('hidden');
})();


      // ===== Access（営業時間は改行保持）=====
      setSrc ('access_map', data.access_map);
      setHTML('access_hours', (data.access_hours || '').replace(/\n/g,'<br>'));
      setText('access_address', data.access_address);
      setText('access_station', data.access_station);

      // ===== Final CTA（冗長だが既存互換で維持）=====
      setText('cta_mid2', data.cta_mid2);
      setText('cta_final', data.cta_final);

      // ===== Footer fill =====
      setImage('footer_logo', data.hero_logo || '/assets/images/logo.png');
      setText ('footer_name',       data.key_name || '');
      setText ('footer_name_copy',  data.key_name || '');
      setText ('footer_license',    data.owner_license    ? `資格: ${data.owner_license}`         : '');
      setText ('footer_reg',        data.owner_reg_number ? `登録番号: ${data.owner_reg_number}`  : '');
      setText ('footer_cert',       data.owner_cert_number? `認証番号: ${data.owner_cert_number}` : '');
      setText ('footer_address',    data.access_address || '');
      setText ('footer_tel',        data.key_tel_display || '');
      setLink ('footer_tel_link',   telHref || '#');

      // 住所・電話：空なら行ごと非表示
      (() => {
        const hideIfEmptyP = (id) => {
          const el = document.getElementById(id);
          if (el && el.textContent.trim() === '') {
            const p = el.closest('p'); if (p) p.style.display = 'none';
          }
        };
        hideIfEmptyP('footer_address');

        const telA  = document.getElementById('footer_tel_link');
        const telTx = document.getElementById('footer_tel');
        const showTel = telA && /^tel:\+?[\d\s\-()]+$/i.test(telA.getAttribute('href') || '')
                          && telTx && telTx.textContent.trim() !== '';
        if (!showTel && telA) telA.closest('.footer-contact')?.style.setProperty('display','none');
      })();

      // 営業時間：平日/休日を自動判別して分割表示
      (() => {
        const lines = (data.access_hours || '').split('\n').map(s=>s.trim()).filter(Boolean);
        let weekday = '', holiday = '';
        lines.forEach(line => {
          if (/平日|Weekdays/i.test(line)) weekday = line;
          else if (/休日|土日|祝|Weekend|Sat|Sun|Holiday/i.test(line)) holiday = line;
        });
        if (!weekday && lines[0]) weekday = lines[0];

        const wEl = document.getElementById('footer_hours_weekday');
        const hEl = document.getElementById('footer_hours_holiday');
        const sep = document.getElementById('footer_hours_sep');

        if (wEl) wEl.textContent = weekday || '';
        if (hEl) {
          hEl.textContent = holiday || '';
          if (!holiday) { hEl.style.display = 'none'; if (sep) sep.style.display = 'none'; }
          else { if (sep) sep.style.display = 'inline'; }
        }
        if (!weekday && !holiday) {
          const p = (wEl || hEl)?.closest('p');
          if (p) p.style.display = 'none';
        }
      })();

      // 年号
      setText('footer_year', String(new Date().getFullYear()));

// ないリンク（プラポリ/規約）は非表示 ＋ セパレーター調整
(() => {
  const priv = document.getElementById('footer_privacy');
  const terms = document.getElementById('footer_terms');
  const sep = document.querySelector('.legal-links .sep');
  const wrap = document.querySelector('.legal-links');

  // 個別表示制御
  const setLegalLink = (el, url) => {
    if (!el) return false;
    if (url && /^https?:/i.test(url)) { el.href = url; el.style.display = 'inline'; return true; }
    el.style.display = 'none'; return false;
  };

  const hasPriv  = setLegalLink(priv,  data.privacy_url);
  const hasTerms = setLegalLink(terms, data.terms_url);

  // 区切り「/」は両方あるときだけ見せる
  if (sep)   sep.style.display = (hasPriv && hasTerms) ? 'inline' : 'none';
  // どちらも無ければ行ごと隠す
  if (wrap)  wrap.style.display = (hasPriv || hasTerms) ? 'block'  : 'none';
})();

      // ===== Organization JSON-LD =====
      (() => {
        function parseJPAddress(input){
          let s = (input || '').trim();
          const out = { postalCode:'', addressRegion:'', addressLocality:'', streetAddress:'', addressCountry:'JP' };
          const mZip = s.match(/(?:〒\s*)?(\d{3})[-－‐]?(\d{4})/);
          if (mZip){ out.postalCode = `${mZip[1]}-${mZip[2]}`; s = s.replace(mZip[0], '').trim(); }
          const mPref = s.match(/(北海道|東京都|京都府|大阪府|..県)/);
          if (mPref){ out.addressRegion = mPref[1]; s = s.replace(mPref[0], '').trim(); }
          const mLocal = s.match(/^[^0-9\-ー－]+?(市|区|町|村)/);
          if (mLocal){ out.addressLocality = mLocal[0]; s = s.slice(mLocal[0].length).trim(); }
          out.streetAddress = s.replace(/^[\s,、-]+/, '');
          return out;
        }

        const parseHours = (text) => {
          if (!text) return null;
          const t = text.replace(/\s+/g,'').replace(/[~～〜]/g,'〜');
          const m = t.match(/(\d{1,2}):?(\d{2})?〜(\d{1,2}):?(\d{2})?/);
          if (!m) return null;
          const HH = n => String(n).padStart(2,'0');
          return { opens: `${HH(m[1])}:${HH(m[2]||'00')}`, closes: `${HH(m[3])}:${HH(m[4]||'00')}` };
        };

        const lines  = (data.access_hours || '').split('\n').map(s=>s.trim()).filter(Boolean);
        const wdText = lines.find(l=>/平日|Weekdays/i.test(l)) || lines[0] || '';
        const hdText = lines.find(l=>/休日|土日|祝|Weekend|Sat|Sun|Holiday/i.test(l)) || '';
        const wd = parseHours(wdText);
        const hd = parseHours(hdText);

        const openingHoursSpecification = [];
        if (wd){ openingHoursSpecification.push({
          "@type":"OpeningHoursSpecification",
          "dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],
          "opens": wd.opens, "closes": wd.closes
        });}
        if (hd){ openingHoursSpecification.push({
          "@type":"OpeningHoursSpecification",
          "dayOfWeek":["Saturday","Sunday"],
          "opens": hd.opens, "closes": hd.closes
        });}

        const abs = (url) => { try { return new URL(url, location.origin).href; } catch { return url; } };
        const parts = parseJPAddress(data.access_address);
        const postalAddress = {
          "@type": "PostalAddress",
          streetAddress: parts.streetAddress || (data.access_address || ''),
          addressCountry: parts.addressCountry
        };
        if (parts.addressRegion)   postalAddress.addressRegion   = parts.addressRegion;
        if (parts.addressLocality) postalAddress.addressLocality = parts.addressLocality;
        if (parts.postalCode)      postalAddress.postalCode      = parts.postalCode;

        const org = {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "name": data.key_name || "",
          "image": abs(data.hero_image || ""),
          "logo":  abs(data.hero_logo || "/assets/images/logo.png"),
          "telephone": (data.key_tel_display || "").replace(/[^\d+]/g,''),
          "address": postalAddress,
          "areaServed": data.service_area || "Japan",
          "availableLanguage": (data.key_language||"").split(/[\/／,，・、]\s*/).filter(Boolean),
          "url": location.origin + location.pathname
        };
        if (openingHoursSpecification.length){
          org.openingHoursSpecification = openingHoursSpecification;
        }
        
const sep = document.querySelector('.legal-links .sep');
const hasPriv = footer_privacy?.style.display !== 'none';
const hasTerms = footer_terms?.style.display !== 'none';
if (sep) sep.style.display = (hasPriv && hasTerms) ? 'inline' : 'none';


        const el = document.getElementById('org_jsonld');
        if (el) el.textContent = JSON.stringify(org);
      })();

/* ===== CTA Lite Hooks — オフが初期値。将来いつでもオンにできる ===== */
(() => {
  // 計測対象（IDは既存レイアウト準拠）
  const CTAS = [
    { id:'cta1_tel',  type:'phone',   location:'mid1'  },
    { id:'cta2_tel',  type:'phone',   location:'mid2'  },
    { id:'ctaf_tel',  type:'phone',   location:'final' },
    { id:'footer_tel_link', type:'phone', location:'footer' },
    { id:'cta1_res',  type:'reserve', location:'mid1'  },
    { id:'cta2_res',  type:'reserve', location:'mid2'  },
    { id:'ctaf_res',  type:'reserve', location:'final' }
  ];

  const sid = sessionStorage.getItem('sid') || (Date.now().toString(36)+Math.random().toString(36).slice(2,8));
  sessionStorage.setItem('sid', sid);

  const maskTel = (href) => href && href.startsWith('tel:')
    ? 'tel:' + href.replace(/^tel:/,'').replace(/\d(?=\d{4})/g,'•')
    : (href || '');

  function emit(payload){
    // 1) ページ内カスタムイベント（リスナー未設定なら何もしない）
    window.dispatchEvent(new CustomEvent('cta:click', { detail: payload }));

    // 2) 任意のHTTPエンドポイント（設定されていなければ送らない）
    if (data.tracking_enabled && data.tracking_endpoint){
      try{
        const body = { ...payload, token: data.tracking_token || undefined };
        const blob = new Blob([JSON.stringify(body)], { type:'application/json' });
        if (navigator.sendBeacon) navigator.sendBeacon(data.tracking_endpoint, blob);
        else fetch(data.tracking_endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body), keepalive:true });
      }catch(_){}
    }
  }

  function wire(cfg){
    const el = document.getElementById(cfg.id);
    if (!el) return;

    el.addEventListener('click', () => {
      // 予約リンクに ref パラメータを付与（設定がある時だけ）
      if (cfg.type === 'reserve' && data.ref_param && el.href){
        try{
          const u = new URL(el.href, location.href);
          u.searchParams.set(data.ref_param, `lp-${cfg.location}`);
          el.href = u.toString();
        }catch(_){}
      }

      const label = el.querySelector?.('.btn-label')?.textContent?.trim()
                 || el.textContent.trim();
      const href  = el.getAttribute('href') || '';

      emit({
        type: cfg.type,
        location: cfg.location,
        label,
        href: cfg.type === 'phone' ? maskTel(href) : href,
        page: location.pathname,
        ts: Date.now(),
        sid
      });
    }, { passive:true });
  }

  CTAS.forEach(wire);
})();      

    })
    .catch(err => console.error('JSON読み込みエラー:', err));
})();
