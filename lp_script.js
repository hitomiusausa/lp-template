// フラットJSONに対応した描画スクリプト（方法B対応版）
// - Hero: <picture> がある場合は JS で上書きしない（ブラウザの最適フォーマット選択を尊重）
// - setImage: 先に error を登録してから src をセット（レース回避）
// - fetch: cache: 'no-store' で常に最新の config.json を取得
(function(){
  'use strict';

  const $ = (id) => document.getElementById(id);

  const setText = (id, text) => {
    const el = $(id);
    if (!el) return;
    if (text && String(text).trim()!=="") el.textContent = text;
  };

  const setHTML = (id, html) => {
    const el = $(id);
    if (!el) return;
    if (html && String(html).trim()!=="") el.innerHTML = html;
  };

  const setImage = (id, src, fallback = "/assets/images/logo.png") => {
    const el = $(id);
    if (!el || !src) return;
    const onError = () => { el.src = fallback; };
    el.addEventListener('error', onError, { once:true }); // 先に仕込む
    el.src = src;                                         // 後で設定
  };

  const setLink = (id, href) => {
    const el = $(id);
    if (el && href) el.href = href;
  };

  const setSrc = (id, src) => {
    const el = $(id);
    if (el && src) el.src = src;
  };

  const file = 'config.json';
  fetch(file, { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {

      // ===== Hero（<picture> がある場合は上書きしない）=====
      (() => {
        const img = document.getElementById('hero_image');
        if (!img) return;
        const pic = img.closest('picture');
        if (!pic) {
          // <picture> を使っていない構成のときだけ JSON で差し替え
          setImage('hero_image', data.hero_image);
        }
        // <picture> がある場合は HTML 側（<source>含む）の指定を優先
      })();

      setImage('hero_logo', data.hero_logo);
      setText ('key_name', data.key_name);
      setText ('hero_message', data.hero_message || '');

      // ===== CTA: 3ブロックをまとめてセット =====
      setupCTA({
        blockId: 'cta_mid1_block',
        messageId: 'cta_mid1',
        message: data.cta_mid1,
        telDisplay: data.key_tel_display,
        telHref: data.key_tel_link,
        reserveUrl: data.key_reservation_url,
        telElId: 'cta1_tel',
        telDispElId: 'cta1_tel_display',
        resElId: 'cta1_res'
      });
      setupCTA({
        blockId: 'cta_mid2_block',
        messageId: 'cta_mid2',
        message: data.cta_mid2,
        telDisplay: data.key_tel_display,
        telHref: data.key_tel_link,
        reserveUrl: data.key_reservation_url,
        telElId: 'cta2_tel',
        telDispElId: 'cta2_tel_display',
        resElId: 'cta2_res'
      });
      setupCTA({
        blockId: 'cta_final_block',
        messageId: 'cta_final',
        message: data.cta_final,
        telDisplay: data.key_tel_display,
        telHref: data.key_tel_link,
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
        if (opts.message && String(opts.message).trim()!==''){
          setText(opts.messageId, opts.message);
        } else {
          blk.style.display = 'none';
          return;
        }

        // 電話ボタン
        const telA = document.getElementById(opts.telElId);
        const telDisp = document.getElementById(opts.telDispElId);

        if (telA) {
          // ゆるめの tel バリデーション（tel: の後は数字/スペース/()-/+OK）
          const isTel = !!(opts.telHref && /^tel:\+?[\d\s\-()]+$/i.test(opts.telHref));

          if (isTel) {
            telA.href = opts.telHref;
            telA.style.display = 'inline-flex';

            // 上段の文言を統一
            const labelEl = telA.querySelector('.btn-label');
            if (labelEl) labelEl.textContent = '電話で問い合わせる';

            // 下段に表示用の番号（未設定なら非表示）
            const num = (opts.telDisplay || '').trim();
            if (telDisp) {
              telDisp.textContent = num;
              telDisp.style.display = num ? 'block' : 'none';
            }

            // アクセシビリティ表現も合わせる
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

      // ===== Facts（key_nameはヒーローとFactsの両方に反映）=====
      setText('key_name_fact', data.key_name);
      setText('key_location', data.key_location);
      setText('key_language', data.key_language);
      setText('key_founded', data.key_founded);
      setText('key_services', data.key_services);
      setText('key_tel_display', data.key_tel_display);
      setLink('key_tel_link', data.key_tel_link);
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
            // ★同時に1つだけ開きたい場合はこのブロックのコメント外してね
            // root.querySelectorAll('.faq-a.open').forEach(open => {
            //   if (open.id !== ddId) closePanel(open, root.querySelector(`.faq-q[aria-controls="${open.id}"]`));
            // });
            openPanel(dd, btn);
          }
        });
      }

      // しゅるん開く（CSSのopenクラスでmax-heightを上げる）
      function openPanel(dd, btn) {
        btn.setAttribute('aria-expanded', 'true');
        const icon = btn.querySelector('.faq-icon'); if (icon) icon.textContent = '−';
        dd.removeAttribute('hidden');  // 測れるようにまず表示
        dd.classList.add('open');      // アニメ開始（max-height↑）
      }

      // しゅるん閉じる（open外して→アニメ終了後にhidden）
      function closePanel(dd, btn) {
        btn.setAttribute('aria-expanded', 'false');
        const icon = btn.querySelector('.faq-icon'); if (icon) icon.textContent = '+';
        dd.classList.remove('open');   // max-height→0（アニメ）
        const onEnd = (ev) => {
          if (ev.propertyName !== 'max-height') return;
          dd.setAttribute('hidden','');        // 完全に閉じたら非表示
          dd.removeEventListener('transitionend', onEnd);
        };
        dd.addEventListener('transitionend', onEnd);
      }

// ============ A) 連絡手段・対応エリア（Key Factsへの追加） ============
setText('service_area', data.service_area || '全国（オンライン対応）');
setText('remote_available', data.remote_available || 'オンライン相談・海外在住OK');


// ============ B) ビザ種別（改行→li） ============
(() => {
  const ul = document.getElementById('visa_types_list');
  if (!ul) return;
  const raw = (data.visa_types || '').trim();
  if (!raw) { ul.closest('section')?.setAttribute('hidden',''); return; }
  ul.innerHTML = ''; // reset
  raw.split('\n').map(s => s.trim()).filter(Boolean).forEach(item => {
    const li = document.createElement('li'); li.textContent = item; ul.appendChild(li);
  });
})();

// --- 料金のゆれ吸収＆整形（¥88,000 / ¥88,000〜120,000 / 無料 / 応相談 など対応）---
const normalizePrice = (s) => {
  if (!s) return '';
  // 事前トリム＆全角→半角、記号ゆれ吸収
  let t = String(s).trim()
    .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)) // 全角数字
    .replace(/[￥]/g, '¥')               // 円記号統一
    .replace(/[，、]/g, ',')             // カンマ統一
    .replace(/[．。]/g, '.')             // ドット統一
    .replace(/\s+/g, '')                 // 余分な空白除去
    .replace(/円/g, '')                  // “円”は表示時に不要
    .replace(/[~〜]/g, '〜')             // 波ダッシュ統一
    .replace(/[ー–—―－]/g, '-');         // ダッシュ統一

  // 非数値系ワードはそのまま返す
  if (/^(無料|応相談|ASK|ask|Free|free)$/.test(t)) return s;

  // 数値抽出ヘルパ
  const fmt = (numStr) => {
    const n = Number(numStr.replace(/[^\d]/g, ''));
    if (Number.isNaN(n)) return ''; // 数字なし
    return '¥' + n.toLocaleString('ja-JP');
  };

  // レンジ（〜 または -）
  if (/[〜-]/.test(t)) {
    const [left, right] = t.split(/[〜-]/, 2);
    const L = fmt(left);
    const R = fmt(right);
    if (L && R) return `${L}〜${R}`;
    if (L && /〜/.test(t)) return `${L}〜`; // “¥88,000〜”
    return L || s;
  }

  // 単価
  const one = fmt(t);
  return one || s;
};

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

  // 備考
  const noteEl = document.getElementById('pricing_note');
  if (noteEl) noteEl.textContent = (data.pricing_note || '').trim();
})();

// ============ D) 言語の詳細（あれば段落で追記したい場合・任意） ============
// 既存の key_language を詳細に置き換えたいときは下行のコメントを外してね。
// if (data.languages_detail) setText('key_language', data.languages_detail);


      
      // ===== Access（営業時間は改行保持）=====
      setSrc ('access_map', data.access_map);
      setHTML('access_hours', (data.access_hours||'').replace(/\n/g,'<br>'));
      setText('access_address', data.access_address);
      setText('access_station', data.access_station);

      // ===== Final CTA（冗長だが既存互換で維持）=====
      setText('cta_mid2', data.cta_mid2);
      setText('cta_final', data.cta_final);

    })
    .catch(err => console.error('JSON読み込みエラー:', err));
})();
