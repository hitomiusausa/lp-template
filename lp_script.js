// フラットJSONに対応した描画スクリプト（方法B対応版・整備版）
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

  // 料金表記のゆれを吸収（¥88,000 / ¥88,000〜120,000 / 無料 / 応相談 など）
  const normalizePrice = (s) => {
    if (!s) return '';
    let t = String(s).trim()
      .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
      .replace(/[￥]/g, '¥')
      .replace(/[，、]/g, ',')
      .replace(/[．。]/g, '.')
      .replace(/\s+/g, '')
      .replace(/円/g, '')
      .replace(/[~〜]/g, '〜')
      .replace(/[ー–—―－]/g, '-');
    if (/^(無料|応相談|ASK|ask|Free|free)$/i.test(t)) return s;

    const fmt = (numStr) => {
      const n = Number(numStr.replace(/[^\d]/g, ''));
      if (Number.isNaN(n)) return '';
      return '¥' + n.toLocaleString('ja-JP');
    };

    if (/[〜-]/.test(t)) {
      const [left, right] = t.split(/[〜-]/, 2);
      const L = fmt(left), R = fmt(right);
      if (L && R) return `${L}〜${R}`;
      if (L && /〜/.test(t)) return `${L}〜`;
      return L || s;
    }
    return fmt(t) || s;
  };

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

    document.title = title;
    upsertMetaByName('description', desc);
    upsertMetaByName('robots', data.robots || 'index,follow');
    upsertLink('canonical', baseUrl);

    // OGP / Twitter
    upsertMetaByProp('og:type', 'website');
    upsertMetaByProp('og:title', title);
    upsertMetaByProp('og:description', desc);
    upsertMetaByProp('og:url', baseUrl);
    upsertMetaByProp('og:image', abs(ogImg));
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
      // SEO
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

      // Facts：事業所名リンク・電話リンク
      if ($('key_name_fact')) $('key_name_fact').textContent = data.key_name || '';
      if ($('key_name_link')) $('key_name_link').setAttribute('href', data.main_url || '#');

      const telDisplay = data.key_tel_display || '';
      const telHref    = data.key_tel_link || (telDisplay ? `tel:${sanitizeTel(telDisplay)}` : '');
      if ($('key_tel_display')) $('key_tel_display').textContent = telDisplay;
      if ($('key_tel_link') && telHref) $('key_tel_link').setAttribute('href', telHref);

      // ===== CTA: 3ブロック =====
      function setupCTA(opts){
        const blk = $(opts.blockId);
        if (!blk) return;

        if (opts.message && String(opts.message).trim() !== ''){
          setText(opts.messageId, opts.message);
        } else {
          blk.style.display = 'none';
          return;
        }

        // 電話
        const telA = $(opts.telElId);
        const telDisp = $(opts.telDispElId);
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
        // 予約
        const resA = $(opts.resElId);
        if (resA) {
          if (opts.reserveUrl && /^https?:/i.test(opts.reserveUrl)){
            resA.href = opts.reserveUrl;
            resA.style.display = 'inline-flex';
          } else {
            resA.style.display = 'none';
          }
        }
      }
      setupCTA({ blockId:'cta_mid1_block', messageId:'cta_mid1', message:data.cta_mid1, telDisplay:telDisplay, telHref:telHref, reserveUrl:data.key_reservation_url, telElId:'cta1_tel', telDispElId:'cta1_tel_display', resElId:'cta1_res' });
      setupCTA({ blockId:'cta_mid2_block', messageId:'cta_mid2', message:data.cta_mid2, telDisplay:telDisplay, telHref:telHref, reserveUrl:data.key_reservation_url, telElId:'cta2_tel', telDispElId:'cta2_tel_display', resElId:'cta2_res' });
      setupCTA({ blockId:'cta_final_block', messageId:'cta_final', message:data.cta_final, telDisplay:telDisplay, telHref:telHref, reserveUrl:data.key_reservation_url, telElId:'ctaf_tel', telDispElId:'ctaf_tel_display', resElId:'ctaf_res' });

      // ===== Facts（基本情報）=====
      setText('key_name_fact', data.key_name);
      setText('key_location', data.key_location);
      setText('key_language', data.key_language);
      setText('key_founded', data.key_founded);
      setText('key_services', data.key_services);
      setText('key_tel_display', data.key_tel_display);
      setLink('key_tel_link', telHref);
      setLink('key_reservation_url', data.key_reservation_url);

      // service_area / remote_available：無ければ行ごと非表示
      (() => {
        const sa = $('service_area');
        if (sa){
          const t = (data.service_area || '').trim();
          if (t) sa.textContent = t;
          else sa.closest('li')?.style.setProperty('display','none');
        }
        const ra = $('remote_available');
        if (ra){
          const t = (data.remote_available || '').trim();
          if (t) ra.textContent = t;
          else ra.closest('li')?.style.setProperty('display','none');
        }
      })();

      // ===== Owner =====
      setImage('owner_image', data.owner_image);
      setText('owner_name', data.owner_name);
      setText('owner_license', data.owner_license);
      setText('owner_reg_number', data.owner_reg_number);
      setText('owner_cert_number', data.owner_cert_number);

      // ===== FAQ =====
      setText('faq_q1', data.faq_q1);
      setHTML('faq_a1', (data.faq_a1 || '').replace(/\n/g,'<br>'));
      setText('faq_q2', data.faq_q2);
      setHTML('faq_a2', (data.faq_a2 || '').replace(/\n/g,'<br>'));
      setText('faq_q3', data.faq_q3);
      setHTML('faq_a3', (data.faq_a3 || '').replace(/\n/g,'<br>'));

      initFAQAccordion();
      function initFAQAccordion() {
        const root = $('faq');
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
          if (isOpen) closePanel(dd, btn);
          else openPanel(dd, btn);
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

      // ===== ビザ種別（配列 or 改行文字列 両対応）=====
      (() => {
        const ul = $('visa_types_list');
        if (!ul) return;

        const src = data.visa_types;
        const items = Array.isArray(src)
          ? src.map(s => String(s || '').trim()).filter(Boolean)
          : String(src || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);

        if (items.length === 0) { ul.closest('section')?.setAttribute('hidden',''); return; }

        ul.innerHTML = '';
        const frag = document.createDocumentFragment();
        items.forEach(text => { const li = document.createElement('li'); li.textContent = text; frag.appendChild(li); });
        ul.appendChild(frag);
      })();

      // ===== 料金（配列 or "a|b|c" 改行文字列 両対応）=====
      (() => {
        const tbody = $('pricing_rows');
        const sec   = $('pricing_section');
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

        const noteEl = $('pricing_note');
        if (noteEl){
          const t = (data.pricing_note || '').trim();
          if (t) noteEl.textContent = t;
          else noteEl.style.display = 'none';
        }
      })();

      // ===== 訴求PR（配列 / 改行文字列 / オブジェクト 両対応）=====
      (() => {
        const dl  = $('promo_list');
        const sec = $('promo_section');
        if (!dl || !sec) return;

        const src = data.promo_items;
        if (src == null || src === '') { sec.setAttribute('hidden',''); return; }

        const toPairsArray = (input) => {
          if (typeof input === 'string') {
            return input.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          }
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
          if (input && typeof input === 'object') {
            return Object.entries(input).map(([k, v]) => `${String(k).trim()}|${String(v ?? '').trim()}`);
          }
          return [];
        };

        const lines = toPairsArray(src);
        if (lines.length === 0) { sec.setAttribute('hidden',''); return; }

        const frag = document.createDocumentFragment();
        dl.innerHTML = '';

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

          const dt = document.createElement('dt'); dt.textContent = label || '-';
          const dd = document.createElement('dd'); dd.textContent = value || '';
          frag.appendChild(dt); frag.appendChild(dd);
        });

        dl.appendChild(frag);
        sec.removeAttribute('hidden');
      })();

      // ===== Access =====
      setSrc ('access_map', data.access_map);
      setHTML('access_hours', (data.access_hours || '').replace(/\n/g,'<br>'));
      setText('access_address', data.access_address);
      setText('access_station', data.access_station);

      // ===== Final CTA（既存互換）=====
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
          const el = $(id);
          if (el && el.textContent.trim() === '') {
            const p = el.closest('p'); if (p) p.style.display = 'none';
          }
        };
        hideIfEmptyP('footer_address');

        const telA  = $('footer_tel_link');
        const telTx = $('footer_tel');
        const showTel = telA && /^tel:\+?[\d\s\-()]+$/i.test(telA.getAttribute('href') || '')
                          && telTx && telTx.textContent.trim() !== '';
        if (!showTel && telA) telA.closest('.footer-contact')?.style.setProperty('display','none');
      })();
      

      // Footer Legal：リンク存在に応じてセパレーター制御
      (() => {
        const priv  = $('footer_privacy');
        const terms = $('footer_terms');
        const sep   = document.querySelector('.legal-links .sep');
        const wrap  = document.querySelector('.legal-links');

        const setLegalLink = (el, url) => {
          if (!el) return false;
          if (url && /^https?:/i.test(url)) { el.href = url; el.style.display = 'inline'; return true; }
          el.style.display = 'none'; return false;
        };
        const hasPriv  = setLegalLink(priv,  data.privacy_url);
        const hasTerms = setLegalLink(terms, data.terms_url);

        if (sep)  sep.style.display  = (hasPriv && hasTerms) ? 'inline' : 'none';
        if (wrap) wrap.style.display = (hasPriv || hasTerms) ? 'block'  : 'none';
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

        const el = $('org_jsonld');
        if (el) el.textContent = JSON.stringify(org);
      })();


// 半角コロン → 全角： 変換（基本情報のラベル & 運営者情報の項目名）
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.facts .fact-label, .profile-body dt').forEach(el => {
    el.textContent = el.textContent.replace(/:$/, '：');
  });
});

      
      /* ===== CTA Lite Hooks — デフォルト無効（configで有効化） ===== */
      (() => {
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
          window.dispatchEvent(new CustomEvent('cta:click', { detail: payload }));
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
          const el = $(cfg.id);
          if (!el) return;
          el.addEventListener('click', () => {
            // 予約URLにリファラ付与（任意）
            if (cfg.type === 'reserve' && data.ref_param && el.href){
              try{
                const u = new URL(el.href, location.href);
                u.searchParams.set(data.ref_param, `lp-${cfg.location}`);
                el.href = u.toString();
              }catch(_){}
            }
            const label = el.querySelector?.('.btn-label')?.textContent?.trim() || el.textContent.trim();
            const href  = el.getAttribute('href') || '';
            emit({ type:cfg.type, location:cfg.location, label, href: cfg.type==='phone'?maskTel(href):href, page: location.pathname, ts: Date.now(), sid });
          }, { passive:true });
        }
        CTAS.forEach(wire);
      })();

    })
  
    
    .catch(err => console.error('JSON読み込みエラー:', err));
})();
